// Advanced Caching Manager for Sportradar API
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheConfig {
  defaultTTL: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of entries
  compressionEnabled: boolean;
}

class CacheManager {
  private static instance: CacheManager | null = null;
  private cache = new Map<string, CacheEntry<any>>();
  private config: CacheConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutes default
      maxSize: 1000,
      compressionEnabled: false,
      ...config
    };
    
    // Start cleanup interval
    this.startCleanup();
    
    // Load persisted cache
    this.loadFromStorage();
  }

  static getInstance(config?: Partial<CacheConfig>): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager(config);
    }
    return CacheManager.instance;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const timeToLive = ttl || this.config.defaultTTL;
    
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + timeToLive,
      accessCount: 0,
      lastAccessed: now
    };
    
    this.cache.set(key, entry);
    this.persistToStorage();
    
    if (import.meta.env.MODE === 'development') {
      console.log('💾 Cache SET:', {
        key,
        size: this.cache.size,
        ttl: `${timeToLive / 1000}s`,
        expiresAt: new Date(entry.expiresAt).toISOString()
      });
    }
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      if (import.meta.env.MODE === 'development') {
        console.log('💾 Cache MISS:', key);
      }
      return null;
    }
    
    const now = Date.now();
    
    // Check if expired
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      if (import.meta.env.MODE === 'development') {
        console.log('💾 Cache EXPIRED:', key);
      }
      return null;
    }
    
    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;
    
    if (import.meta.env.MODE === 'development') {
      console.log('💾 Cache HIT:', {
        key,
        accessCount: entry.accessCount,
        age: `${(now - entry.timestamp) / 1000}s`,
        ttl: `${(entry.expiresAt - now) / 1000}s`
      });
    }
    
    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.persistToStorage();
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.persistToStorage();
    
    if (import.meta.env.MODE === 'development') {
      console.log('💾 Cache CLEARED');
    }
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let totalSize = 0;
    let expiredCount = 0;
    let totalAccess = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      totalSize += JSON.stringify(entry.data).length;
      totalAccess += entry.accessCount;
      
      if (now > entry.expiresAt) {
        expiredCount++;
      }
    }
    
    return {
      totalEntries: this.cache.size,
      totalSizeBytes: totalSize,
      expiredEntries: expiredCount,
      totalAccess,
      hitRate: this.calculateHitRate(),
      oldestEntry: this.getOldestEntry(),
      mostAccessed: this.getMostAccessedEntry()
    };
  }

  // Cache-specific methods for different data types
  setCachedApiResponse<T>(endpoint: string, data: T, customTTL?: number): void {
    const ttl = customTTL || this.getTTLForEndpoint(endpoint);
    this.set(`api:${endpoint}`, data, ttl);
  }

  getCachedApiResponse<T>(endpoint: string): T | null {
    return this.get<T>(`api:${endpoint}`);
  }

  private getTTLForEndpoint(endpoint: string): number {
    // Different TTL for different types of data
    if (endpoint.includes('/competitions')) return 24 * 60 * 60 * 1000; // 24 hours
    if (endpoint.includes('/standings')) return 60 * 60 * 1000; // 1 hour
    if (endpoint.includes('/live/')) return 30 * 1000; // 30 seconds
    if (endpoint.includes('/schedules/')) return 60 * 60 * 1000; // 1 hour
    if (endpoint.includes('/statistics')) return 12 * 60 * 60 * 1000; // 12 hours
    
    return this.config.defaultTTL;
  }

  private evictOldest(): void {
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      if (import.meta.env.MODE === 'development') {
        console.log('💾 Cache EVICTED oldest:', oldestKey);
      }
    }
  }

  private startCleanup(): void {
    // Clean expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 5 * 60 * 1000);
  }

  private cleanupExpired(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      this.persistToStorage();
      if (import.meta.env.MODE === 'development') {
        console.log(`💾 Cache CLEANUP: Removed ${cleanedCount} expired entries`);
      }
    }
  }

  private calculateHitRate(): number {
    // This would need to be tracked separately in a real implementation
    return 0; // Placeholder
  }

  private getOldestEntry(): string | null {
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }
    
    return oldestKey || null;
  }

  private getMostAccessedEntry(): string | null {
    let mostAccessedKey = '';
    let maxAccess = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessCount > maxAccess) {
        maxAccess = entry.accessCount;
        mostAccessedKey = key;
      }
    }
    
    return mostAccessedKey || null;
  }

  private persistToStorage(): void {
    try {
      // Only persist non-expired entries
      const now = Date.now();
      const persistData: Array<[string, CacheEntry<any>]> = [];
      
      for (const [key, entry] of this.cache.entries()) {
        if (now <= entry.expiresAt) {
          persistData.push([key, entry]);
        }
      }
      
      localStorage.setItem('sportradar_cache', JSON.stringify(persistData));
    } catch (error) {
      console.warn('Failed to persist cache to localStorage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem('sportradar_cache');
      if (saved) {
        const data: Array<[string, CacheEntry<any>]> = JSON.parse(saved);
        const now = Date.now();
        
        data.forEach(([key, entry]) => {
          // Only load non-expired entries
          if (now <= entry.expiresAt) {
            this.cache.set(key, entry);
          }
        });
        
        if (import.meta.env.MODE === 'development') {
          console.log(`💾 Cache LOADED: ${this.cache.size} entries from storage`);
        }
      }
    } catch (error) {
      console.warn('Failed to load cache from localStorage:', error);
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

export default CacheManager;