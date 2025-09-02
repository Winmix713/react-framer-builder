// Enhanced Rate Limiting Solution with Header-Based Dynamic Adjustment

class EnhancedRateLimiter {
  private requests: number[] = []
  private static instance: EnhancedRateLimiter | null = null
  private maxRequests: number
  private timeWindow: number
  private retryCount = 0

  // Header-based rate limit tracking
  private remainingRequests: number | null = null
  private resetTime: number | null = null
  private lastHeaderUpdate: number = 0

  // Queue properties with priority support
  private requestQueue: {
    priority: number // 0 = normal, 1 = high, 2 = critical
    execute: () => Promise<any>
    resolve: (value: any) => void
    reject: (reason?: any) => void
    endpoint: string
    timestamp: number
  }[] = []
  private isProcessing = false

  // Enhanced circuit breaker
  private circuitBreakerOpen = false
  private circuitBreakerOpenTime = 0
  private consecutiveFailures = 0
  private readonly maxConsecutiveFailures: number = 3 // More sensitive
  private readonly circuitBreakerTimeout: number = 300000 // 5 minutes

  // API tier detection
  private apiTier: 'trial' | 'production' | 'unknown' = 'trial'
  private minimumRequestInterval: number

  private constructor() {
    this.detectAndConfigureApiTier()
  }

  static getInstance(): EnhancedRateLimiter {
    if (!EnhancedRateLimiter.instance) {
      EnhancedRateLimiter.instance = new EnhancedRateLimiter()
    }
    return EnhancedRateLimiter.instance
  }

  // Detect API tier and configure appropriate limits
  private detectAndConfigureApiTier(): void {
    // Default to most restrictive (trial) settings
    this.apiTier = 'trial'
    this.maxRequests = 1
    this.timeWindow = 120000 // 2 minutes
    this.minimumRequestInterval = 120000 // 2 minutes between requests

    if (import.meta.env.MODE === "development") {
      console.log("🔧 Rate Limiter Configuration:", {
        apiTier: this.apiTier,
        maxRequests: this.maxRequests,
        timeWindowMs: this.timeWindow,
        minimumIntervalMs: this.minimumRequestInterval
      })
    }
  }

  // Update limits based on API response headers
  updateFromHeaders(headers: Record<string, string>): void {
    const now = Date.now()
    
    // Parse standard rate limit headers
    const remaining = headers['x-ratelimit-remaining'] || headers['x-rate-limit-remaining']
    const reset = headers['x-ratelimit-reset'] || headers['x-rate-limit-reset']
    const limit = headers['x-ratelimit-limit'] || headers['x-rate-limit-limit']

    if (remaining !== undefined) {
      this.remainingRequests = parseInt(remaining)
      this.lastHeaderUpdate = now
    }

    if (reset !== undefined) {
      this.resetTime = parseInt(reset) * 1000 // Convert to milliseconds
    }

    if (limit !== undefined && this.apiTier === 'unknown') {
      const limitNum = parseInt(limit)
      // Detect tier based on limit
      if (limitNum <= 10) {
        this.apiTier = 'trial'
        this.maxRequests = Math.min(limitNum, 1)
        this.timeWindow = 120000
      } else {
        this.apiTier = 'production' 
        this.maxRequests = Math.min(limitNum, 50)
        this.timeWindow = 60000
      }
    }

    if (import.meta.env.MODE === "development") {
      console.log("📊 Rate Limit Headers Update:", {
        remaining: this.remainingRequests,
        resetTime: new Date(this.resetTime || 0).toISOString(),
        detectedTier: this.apiTier,
        currentLimits: { max: this.maxRequests, window: this.timeWindow }
      })
    }
  }

  // Enhanced request permission check
  canMakeRequest(): boolean {
    const now = Date.now()

    // Circuit breaker check
    if (this.circuitBreakerOpen) {
      if (now - this.circuitBreakerOpenTime > this.circuitBreakerTimeout) {
        console.log("🔄 Circuit breaker closing - attempting recovery")
        this.circuitBreakerOpen = false
        this.consecutiveFailures = 0
      } else {
        return false
      }
    }

    // Header-based check (most accurate)
    if (this.remainingRequests !== null && now - this.lastHeaderUpdate < 30000) {
      if (this.remainingRequests <= 0) {
        return false
      }
    }

    // Minimum interval check (always enforced)
    const timeSinceLastRequest = now - Math.max(...this.requests, 0)
    if (this.requests.length > 0 && timeSinceLastRequest < this.minimumRequestInterval) {
      return false
    }

    // Window-based check (fallback)
    this.requests = this.requests.filter((time) => now - time < this.timeWindow)
    return this.requests.length < this.maxRequests
  }

  // Enhanced request recording
  recordRequest(headers?: Record<string, string>): void {
    const now = Date.now()
    this.requests.push(now)
    this.retryCount = 0
    this.consecutiveFailures = 0

    // Update from response headers if available
    if (headers) {
      this.updateFromHeaders(headers)
    }

    // Decrement remaining count if tracking via headers
    if (this.remainingRequests !== null) {
      this.remainingRequests = Math.max(0, this.remainingRequests - 1)
    }
  }

  // Enhanced failure recording
  recordFailure(): void {
    this.consecutiveFailures++
    if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
      this.circuitBreakerOpen = true
      this.circuitBreakerOpenTime = Date.now()
      console.error(`🚨 CIRCUIT BREAKER OPENED - ${this.consecutiveFailures} consecutive failures`)
    }
  }

  // Intelligent retry delay calculation
  getRetryDelay(retryAfterHeader?: number, isRateLimitError: boolean = false): number {
    // Use server-provided retry-after if available
    if (retryAfterHeader) {
      return retryAfterHeader * 1000
    }

    // For rate limit errors, use more conservative delays
    if (isRateLimitError) {
      if (this.resetTime && Date.now() < this.resetTime) {
        // Wait until rate limit window resets, plus buffer
        return (this.resetTime - Date.now()) + 30000 // 30s buffer
      }
      // Fallback: aggressive exponential backoff for rate limits
      return Math.min(300000, 120000 * Math.pow(2, this.retryCount)) // 2min, 4min, 5min max
    }

    // Standard exponential backoff for other errors
    const baseDelay = 30000 // 30 seconds
    const exponentialDelay = baseDelay * Math.pow(2, this.retryCount)
    const maxDelay = 300000 // 5 minutes maximum
    const jitter = Math.random() * 10000 // 0-10 seconds jitter
    
    this.retryCount++
    return Math.min(exponentialDelay, maxDelay) + jitter
  }

  // Priority-based request scheduling
  scheduleRequest<T>(
    requestFn: () => Promise<T>, 
    endpoint: string,
    priority: number = 0
  ): Promise<T> {
    if (this.circuitBreakerOpen && Date.now() - this.circuitBreakerOpenTime < this.circuitBreakerTimeout) {
      return Promise.reject(new Error("Circuit breaker is open - API requests suspended"))
    }

    return new Promise((resolve, reject) => {
      const request = {
        priority,
        execute: requestFn,
        resolve,
        reject,
        endpoint,
        timestamp: Date.now()
      }

      // Insert based on priority (higher priority first)
      const insertIndex = this.requestQueue.findIndex(r => r.priority < priority)
      if (insertIndex === -1) {
        this.requestQueue.push(request)
      } else {
        this.requestQueue.splice(insertIndex, 0, request)
      }

      // Start processing
      setTimeout(() => this.processQueue(), 0)
    })
  }

  // Enhanced queue processing with better error handling
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return
    }

    this.isProcessing = true

    try {
      while (this.requestQueue.length > 0) {
        await this.processSingleRequest()
        
        // Small delay between queue items to prevent rapid-fire requests
        if (this.requestQueue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    } finally {
      this.isProcessing = false
    }
  }

  // Robust single request processing
  private async processSingleRequest(): Promise<void> {
    if (this.requestQueue.length === 0) return

    // Wait until we can make a request
    let waitCount = 0
    while (!this.canMakeRequest()) {
      waitCount++
      const waitTime = Math.min(5000 * waitCount, 30000) // Progressive wait: 5s, 10s, 15s, max 30s
      await new Promise((resolve) => setTimeout(resolve, waitTime))
      
      // Safety check: if we've been waiting too long, something might be wrong
      if (waitCount > 20) {
        console.warn("⚠️ Excessive wait time in rate limiter queue processing")
        break
      }
    }

    const request = this.requestQueue.shift()
    if (!request) return

    const maxRetries = 2
    let attempt = 1

    while (attempt <= maxRetries) {
      try {
        // Final check before execution
        if (!this.canMakeRequest()) {
          await new Promise(resolve => setTimeout(resolve, 5000))
          continue
        }

        const result = await request.execute()
        
        // Success - record and resolve
        this.recordRequest()
        request.resolve(result)
        return

      } catch (error: any) {
        const isRateLimitError = error?.response?.status === 429 || 
          error?.message?.includes("Rate limit") ||
          error?.message?.includes("status code 429")

        if (isRateLimitError) {
          this.recordFailure()
        }

        if (import.meta.env.MODE === "development") {
          console.error(`🚨 Request failed (attempt ${attempt}/${maxRetries}):`, {
            endpoint: request.endpoint,
            error: error.message,
            isRateLimitError,
            queueLength: this.requestQueue.length
          })
        }

        if (attempt >= maxRetries) {
          request.reject(error)
          return
        }

        // Calculate retry delay
        const retryAfter = error?.response?.headers?.['retry-after']
        const delay = this.getRetryDelay(retryAfter ? parseInt(retryAfter) : undefined, isRateLimitError)
        
        console.log(`⏳ Waiting ${delay}ms before retry attempt ${attempt + 1}`)
        await new Promise(resolve => setTimeout(resolve, delay))
        
        attempt++
      }
    }
  }

  // Status reporting for monitoring
  getStatus() {
    const now = Date.now()
    return {
      apiTier: this.apiTier,
      queueLength: this.requestQueue.length,
      circuitBreakerOpen: this.circuitBreakerOpen,
      consecutiveFailures: this.consecutiveFailures,
      remainingRequests: this.remainingRequests,
      timeUntilReset: this.resetTime ? Math.max(0, this.resetTime - now) : null,
      canMakeRequest: this.canMakeRequest(),
      recentRequests: this.requests.length,
      isProcessing: this.isProcessing
    }
  }
}