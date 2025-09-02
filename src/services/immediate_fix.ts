// IMMEDIATE FIX: Update RateLimiter constructor in sportradarAPI.ts

private constructor(maxRequests = 50, timeWindowMs = 60000) {
  // CRITICAL FIX: Adjust for Sportradar trial tier limits
  this.maxRequests = 1; // Only 1 request allowed for trial keys
  this.timeWindow = 120000; // 2 minutes between requests (ultra conservative)
  this.minimumRequestInterval = 120000; // 2 minutes minimum between requests
}

// CRITICAL FIX: Update processSingleRequest method
private async processSingleRequest(): Promise<void> {
  if (this.requestQueue.length === 0) return

  // Wait until we have a free slot BEFORE dequeuing
  while (!this.canMakeRequest()) {
    await new Promise((resolve) => setTimeout(resolve, 5000)) // 5 second poll (increased)
  }

  const nextRequest = this.requestQueue.shift()
  if (!nextRequest) return

  const maxRetries = 1
  let lastError: any = null

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      // CRITICAL FIX: Record request AFTER confirming slot availability
      // but BEFORE making the actual request
      if (!this.canMakeRequest()) {
        // If slot became unavailable, wait longer
        await new Promise((resolve) => setTimeout(resolve, 10000))
        continue
      }
      
      this.recordRequest()
      const result = await nextRequest.execute()
      nextRequest.resolve(result)
      return // Success - exit
    } catch (error) {
      lastError = error
      this.recordFailure()

      // Check if it's a 429 error
      const is429Error =
        error instanceof Error &&
        (error.message.includes("status code 429") || error.message.includes("Rate limit exceeded"))

      if (import.meta.env.MODE === "development") {
        console.error(`🚨 Request failed (attempt ${attempt}/${maxRetries + 1}):`, error.message)
      }

      // If this is the last attempt, reject with the error
      if (attempt > maxRetries) {
        nextRequest.reject(error)
        return
      }

      // CRITICAL FIX: Much longer waits for rate limit errors
      if (is429Error) {
        await this.waitForRetry(300) // Wait 5 minutes for 429 errors
      } else {
        await this.waitForRetry(120) // Wait 2 minutes for other errors
      }
    }
  }
}

// CRITICAL FIX: Update getRetryDelay with proper exponential backoff
getRetryDelay(retryAfterHeader?: number): number {
  // Use server-provided retry-after if available
  if (retryAfterHeader) {
    return retryAfterHeader * 1000 // Convert seconds to milliseconds
  }

  // CRITICAL FIX: Start with higher base delay for trial tier
  const baseDelay = 120000 // 2 minutes base
  const exponentialDelay = baseDelay * Math.pow(2, this.retryCount)
  const maxDelay = 600000 // 10 minutes maximum
  
  const delay = Math.min(exponentialDelay, maxDelay)
  
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 30000 // Up to 30 seconds jitter
  
  this.retryCount++
  return delay + jitter
}