// Enhanced monitoring and configuration for rate limiting

// Environment configuration (.env file additions)
/*
# Rate Limiting Configuration
VITE_SPORTRADAR_MAX_REQUESTS=1
VITE_SPORTRADAR_TIME_WINDOW=120000
VITE_SPORTRADAR_MIN_INTERVAL=120000
VITE_SPORTRADAR_CIRCUIT_BREAKER_THRESHOLD=3
VITE_SPORTRADAR_CIRCUIT_BREAKER_TIMEOUT=300000

# API Configuration  
VITE_SPORTRADAR_API_TIER=trial
VITE_SPORTRADAR_TIMEOUT=30000
VITE_SPORTRADAR_MAX_RETRIES=2

# Monitoring
VITE_ENABLE_RATE_LIMIT_MONITORING=true
VITE_LOG_LEVEL=debug
*/

// Enhanced API Monitor with Rate Limiting Metrics
class EnhancedAPIMonitor {
  private static instance: EnhancedAPIMonitor | null = null
  private metrics: Array<{
    timestamp: string
    endpoint: string
    status: 'success' | 'error' | 'rate_limited' | 'circuit_breaker'
    duration: number
    error?: string
    rateLimitInfo?: {
      remainingRequests?: number
      resetTime?: number
      queueLength?: number
      circuitBreakerOpen?: boolean
    }
    retryCount?: number
    priority?: number
  }> = []

  private rateLimitViolations = 0
  private circuitBreakerActivations = 0
  private totalRequests = 0
  private successfulRequests = 0

  static getInstance(): EnhancedAPIMonitor {
    if (!EnhancedAPIMonitor.instance) {
      EnhancedAPIMonitor.instance = new EnhancedAPIMonitor()
    }
    return EnhancedAPIMonitor.instance
  }

  recordRequest(
    endpoint: string,
    startTime: number,
    status: 'success' | 'error' | 'rate_limited' | 'circuit_breaker',
    error?: Error,
    metadata?: {
      rateLimiterStatus?: any
      retryCount?: number
      priority?: number
    }
  ): void {
    const duration = Date.now() - startTime
    this.totalRequests++

    if (status === 'success') {
      this.successfulRequests++
    } else if (status === 'rate_limited') {
      this.rateLimitViolations++
    } else if (status === 'circuit_breaker') {
      this.circuitBreakerActivations++
    }

    const metric = {
      timestamp: new Date().toISOString(),
      endpoint,
      status,
      duration,
      error: error?.message,
      rateLimitInfo: metadata?.rateLimiterStatus ? {
        remainingRequests: metadata.rateLimiterStatus.remainingRequests,
        resetTime: metadata.rateLimiterStatus.timeUntilReset,
        queueLength: metadata.rateLimiterStatus.queueLength,
        circuitBreakerOpen: metadata.rateLimiterStatus.circuitBreakerOpen
      } : undefined,
      retryCount: metadata?.retryCount,
      priority: metadata?.priority
    }

    this.metrics.push(metric)

    // Keep only last 100 metrics to prevent memory bloat
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100)
    }

    // Log critical events
    if (status === 'rate_limited' || status === 'circuit_breaker') {
      console.warn(`⚠️ ${status.toUpperCase()} event:`, {
        endpoint,
        duration,
        rateLimitViolations: this.rateLimitViolations,
        circuitBreakerActivations: this.circuitBreakerActivations,
        successRate: this.getSuccessRate()
      })
    }
  }

  getMetrics() {
    return {
      totalRequests: this.totalRequests,
      successfulRequests: this.successfulRequests,
      rateLimitViolations: this.rateLimitViolations,
      circuitBreakerActivations: this.circuitBreakerActivations,
      successRate: this.getSuccessRate(),
      recentMetrics: this.metrics.slice(-10), // Last 10 requests
      averageResponseTime: this.getAverageResponseTime()
    }
  }

  private getSuccessRate(): number {
    return this.totalRequests > 0 ? (this.successfulRequests / this.totalRequests) * 100 : 0
  }

  private getAverageResponseTime(): number {
    const successfulMetrics = this.metrics.filter(m => m.status === 'success')
    if (successfulMetrics.length === 0) return 0
    
    const totalTime = successfulMetrics.reduce((sum, m) => sum + m.duration, 0)
    return totalTime / successfulMetrics.length
  }

  // Generate detailed report for debugging
  generateReport(): string {
    const metrics = this.getMetrics()
    const now = new Date().toISOString()
    
    return `
# API Rate Limiting Report - ${now}

## Summary Statistics
- Total Requests: ${metrics.totalRequests}
- Successful Requests: ${metrics.successfulRequests}
- Success Rate: ${metrics.successRate.toFixed(2)}%
- Rate Limit Violations: ${metrics.rateLimitViolations}
- Circuit Breaker Activations: ${metrics.circuitBreakerActivations}
- Average Response Time: ${metrics.averageResponseTime.toFixed(0)}ms

## Recent Activity (Last 10 Requests)
${metrics.recentMetrics.map(m => 
  `- ${m.timestamp} | ${m.endpoint} | ${m.status.toUpperCase()} | ${m.duration}ms${m.error ? ` | ${m.error}` : ''}`
).join('\n')}

## Recommendations
${this.generateRecommendations(metrics)}
    `.trim()
  }

  private generateRecommendations(metrics: any): string {
    const recommendations: string[] = []
    
    if (metrics.rateLimitViolations > 0) {
      recommendations.push("- Consider increasing minimum request interval")
      recommendations.push("- Implement request batching where possible")
    }
    
    if (metrics.successRate < 90) {
      recommendations.push("- Review error handling and retry logic")
      recommendations.push("- Check API key permissions and quota")
    }
    
    if (metrics.circuitBreakerActivations > 0) {
      recommendations.push("- Circuit breaker activated - check API health")
      recommendations.push("- Consider implementing exponential backoff")
    }
    
    if (metrics.averageResponseTime > 5000) {
      recommendations.push("- API responses are slow - consider caching strategies")
      recommendations.push("- Increase request timeout if needed")
    }
    
    if (recommendations.length === 0) {
      recommendations.push("- Rate limiting is working well!")
    }
    
    return recommendations.join('\n')
  }

  // Reset metrics (useful for testing)
  reset(): void {
    this.metrics = []
    this.rateLimitViolations = 0
    this.circuitBreakerActivations = 0
    this.totalRequests = 0
    this.successfulRequests = 0
  }
}

// Configuration utility
class RateLimitConfig {
  static getConfig() {
    const isProduction = import.meta.env.PROD
    const apiTier = import.meta.env.VITE_SPORTRADAR_API_TIER || 'trial'
    
    // Production-safe defaults (very conservative)
    const defaults = {
      trial: {
        maxRequests: 1,
        timeWindow: 120000, // 2 minutes
        minInterval: 120000, // 2 minutes
        timeout: 30000,
        maxRetries: 1,
        circuitBreakerThreshold: 3,
        circuitBreakerTimeout: 300000 // 5 minutes
      },
      production: {
        maxRequests: 50,
        timeWindow: 60000, // 1 minute
        minInterval: 3000, // 3 seconds
        timeout: 15000,
        maxRetries: 2,
        circuitBreakerThreshold: 5,
        circuitBreakerTimeout: 60000 // 1 minute
      }
    }

    const tierDefaults = defaults[apiTier as keyof typeof defaults] || defaults.trial

    return {
      maxRequests: parseInt(import.meta.env.VITE_SPORTRADAR_MAX_REQUESTS) || tierDefaults.maxRequests,
      timeWindow: parseInt(import.meta.env.VITE_SPORTRADAR_TIME_WINDOW) || tierDefaults.timeWindow,
      minInterval: parseInt(import.meta.env.VITE_SPORTRADAR_MIN_INTERVAL) || tierDefaults.minInterval,
      timeout: parseInt(import.meta.env.VITE_SPORTRADAR_TIMEOUT) || tierDefaults.timeout,
      maxRetries: parseInt(import.meta.env.VITE_SPORTRADAR_MAX_RETRIES) || tierDefaults.maxRetries,
      circuitBreakerThreshold: parseInt(import.meta.env.VITE_SPORTRADAR_CIRCUIT_BREAKER_THRESHOLD) || tierDefaults.circuitBreakerThreshold,
      circuitBreakerTimeout: parseInt(import.meta.env.VITE_SPORTRADAR_CIRCUIT_BREAKER_TIMEOUT) || tierDefaults.circuitBreakerTimeout,
      apiTier,
      isProduction,
      enableMonitoring: import.meta.env.VITE_ENABLE_RATE_LIMIT_MONITORING !== 'false'
    }
  }
}

// Health check utility
class APIHealthChecker {
  private rateLimiter: EnhancedRateLimiter
  private monitor: EnhancedAPIMonitor

  constructor(rateLimiter: EnhancedRateLimiter, monitor: EnhancedAPIMonitor) {
    this.rateLimiter = rateLimiter
    this.monitor = monitor
  }

  async checkHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    details: any
    recommendations?: string[]
  }> {
    const rateLimiterStatus = this.rateLimiter.getStatus()
    const metrics = this.monitor.getMetrics()
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    const recommendations: string[] = []

    // Determine health status
    if (rateLimiterStatus.circuitBreakerOpen) {
      status = 'unhealthy'
      recommendations.push('Circuit breaker is open - API requests are blocked')
    } else if (metrics.rateLimitViolations > 5 || metrics.successRate < 70) {
      status = 'degraded'
      if (metrics.rateLimitViolations > 5) {
        recommendations.push('High rate limit violations detected')
      }
      if (metrics.successRate < 70) {
        recommendations.push('Low success rate - check API connectivity')
      }
    }

    return {
      status,
      details: {
        rateLimiter: rateLimiterStatus,
        metrics: {
          successRate: metrics.successRate,
          rateLimitViolations: metrics.rateLimitViolations,
          totalRequests: metrics.totalRequests,
          averageResponseTime: metrics.averageResponseTime
        },
        timestamp: new Date().toISOString()
      },
      recommendations: recommendations.length > 0 ? recommendations : undefined
    }
  }
}

// Usage example in main application
export function initializeRateLimitingSystem() {
  const config = RateLimitConfig.getConfig()
  
  if (import.meta.env.MODE === "development") {
    console.log("🔧 Rate Limiting System Configuration:", config)
  }
  
  const rateLimiter = EnhancedRateLimiter.getInstance()
  const monitor = EnhancedAPIMonitor.getInstance()
  const healthChecker = new APIHealthChecker(rateLimiter, monitor)
  
  // Set up periodic health checks in development
  if (import.meta.env.MODE === "development" && config.enableMonitoring) {
    setInterval(async () => {
      const health = await healthChecker.checkHealth()
      if (health.status !== 'healthy') {
        console.warn("🏥 API Health Check:", health)
      }
    }, 60000) // Check every minute
    
    // Log metrics every 5 minutes
    setInterval(() => {
      const report = monitor.generateReport()
      console.log("📊 Rate Limiting Report:\n", report)
    }, 300000)
  }
  
  return { rateLimiter, monitor, healthChecker, config }
}

export { EnhancedAPIMonitor, RateLimitConfig, APIHealthChecker }