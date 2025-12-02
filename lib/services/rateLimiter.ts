// lib/services/rateLimiter.ts
import { config } from "../config";

interface RateLimitRequest {
  timestamp: number;
  id: string;
}

class RateLimiter {
  private requests: Set<string> = new Set();
  private requestTimestamps: RateLimitRequest[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Clean up old requests outside the current window
   */
  private cleanup(): void {
    const now = Date.now();
    const cutoff = now - this.windowMs;

    // Remove old timestamps
    this.requestTimestamps = this.requestTimestamps.filter((req) => {
      if (req.timestamp < cutoff) {
        this.requests.delete(req.id);
        return false;
      }
      return true;
    });
  }

  /**
   * Check if we can make a request
   */
  canMakeRequest(): boolean {
    this.cleanup();
    return this.requests.size < this.maxRequests;
  }

  /**
   * Wait until we can make a request
   */
  async waitForSlot(): Promise<void> {
    while (!this.canMakeRequest()) {
      // Calculate how long to wait
      const oldestRequest = this.requestTimestamps[0];
      if (oldestRequest) {
        const waitTime = oldestRequest.timestamp + this.windowMs - Date.now();
        if (waitTime > 0) {
          await new Promise((resolve) => setTimeout(resolve, waitTime + 100)); // Add 100ms buffer
        }
      } else {
        // Shouldn't happen, but just in case
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      this.cleanup();
    }
  }

  /**
   * Track a new request
   */
  trackRequest(id: string): void {
    this.cleanup();
    this.requests.add(id);
    this.requestTimestamps.push({
      timestamp: Date.now(),
      id,
    });
  }

  /**
   * Remove a tracked request (when it completes)
   */
  removeRequest(id: string): void {
    this.requests.delete(id);
    this.requestTimestamps = this.requestTimestamps.filter(
      (req) => req.id !== id
    );
  }

  /**
   * Get current usage statistics
   */
  getStats(): {
    currentRequests: number;
    maxRequests: number;
    utilization: number;
  } {
    this.cleanup();
    return {
      currentRequests: this.requests.size,
      maxRequests: this.maxRequests,
      utilization: (this.requests.size / this.maxRequests) * 100,
    };
  }

  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.requests.clear();
    this.requestTimestamps = [];
  }
}

// Create a singleton instance for OpenAI API
export const openAIRateLimiter = new RateLimiter(
  config.rateLimit.maxRequestsPerMinute,
  config.rateLimit.requestWindow
);

/**
 * Execute a function with rate limiting
 */
export async function withRateLimit<T>(
  fn: () => Promise<T>,
  requestId?: string
): Promise<T> {
  const id =
    requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Wait for a slot
  await openAIRateLimiter.waitForSlot();

  // Track this request
  openAIRateLimiter.trackRequest(id);

  try {
    // Execute the function
    const result = await fn();
    return result;
  } finally {
    // Always remove the request when done
    openAIRateLimiter.removeRequest(id);
  }
}
