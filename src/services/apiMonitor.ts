// API Monitoring and Logging Service
import { APIError } from './sportradarAPI';

export interface APIMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  rateLimitHits: number;
  averageResponseTime: number;
  lastError?: {
    message: string;
    status?: number;
    timestamp: string;
    endpoint: string;
  };
  requestHistory: Array<{
    endpoint: string;
    status: 'success' | 'error' | 'rate_limited';
    responseTime: number;
    timestamp: string;
    error?: string;
  }>;
}

class APIMonitor {
  private static instance: APIMonitor | null = null;
  private metrics: APIMetrics;
  private readonly maxHistorySize = 100;

  private constructor() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rateLimitHits: 0,
      averageResponseTime: 0,
      requestHistory: []
    };
    
    // Load persisted metrics from localStorage
    this.loadMetrics();
  }

  static getInstance(): APIMonitor {
    if (!APIMonitor.instance) {
      APIMonitor.instance = new APIMonitor();
    }
    return APIMonitor.instance;
  }

  recordRequest(
    endpoint: string,
    startTime: number,
    status: 'success' | 'error' | 'rate_limited',
    error?: Error
  ): void {
    const responseTime = Date.now() - startTime;
    const timestamp = new Date().toISOString();

    this.metrics.totalRequests++;
    
    if (status === 'success') {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
      if (status === 'rate_limited') {
        this.metrics.rateLimitHits++;
        
        // ENHANCED: Log rate limit patterns for analysis
        if (import.meta.env.MODE === 'development') {
          console.warn('📊 Rate Limit Pattern:', {
            endpoint,
            consecutiveRateLimits: this.getConsecutiveRateLimits(),
            totalRateLimits: this.metrics.rateLimitHits,
            successRate: this.getSuccessRate(),
            timestamp
          });
        }
      }
    }

    // Update average response time
    const totalResponseTime = this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime;
    this.metrics.averageResponseTime = totalResponseTime / this.metrics.totalRequests;

    // Record error details
    if (error) {
      this.metrics.lastError = {
        message: error.message,
        status: error instanceof APIError ? error.status : undefined,
        timestamp,
        endpoint
      };
    }

    // Add to history
    this.metrics.requestHistory.unshift({
      endpoint,
      status,
      responseTime,
      timestamp,
      error: error?.message
    });

    // Limit history size
    if (this.metrics.requestHistory.length > this.maxHistorySize) {
      this.metrics.requestHistory = this.metrics.requestHistory.slice(0, this.maxHistorySize);
    }

    // Persist metrics
    this.saveMetrics();

    // Log to console in development
    if (import.meta.env.MODE === 'development') {
      console.log('📊 API Metrics Updated:', {
        endpoint,
        status,
        responseTime: `${responseTime}ms`,
        successRate: `${((this.metrics.successfulRequests / this.metrics.totalRequests) * 100).toFixed(1)}%`,
        rateLimitHits: this.metrics.rateLimitHits
      });
    }
  }

  // ENHANCED: Get consecutive rate limit count
  getConsecutiveRateLimits(): number {
    let count = 0;
    for (const request of this.metrics.requestHistory) {
      if (request.status === 'rate_limited') {
        count++;
      } else {
        break;
      }
    }
    return count;
  }

  // ENHANCED: Check if we should pause all requests
  shouldPauseRequests(): boolean {
    const consecutiveRateLimits = this.getConsecutiveRateLimits();
    const rateLimitRate = this.getRateLimitRate();
    
    return consecutiveRateLimits >= 3 || rateLimitRate > 50;
  }
  getMetrics(): APIMetrics {
    return { ...this.metrics };
  }

  getSuccessRate(): number {
    if (this.metrics.totalRequests === 0) return 0;
    return (this.metrics.successfulRequests / this.metrics.totalRequests) * 100;
  }

  getRateLimitRate(): number {
    if (this.metrics.totalRequests === 0) return 0;
    return (this.metrics.rateLimitHits / this.metrics.totalRequests) * 100;
  }

  getRecentErrors(limit = 10): Array<any> {
    return this.metrics.requestHistory
      .filter(req => req.status === 'error' || req.status === 'rate_limited')
      .slice(0, limit);
  }

  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rateLimitHits: 0,
      averageResponseTime: 0,
      requestHistory: []
    };
    this.saveMetrics();
  }

  private saveMetrics(): void {
    try {
      localStorage.setItem('sportradar_api_metrics', JSON.stringify(this.metrics));
    } catch (error) {
      console.warn('Failed to save API metrics to localStorage:', error);
    }
  }

  private loadMetrics(): void {
    try {
      const saved = localStorage.getItem('sportradar_api_metrics');
      if (saved) {
        this.metrics = { ...this.metrics, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('Failed to load API metrics from localStorage:', error);
    }
  }
}

export default APIMonitor;