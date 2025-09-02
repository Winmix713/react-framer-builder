// Advanced Token Bucket Rate Limiter for SportRadar API
// Provides more precise rate limiting with burst capacity

export interface TokenBucketConfig {
  capacity: number // Maximum tokens in bucket
  refillRate: number // Tokens added per second
  refillInterval: number // How often to refill (ms)
  initialTokens?: number // Starting token count
}

export class TokenBucketRateLimiter {
  private tokens: number
  private lastRefill: number
  private readonly capacity: number
  private readonly refillRate: number
  private readonly refillInterval: number
  private refillTimer: NodeJS.Timeout | null = null

  constructor(config: TokenBucketConfig) {
    this.capacity = config.capacity
    this.refillRate = config.refillRate
    this.refillInterval = config.refillInterval
    this.tokens = config.initialTokens ?? config.capacity
    this.lastRefill = Date.now()

    this.startRefillTimer()
  }

  private startRefillTimer(): void {
    this.refillTimer = setInterval(() => {
      this.refillTokens()
    }, this.refillInterval)
  }

  private refillTokens(): void {
    const now = Date.now()
    const timePassed = now - this.lastRefill
    const tokensToAdd = Math.floor((timePassed / 1000) * this.refillRate)

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd)
      this.lastRefill = now

      if (import.meta.env.MODE === "development") {
        console.log(`🪣 Token bucket refilled: ${this.tokens}/${this.capacity} tokens available`)
      }
    }
  }

  canConsume(tokens = 1): boolean {
    this.refillTokens() // Ensure tokens are up to date
    return this.tokens >= tokens
  }

  consume(tokens = 1): boolean {
    if (this.canConsume(tokens)) {
      this.tokens -= tokens
      return true
    }
    return false
  }

  getAvailableTokens(): number {
    this.refillTokens()
    return this.tokens
  }

  getTimeUntilNextToken(): number {
    if (this.tokens > 0) return 0

    const tokensNeeded = 1
    const timePerToken = 1000 / this.refillRate // ms per token
    return Math.ceil(tokensNeeded * timePerToken)
  }

  destroy(): void {
    if (this.refillTimer) {
      clearInterval(this.refillTimer)
      this.refillTimer = null
    }
  }
}

// SportRadar-specific configuration
export const SPORTRADAR_RATE_LIMITS = {
  trial: {
    capacity: 1, // 1 request burst capacity
    refillRate: 1 / 90, // 1 token every 90 seconds (extra conservative for trial)
    refillInterval: 1000, // Check every second
    initialTokens: 1,
  },
  production: {
    capacity: 10, // 10 request burst capacity
    refillRate: 5, // 5 tokens per second
    refillInterval: 200, // Check every 200ms
    initialTokens: 5,
  },
}
