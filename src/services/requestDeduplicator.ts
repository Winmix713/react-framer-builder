// Request Deduplication Service to prevent multiple simultaneous calls to same endpoint
interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

class RequestDeduplicator {
  private static instance: RequestDeduplicator | null = null;
  private pendingRequests = new Map<string, PendingRequest<any>>();
  private readonly requestTTL = 30000; // 30 seconds

  static getInstance(): RequestDeduplicator {
    if (!RequestDeduplicator.instance) {
      RequestDeduplicator.instance = new RequestDeduplicator();
    }
    return RequestDeduplicator.instance;
  }

  async deduplicate<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    // Clean expired requests
    this.cleanupExpiredRequests();

    // Check if request is already pending
    const existing = this.pendingRequests.get(key);
    if (existing) {
      if (import.meta.env.MODE === 'development') {
        console.log(`🔄 Deduplicating request: ${key}`);
      }
      return existing.promise;
    }

    // Create new request
    const promise = requestFn().finally(() => {
      // Remove from pending when completed
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now()
    });

    if (import.meta.env.MODE === 'development') {
      console.log(`📤 New request: ${key} (pending: ${this.pendingRequests.size})`);
    }

    return promise;
  }

  private cleanupExpiredRequests(): void {
    const now = Date.now();
    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > this.requestTTL) {
        this.pendingRequests.delete(key);
      }
    }
  }

  getStats() {
    return {
      pendingRequests: this.pendingRequests.size,
      pendingKeys: Array.from(this.pendingRequests.keys())
    };
  }
}

export default RequestDeduplicator;