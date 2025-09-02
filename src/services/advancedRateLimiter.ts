import { TokenBucketRateLimiter, SPORTRADAR_RATE_LIMITS } from "./tokenBucketRateLimiter"

interface QueuedRequest {
  resolve: (value: any) => void
  reject: (error: any) => void
  requestFn: () => Promise<any>
  retryCount: number
  timestamp: number
}

export class AdvancedRateLimiter {
  private tokenBucket: TokenBucketRateLimiter
  private requestQueue: QueuedRequest[] = []
  private isProcessing = false
  private circuitBreakerFailures = 0
  private circuitBreakerThreshold = 5
  private circuitBreakerResetTime = 300000 // 5 minutes for trial API
  private lastCircuitBreakerTrip = 0
  private maxRetries = 3

  constructor(
    requestsPerSecond: number = 1 / 3, // 1 request per 3 seconds for trial API
    bucketCapacity = 1,
    maxRetries = 3,
  ) {
    this.tokenBucket = new TokenBucketRateLimiter(SPORTRADAR_RATE_LIMITS.trial)
    this.maxRetries = maxRetries
  }

  async makeRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      // Check circuit breaker
      if (this.isCircuitBreakerOpen()) {
        reject(new Error("Circuit breaker is open. Too many consecutive failures."))
        return
      }

      const queuedRequest: QueuedRequest = {
        resolve,
        reject,
        requestFn,
        retryCount: 0,
        timestamp: Date.now(),
      }

      this.requestQueue.push(queuedRequest)
      this.processQueue()
    })
  }

  private isCircuitBreakerOpen(): boolean {
    if (this.circuitBreakerFailures >= this.circuitBreakerThreshold) {
      const timeSinceTrip = Date.now() - this.lastCircuitBreakerTrip
      if (timeSinceTrip < this.circuitBreakerResetTime) {
        return true
      } else {
        // Reset circuit breaker
        this.circuitBreakerFailures = 0
        this.lastCircuitBreakerTrip = 0
      }
    }
    return false
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return
    }

    this.isProcessing = true

    try {
      while (this.requestQueue.length > 0) {
        const request = this.requestQueue.shift()!

        try {
          // Wait for token availability
          await this.waitForToken()

          // Execute the request
          const result = await request.requestFn()

          // Success - reset circuit breaker failures
          this.circuitBreakerFailures = 0
          request.resolve(result)
        } catch (error: any) {
          await this.handleRequestError(request, error)
        }
      }
    } finally {
      this.isProcessing = false
    }
  }

  private async waitForToken(): Promise<void> {
    while (!this.tokenBucket.consume(1)) {
      const waitTime = this.tokenBucket.getTimeUntilNextToken()
      if (import.meta.env.MODE === "development") {
        console.log(`⏳ Waiting ${waitTime}ms for next token...`)
      }
      await new Promise((resolve) => setTimeout(resolve, waitTime))
    }
  }

  private async handleRequestError(request: QueuedRequest, error: any): Promise<void> {
    const isRateLimitError =
      error.status === 429 || (error.message && error.message.toLowerCase().includes("rate limit"))

    if (isRateLimitError) {
      // Handle rate limit error with exponential backoff
      const backoffDelay = this.calculateBackoffDelay(request.retryCount, error)

      if (request.retryCount < this.maxRetries) {
        request.retryCount++

        if (import.meta.env.MODE === "development") {
          console.log(`🔄 Retrying request (attempt ${request.retryCount}/${this.maxRetries}) after ${backoffDelay}ms`)
        }

        // Wait for backoff delay, then retry
        setTimeout(() => {
          this.requestQueue.unshift(request) // Add back to front of queue
          this.processQueue()
        }, backoffDelay)

        return
      }
    }

    // Max retries reached or non-retryable error
    this.circuitBreakerFailures++
    if (this.circuitBreakerFailures >= this.circuitBreakerThreshold) {
      this.lastCircuitBreakerTrip = Date.now()
      if (import.meta.env.MODE === "development") {
        console.error("🚨 CIRCUIT BREAKER OPENED - API requests suspended for 1 minute")
      }
    }

    request.reject(error)
  }

  private calculateBackoffDelay(retryCount: number, error: any): number {
    // Check for Retry-After header from APIError or response headers
    const retryAfter = error.retryAfter || error.headers?.["retry-after"]
    if (retryAfter) {
      return Number.parseInt(retryAfter) * 1000 // Convert to milliseconds
    }

    // Enhanced backoff for 429 errors - much more aggressive
    const is429Error = error.status === 429 || error.message?.includes('429') || error.message?.includes('Rate limit')
    const baseDelay = is429Error ? 120000 : 30000 // 2 minutes for 429, 30 seconds for others
    const exponentialDelay = baseDelay * Math.pow(2, retryCount)
    const jitter = Math.random() * 1000 // Add up to 1 second of jitter

    return Math.min(exponentialDelay + jitter, is429Error ? 900000 : 300000) // Cap at 15min for 429, 5min for others
  }

  getQueueLength(): number {
    return this.requestQueue.length
  }

  getCircuitBreakerStatus(): { isOpen: boolean; failures: number; threshold: number } {
    return {
      isOpen: this.isCircuitBreakerOpen(),
      failures: this.circuitBreakerFailures,
      threshold: this.circuitBreakerThreshold,
    }
  }

  destroy(): void {
    this.tokenBucket.destroy()
  }
}
