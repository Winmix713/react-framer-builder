import axios, { type AxiosInstance } from "axios"
import { validateSportradarEndpoint, logEndpointValidation } from "../utils/urlValidator"
import APIMonitor from "./apiMonitor"
import CacheManager from "./cacheManager"
import { AdvancedRateLimiter } from "./advancedRateLimiter"
import RequestDeduplicator from "./requestDeduplicator"

// API Error class for better error handling
export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public retryAfter?: number,
  ) {
    super(message)
    this.name = "APIError"
  }
}

// Sportradar API client class with advanced rate limiting
class SportradarAPI {
  private client: AxiosInstance
  public apiKey: string
  private rateLimiter: AdvancedRateLimiter
  private monitor: APIMonitor
  private cache: CacheManager
  private deduplicator: RequestDeduplicator

  constructor(apiKey: string, baseURL?: string) {
    this.apiKey = apiKey
    this.rateLimiter = new AdvancedRateLimiter(1/90, 1, 1) // 1 request per 90 seconds, capacity 1, max 1 retry
    this.monitor = APIMonitor.getInstance()
    this.cache = CacheManager.getInstance()
    this.deduplicator = RequestDeduplicator.getInstance()

    // Enhanced API key validation
    if (!apiKey || apiKey.trim() === "") {
      console.error("🚨 API Key Error: No API key provided")
      throw new APIError("API key is required", undefined, "MISSING_API_KEY")
    }

    if (apiKey.length < 20) {
      console.error("🚨 API Key Error: Invalid format - too short")
      throw new APIError("Invalid API key format", undefined, "INVALID_API_KEY_FORMAT")
    }

    // Log API key status (safely)
    if (import.meta.env.MODE === "development") {
      console.log("🔑 API Key Status:", {
        hasKey: !!apiKey,
        keyLength: apiKey.length,
        keyPreview: `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`,
        timestamp: new Date().toISOString(),
      })
    }

    // Version-aware base URL configuration
    const isDevelopment = import.meta.env.MODE === "development"
    const envBaseURL = import.meta.env.VITE_SPORTRADAR_BASE_URL
    const fallbackBaseURL = "https://api.sportradar.com/soccer/trial/v4/en"

    const defaultBaseURL =
      baseURL ||
      (isDevelopment
        ? "/api/sportradar"
        : envBaseURL || fallbackBaseURL)

    if (import.meta.env.MODE === "development") {
      console.log("🔧 Base URL Configuration:", {
        isDevelopment,
        providedBaseURL: baseURL,
        envBaseURL,
        fallbackBaseURL,
        finalBaseURL: defaultBaseURL,
        usingProxy: isDevelopment,
        timestamp: new Date().toISOString(),
      })
    }

    this.client = axios.create({
      baseURL: defaultBaseURL,
      timeout: 30000, // Increased timeout for trial API
      headers: {
        "User-Agent": "SoccerPredictionHub/1.0 (https://localhost:5173)",
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      params: {
        api_key: this.apiKey,
      },
    })

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        if (import.meta.env.MODE === "development") {
          console.log("📤 API Request:", {
            url: config.url,
            baseURL: config.baseURL,
            method: config.method?.toUpperCase(),
            hasApiKeyParam: !!(config.params as any)?.api_key,
            timestamp: new Date().toISOString(),
          })
        }
        return config
      },
      (error) => Promise.reject(error),
    )

    // Enhanced response interceptor
    this.client.interceptors.response.use(
      (response) => {
        if (import.meta.env.MODE === "development") {
          console.log("📥 API Response:", {
            status: response.status,
            url: response.config.url,
            dataSize: JSON.stringify(response.data).length,
            timestamp: new Date().toISOString(),
          })
        }
        return response
      },
      async (error) => {
        const errorDetails = {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          retryAfter: error.response?.headers?.["retry-after"],
          config: {
            url: error.config?.url,
            baseURL: error.config?.baseURL,
            method: error.config?.method,
            hasApiKeyParam: !!(error.config?.params as any)?.api_key,
            timeout: error.config?.timeout,
          },
          timestamp: new Date().toISOString(),
        }

        if (import.meta.env.MODE === "development") {
          console.error("🚨 API Error Details:", JSON.stringify(errorDetails, null, 2))
        }

        if (error.response) {
          const status = error.response.status
          const retryAfter = error.response.headers["retry-after"]
            ? Number.parseInt(error.response.headers["retry-after"])
            : undefined

          switch (status) {
            case 401:
              throw new APIError(
                "Unauthorized: Invalid API key or incorrect authentication method",
                status,
                "INVALID_API_KEY",
              )
            case 403:
              throw new APIError("Forbidden: API key lacks required permissions", status, "INSUFFICIENT_PERMISSIONS")
            case 429:
              throw new APIError("Rate limit exceeded: Too many requests", status, "RATE_LIMIT", retryAfter)
            case 404:
              throw new APIError(
                `Resource not found: ${error.config.url} - Check endpoint URL and competition ID`,
                status,
                "NOT_FOUND",
              )
            case 500:
              throw new APIError("Server error: Sportradar API is experiencing issues", status, "SERVER_ERROR")
            case 503:
              throw new APIError("Service unavailable: API temporarily down", status, "SERVICE_UNAVAILABLE", retryAfter)
            default:
              throw new APIError(
                `API Error: ${error.response.data?.message || error.response.statusText}`,
                status,
                error.response.data?.code,
              )
          }
        } else if (error.request) {
          if (error.code === "ECONNABORTED") {
            throw new APIError("Request timeout: API took too long to respond", undefined, "TIMEOUT")
          } else if (error.code === "ENOTFOUND") {
            throw new APIError("Network error: Unable to reach API server", undefined, "DNS_ERROR")
          } else {
            throw new APIError("Network error: Unable to connect to API", undefined, "NETWORK_ERROR")
          }
        } else {
          throw new APIError(`API Error: ${error.message}`, undefined, "UNKNOWN")
        }
      },
    )
  }

  private async request<T>(endpoint: string): Promise<T> {
    const startTime = Date.now()
    const deduplicationKey = `${this.client.defaults.baseURL}${endpoint}`

    // Use request deduplication to prevent multiple simultaneous calls
    return this.deduplicator.deduplicate(deduplicationKey, async () => {
      // Check cache first
      const cachedData = this.cache.getCachedApiResponse<T>(endpoint)
      if (cachedData) {
        this.monitor.recordRequest(endpoint, startTime, "success")
        return cachedData
      }

      // Validate endpoint structure in development
      if (import.meta.env.MODE === "development") {
        const validation = validateSportradarEndpoint(endpoint)
        logEndpointValidation(endpoint, validation)
      }

      try {
        const response = await this.rateLimiter.makeRequest(() => this.client.get<T>(endpoint))

        // Cache successful response with appropriate TTL
        const ttl = this.getTTLForEndpoint(endpoint)
        this.cache.setCachedApiResponse(endpoint, response.data, ttl)
        this.monitor.recordRequest(endpoint, startTime, "success")

        return response.data
      } catch (error) {
        const isRateLimitError = error instanceof APIError && error.code === "RATE_LIMIT"

        this.monitor.recordRequest(
          endpoint,
          startTime,
          isRateLimitError ? "rate_limited" : "error",
          error instanceof Error ? error : new Error(String(error)),
        )

        if (import.meta.env.MODE === "development") {
          console.error(`🚨 API request failed for endpoint:`, endpoint, error)
        }

        throw error
      }
    })
  }

  private getTTLForEndpoint(endpoint: string): number {
    // Ultra-conservative caching for trial API
    if (endpoint.includes('/live/')) return 120000 // 2 minutes for live data
    if (endpoint.includes('/schedules/')) return 8 * 60 * 60 * 1000 // 8 hours for daily schedules
    if (endpoint.includes('/competitions')) return 24 * 60 * 60 * 1000 // 24 hours for competitions
    if (endpoint.includes('/standings')) return 4 * 60 * 60 * 1000 // 4 hours for standings
    if (endpoint.includes('/statistics')) return 12 * 60 * 60 * 1000 // 12 hours for statistics
    
    return 60 * 60 * 1000 // 1 hour default
  }

  // Test API connection
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (import.meta.env.MODE === "development") {
        console.log("🧪 Testing API connection with competition info endpoint...", {
          baseURL: this.client.defaults.baseURL,
          hasApiKey: !!this.apiKey,
          timestamp: new Date().toISOString(),
        })
      }

      const response = await this.request<{ competition?: { name?: string } }>("/soccer/trial/v4/en/competitions/sr:competition:17/info.json")

      if (import.meta.env.MODE === "development") {
        console.log("✅ API connection test successful:", {
          competitionName: response?.competition?.name || "Unknown",
          timestamp: new Date().toISOString(),
        })
      }

      return {
        success: true,
        message: `API connection successful - Competition: ${response?.competition?.name || "Unknown"}`,
      }
    } catch (error) {
      if (import.meta.env.MODE === "development") {
        console.error("🚨 API connection test failed:", {
          error: error instanceof APIError ? error.message : error,
          code: error instanceof APIError ? error.code : "UNKNOWN",
          status: error instanceof APIError ? error.status : undefined,
          timestamp: new Date().toISOString(),
        })
      }
      throw error
    }
  }

  // API Methods with ultra-conservative approach
  async getCompetitionInfo(competitionId: string): Promise<any> {
    const encodedId = encodeURIComponent(competitionId)
    return this.request(`/soccer/trial/v4/en/competitions/${encodedId}/info.json`)
  }

  async getLiveSummaries(): Promise<any> {
    return this.request("/soccer/trial/v4/en/sport_events/live/summaries.json")
  }

  async getCompetitions(): Promise<any> {
    return this.request("/soccer/trial/v4/en/competitions.json")
  }

  async getDailySummaries(date: string): Promise<any> {
    return this.request(`/soccer/trial/v4/en/schedules/${date}/summaries.json`)
  }

  async getMatchSummary(matchId: string): Promise<any> {
    const encodedId = encodeURIComponent(matchId)
    return this.request(`/soccer/trial/v4/en/sport_events/${encodedId}/summary.json`)
  }

  async getSeasonSchedule(seasonId: string): Promise<any> {
    const encodedId = encodeURIComponent(seasonId)
    return this.request(`/soccer/trial/v4/en/seasons/${encodedId}/schedules.json`)
  }

  async getSeasonStandings(seasonId: string): Promise<any> {
    const encodedId = encodeURIComponent(seasonId)
    return this.request(`/soccer/trial/v4/en/seasons/${encodedId}/standings.json`)
  }

  async getSeasonOverUnderStats(seasonId: string): Promise<any> {
    const encodedId = encodeURIComponent(seasonId)
    return this.request(`/soccer/trial/v4/en/seasons/${encodedId}/statistics.json`)
  }

  async getCompetitorVsCompetitor(homeId: string, awayId: string): Promise<any> {
    const encodedHomeId = encodeURIComponent(homeId)
    const encodedAwayId = encodeURIComponent(awayId)
    return this.request(`/soccer/trial/v4/en/competitors/${encodedHomeId}/versus/${encodedAwayId}/matches.json`)
  }
}

// Singleton instance storage
let apiInstance: SportradarAPI | null = null

// Factory function to get API instance
export const getAPIInstance = (apiKey: string, baseURL?: string): SportradarAPI => {
  if (apiInstance && apiInstance["apiKey"] === apiKey) {
    return apiInstance
  }

  apiInstance = new SportradarAPI(apiKey, baseURL)
  return apiInstance
}

export default SportradarAPI