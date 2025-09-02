// Updated SportradarAPI class with enhanced rate limiting integration

class SportradarAPI {
  private client: AxiosInstance
  public apiKey: string
  private rateLimiter: EnhancedRateLimiter
  private monitor: APIMonitor
  private cache: CacheManager

  constructor(apiKey: string, baseURL?: string) {
    this.apiKey = apiKey
    this.rateLimiter = EnhancedRateLimiter.getInstance() // Use enhanced singleton
    this.monitor = APIMonitor.getInstance()
    this.cache = CacheManager.getInstance()

    // ... existing validation code ...

    this.client = axios.create({
      baseURL: defaultBaseURL,
      timeout: 30000, // Increased timeout for slower trial tier
      headers: {
        "User-Agent": "SoccerPredictionHub/1.0",
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
      },
    })

    // Enhanced response interceptor with header processing
    this.client.interceptors.response.use(
      (response) => {
        // Extract and process rate limit headers
        const rateLimitHeaders = this.extractRateLimitHeaders(response.headers)
        this.rateLimiter.updateFromHeaders(rateLimitHeaders)

        if (import.meta.env.MODE === "development") {
          console.log("📥 API Response:", {
            status: response.status,
            url: response.config.url,
            rateLimitRemaining: rateLimitHeaders['x-ratelimit-remaining'],
            rateLimitReset: rateLimitHeaders['x-ratelimit-reset'],
            dataSize: JSON.stringify(response.data).length,
            timestamp: new Date().toISOString(),
          })
        }
        return response
      },
      async (error) => {
        // Enhanced error handling with header extraction
        const rateLimitHeaders = error.response?.headers ? 
          this.extractRateLimitHeaders(error.response.headers) : {}
        
        if (Object.keys(rateLimitHeaders).length > 0) {
          this.rateLimiter.updateFromHeaders(rateLimitHeaders)
        }

        const errorDetails = {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          retryAfter: error.response?.headers?.['retry-after'],
          rateLimitRemaining: rateLimitHeaders['x-ratelimit-remaining'],
          rateLimitReset: rateLimitHeaders['x-ratelimit-reset'],
          rateLimiterStatus: this.rateLimiter.getStatus(),
          config: {
            url: error.config?.url,
            baseURL: error.config?.baseURL,
            method: error.config?.method,
            hasApiKey: !!error.config?.headers?.["x-api-key"],
            timeout: error.config?.timeout,
          },
          timestamp: new Date().toISOString(),
        }

        if (import.meta.env.MODE === "development") {
          console.error("🚨 Enhanced API Error Details:", JSON.stringify(errorDetails, null, 2))
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
              // Enhanced 429 handling with detailed information
              const resetTime = rateLimitHeaders['x-ratelimit-reset']
              const remaining = rateLimitHeaders['x-ratelimit-remaining']
              
              let message = "Rate limit exceeded: Too many requests"
              if (resetTime) {
                const resetDate = new Date(parseInt(resetTime) * 1000)
                message += ` - Resets at ${resetDate.toISOString()}`
              }
              if (remaining !== undefined) {
                message += ` - Remaining: ${remaining}`
              }

              throw new APIError(message, status, "RATE_LIMIT", retryAfter)
            
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

  // Extract rate limit headers from response
  private extractRateLimitHeaders(headers: any): Record<string, string> {
    const rateLimitHeaders: Record<string, string> = {}
    
    // Common rate limit header variations
    const headerMappings = {
      'x-ratelimit-remaining': ['x-ratelimit-remaining', 'x-rate-limit-remaining', 'ratelimit-remaining'],
      'x-ratelimit-limit': ['x-ratelimit-limit', 'x-rate-limit-limit', 'ratelimit-limit'],
      'x-ratelimit-reset': ['x-ratelimit-reset', 'x-rate-limit-reset', 'ratelimit-reset'],
      'retry-after': ['retry-after']
    }

    Object.entries(headerMappings).forEach(([standardName, variations]) => {
      for (const variation of variations) {
        if (headers[variation] !== undefined) {
          rateLimitHeaders[standardName] = headers[variation]
          break
        }
      }
    })

    return rateLimitHeaders
  }

  // Enhanced request method with priority support
  private async request<T>(endpoint: string, priority: number = 0): Promise<T> {
    const startTime = Date.now()

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

      // Log rate limiter status before request
      console.log("📊 Rate Limiter Status (Pre-Request):", this.rateLimiter.getStatus())
    }

    try {
      const response = await this.rateLimiter.scheduleRequest(
        () => this.client.get<T>(endpoint),
        endpoint,
        priority
      )

      // Cache successful response
      this.cache.setCachedApiResponse(endpoint, response.data)
      this.monitor.recordRequest(endpoint, startTime, "success")

      return response.data
    } catch (error) {
      const isRateLimitError = error instanceof APIError && error.code === "RATE_LIMIT"

      this.monitor.recordRequest(
        endpoint,
        startTime,
        isRateLimitError ? "rate_limited" : "error",
        error instanceof Error ? error : new Error(String(error)),
        {
          rateLimiterStatus: this.rateLimiter.getStatus(),
          priority,
        }
      )

      if (import.meta.env.MODE === "development") {
        console.error(`🚨 API request failed for endpoint:`, endpoint, {
          error: error instanceof Error ? error.message : error,
          rateLimiterStatus: this.rateLimiter.getStatus(),
        })
      }

      throw error
    }
  }

  // Enhanced test connection with detailed reporting
  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      if (import.meta.env.MODE === "development") {
        console.log("🧪 Testing API connection...", {
          baseURL: this.client.defaults.baseURL,
          hasApiKey: !!this.apiKey,
          rateLimiterStatus: this.rateLimiter.getStatus(),
          timestamp: new Date().toISOString(),
        })
      }

      // Use high priority for connection test
      const response = await this.request("/soccer/trial/v4/en/competitions/sr:competition:17/info.json", 2)

      const details = {
        competitionName: response?.competition?.name || "Unknown",
        categoryName: response?.category?.name || "Unknown",
        rateLimiterStatus: this.rateLimiter.getStatus(),
      }

      if (import.meta.env.MODE === "development") {
        console.log("✅ API connection test successful:", details)
      }

      return {
        success: true,
        message: `API connection successful - Competition: ${details.competitionName}`,
        details,
      }
    } catch (error) {
      const details = {
        error: error instanceof APIError ? error.message : String(error),
        code: error instanceof APIError ? error.code : "UNKNOWN",
        status: error instanceof APIError ? error.status : undefined,
        rateLimiterStatus: this.rateLimiter.getStatus(),
      }

      if (import.meta.env.MODE === "development") {
        console.error("🚨 API connection test failed:", details)
      }

      return {
        success: false,
        message: `API connection failed: ${details.error}`,
        details,
      }
    }
  }

  // All other methods remain the same but use the updated request method
  async getCompetitionInfo(competitionId: string): Promise<any> {
    const encodedId = encodeURIComponent(competitionId)
    return this.request(`/soccer/trial/v4/en/competitions/${encodedId}/info.json`)
  }

  async getLiveSummaries(): Promise<any> {
    return this.request("/soccer/trial/v4/en/sport_events/live/summaries.json", 1) // High priority
  }

  async getCompetitions(): Promise<any> {
    return this.request("/soccer/trial/v4/en/competitions.json")
  }

  // ... rest of the methods using this.request() ...
}