// lib/middleware/rateLimiter.ts
import { NextRequest, NextResponse } from "next/server";
import { RateLimitError } from "../errors/AppError";
import { logger } from "../utils/logger";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * In-memory rate limiter for API endpoints
 * In production, use Redis or a similar service
 */
class APIRateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;

    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Get identifier for rate limiting (IP address or user ID)
   */
  private getIdentifier(request: NextRequest): string {
    // Priority order: x-forwarded-for > x-real-ip > fallback
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const cfConnectingIp = request.headers.get("cf-connecting-ip"); // Cloudflare

    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }

    if (realIp) {
      return realIp.trim();
    }

    if (cfConnectingIp) {
      return cfConnectingIp.trim();
    }

    // In production with proper deployment, you should always get an IP
    // For development/testing, use a consistent identifier
    return process.env.NODE_ENV === "development"
      ? "dev-client"
      : "unknown-client";
  }

  /**
   * Check if request should be rate limited
   */
  check(request: NextRequest): boolean {
    const identifier = this.getIdentifier(request);
    const now = Date.now();

    let entry = this.limits.get(identifier);

    // Create new entry if doesn't exist or expired
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 1,
        resetTime: now + this.windowMs,
      };
      this.limits.set(identifier, entry);
      return false;
    }

    // Increment count
    entry.count++;

    // Check if over limit
    if (entry.count > this.maxRequests) {
      logger.warn("Rate limit exceeded", {
        identifier,
        count: entry.count,
        maxRequests: this.maxRequests,
        resetIn: Math.round((entry.resetTime - now) / 1000) + "s",
      });
      return true;
    }

    return false;
  }

  /**
   * Get rate limit info for a request
   */
  getInfo(request: NextRequest): {
    limit: number;
    remaining: number;
    reset: number;
  } {
    const identifier = this.getIdentifier(request);
    const entry = this.limits.get(identifier);
    const now = Date.now();

    if (!entry || now > entry.resetTime) {
      return {
        limit: this.maxRequests,
        remaining: this.maxRequests,
        reset: now + this.windowMs,
      };
    }

    return {
      limit: this.maxRequests,
      remaining: Math.max(0, this.maxRequests - entry.count),
      reset: entry.resetTime,
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [identifier, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(identifier);
        removed++;
      }
    }

    if (removed > 0) {
      logger.debug("Cleaned up expired rate limit entries", { removed });
    }
  }
}

// Create rate limiter instances for different endpoints
export const analyzeRateLimiter = new APIRateLimiter(5, 60000); // 5 requests per minute
export const statusRateLimiter = new APIRateLimiter(30, 60000); // 30 requests per minute

/**
 * Rate limit middleware
 */
export function withRateLimit(
  rateLimiter: APIRateLimiter,
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Check rate limit
    if (rateLimiter.check(request)) {
      const info = rateLimiter.getInfo(request);

      return NextResponse.json(
        new RateLimitError("Too many requests. Please try again later.", {
          retryAfter: Math.ceil((info.reset - Date.now()) / 1000),
        }).toJSON(),
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": info.limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": info.reset.toString(),
            "Retry-After": Math.ceil(
              (info.reset - Date.now()) / 1000
            ).toString(),
          },
        }
      );
    }

    // Get rate limit info and add to response headers
    const info = rateLimiter.getInfo(request);
    const response = await handler(request);

    response.headers.set("X-RateLimit-Limit", info.limit.toString());
    response.headers.set("X-RateLimit-Remaining", info.remaining.toString());
    response.headers.set("X-RateLimit-Reset", info.reset.toString());

    return response;
  };
}
