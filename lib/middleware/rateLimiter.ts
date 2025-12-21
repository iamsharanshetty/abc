// lib/middleware/rateLimiter.ts - ENHANCED VERSION with Redis support
// ✅ Fixed: Added Redis-based distributed rate limiting for production

import { NextRequest, NextResponse } from "next/server";
import { RateLimitError } from "../errors/AppError";
import { logger } from "../utils/logger";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * ✅ NEW: Redis client interface for rate limiting
 * Supports both node-redis and ioredis clients
 */
interface RedisClient {
  get(key: string): Promise<string | null>;
  set(
    key: string,
    value: string,
    mode: string,
    duration: number
  ): Promise<void>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<void>;
  del(key: string): Promise<void>;
}

/**
 * ✅ NEW: Redis adapter factory
 * Create this based on your Redis client choice
 */
export function createRedisAdapter(): RedisClient | null {
  // Check if Redis is configured
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    logger.info("Redis not configured, using in-memory rate limiting");
    return null;
  }

  try {
    // =================================================================
    // REDIS IMPLEMENTATION - COMMENTED OUT
    // =================================================================
    // To enable Redis support:
    // 1. Install Redis client: pnpm install redis
    //    OR: pnpm install ioredis
    // 2. Set REDIS_URL environment variable
    // 3. Uncomment ONE of the implementations below
    // =================================================================

    // ===== OPTION 1: ioredis (Recommended for Vercel/serverless) =====
    const Redis = require("ioredis");
    const redis = new Redis(redisUrl);

    return {
      async get(key: string) {
        return await redis.get(key);
      },
      async set(key: string, value: string, mode: string, duration: number) {
        if (mode === "PX") {
          await redis.set(key, value, "PX", duration);
        } else if (mode === "EX") {
          await redis.set(key, value, "EX", duration);
        }
      },
      async incr(key: string) {
        return await redis.incr(key);
      },
      async expire(key: string, seconds: number) {
        await redis.expire(key, seconds);
      },
      async del(key: string) {
        await redis.del(key);
      },
    };

    /* 
    // ===== OPTION 2: node-redis =====
    const redis = require('redis');
    const client = redis.createClient({ url: redisUrl });
    client.connect();
    
    return {
      async get(key: string) {
        return await client.get(key);
      },
      async set(key: string, value: string, mode: string, duration: number) {
        const options: any = {};
        if (mode === 'PX') options.PX = duration;
        if (mode === 'EX') options.EX = duration;
        await client.set(key, value, options);
      },
      async incr(key: string) {
        return await client.incr(key);
      },
      async expire(key: string, seconds: number) {
        await client.expire(key, seconds);
      },
      async del(key: string) {
        await client.del(key);
      }
    };
    */

    logger.warn(
      "Redis client code is commented out. Uncomment the appropriate section based on your Redis client choice."
    );
    return null;
  } catch (error) {
    logger.error("Failed to initialize Redis client", { error });
    return null;
  }
}

/**
 * ✅ ENHANCED: Rate limiter with Redis support
 *
 * PRODUCTION DEPLOYMENT GUIDE:
 * ============================
 *
 * 1. Choose a Redis provider:
 *    - Upstash Redis (https://upstash.com) - Serverless, perfect for Next.js
 *    - Redis Cloud (https://redis.com)
 *    - AWS ElastiCache
 *    - Self-hosted Redis
 *
 * 2. Set environment variable:
 *    REDIS_URL=redis://username:password@host:port
 *
 * 3. Install Redis client:
 *    pnpm install ioredis
 *    OR
 *    pnpm install redis
 *
 * 4. Uncomment Redis adapter code above based on your client choice
 *
 * 5. The rate limiter will automatically use Redis when available,
 *    falling back to in-memory for development
 *
 * MIGRATION PATH:
 * ===============
 * Development: In-memory (current) → Production: Redis (automatic)
 * No code changes needed in your API routes!
 */
class APIRateLimiter {
  // In-memory storage (fallback for development)
  private limits: Map<string, RateLimitEntry> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly redis: RedisClient | null;
  private readonly keyPrefix: string;

  constructor(
    maxRequests: number = 10,
    windowMs: number = 60000,
    keyPrefix: string = "ratelimit"
  ) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.keyPrefix = keyPrefix;
    this.redis = createRedisAdapter();

    // Only setup cleanup for in-memory mode
    if (!this.redis) {
      logger.info(
        "Rate limiter initialized in IN-MEMORY mode (not recommended for production)"
      );
      setInterval(() => this.cleanup(), 60000);
    } else {
      logger.info("Rate limiter initialized in REDIS mode (production-ready)");
    }
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
   * ✅ NEW: Build Redis key for rate limiting
   */
  private getRedisKey(identifier: string): string {
    return `${this.keyPrefix}:${identifier}`;
  }

  /**
   * ✅ ENHANCED: Check rate limit using Redis or in-memory
   */
  async check(request: NextRequest): Promise<boolean> {
    const identifier = this.getIdentifier(request);

    if (this.redis) {
      return await this.checkRedis(identifier);
    } else {
      return this.checkInMemory(identifier);
    }
  }

  /**
   * ✅ NEW: Redis-based rate limit check
   */
  private async checkRedis(identifier: string): Promise<boolean> {
    if (!this.redis) return false;

    try {
      const key = this.getRedisKey(identifier);
      const now = Date.now();

      // Try to get current count
      const countStr = await this.redis.get(key);

      if (!countStr) {
        // First request - initialize counter
        await this.redis.set(key, "1", "PX", this.windowMs);
        return false;
      }

      // Increment counter
      const count = await this.redis.incr(key);

      // Check if over limit
      if (count > this.maxRequests) {
        logger.warn("Rate limit exceeded (Redis)", {
          identifier,
          count,
          maxRequests: this.maxRequests,
        });
        return true;
      }

      // Ensure expiry is set (in case incr was called on existing key without TTL)
      await this.redis.expire(key, Math.ceil(this.windowMs / 1000));

      return false;
    } catch (error) {
      logger.error("Redis rate limit check failed, falling back to allow", {
        error,
      });
      // Fail open - allow request if Redis fails
      return false;
    }
  }

  /**
   * ✅ EXISTING: In-memory rate limit check (for development)
   */
  private checkInMemory(identifier: string): boolean {
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
      logger.warn("Rate limit exceeded (in-memory)", {
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
   * ✅ ENHANCED: Get rate limit info (Redis or in-memory)
   */
  async getInfo(request: NextRequest): Promise<{
    limit: number;
    remaining: number;
    reset: number;
  }> {
    const identifier = this.getIdentifier(request);

    if (this.redis) {
      return await this.getInfoRedis(identifier);
    } else {
      return this.getInfoInMemory(identifier);
    }
  }

  /**
   * ✅ NEW: Get rate limit info from Redis
   */
  private async getInfoRedis(identifier: string): Promise<{
    limit: number;
    remaining: number;
    reset: number;
  }> {
    if (!this.redis) {
      return {
        limit: this.maxRequests,
        remaining: this.maxRequests,
        reset: Date.now() + this.windowMs,
      };
    }

    try {
      const key = this.getRedisKey(identifier);
      const countStr = await this.redis.get(key);

      if (!countStr) {
        return {
          limit: this.maxRequests,
          remaining: this.maxRequests,
          reset: Date.now() + this.windowMs,
        };
      }

      const count = parseInt(countStr, 10);
      const remaining = Math.max(0, this.maxRequests - count);

      return {
        limit: this.maxRequests,
        remaining,
        reset: Date.now() + this.windowMs, // Approximate
      };
    } catch (error) {
      logger.error("Redis getInfo failed", { error });
      return {
        limit: this.maxRequests,
        remaining: this.maxRequests,
        reset: Date.now() + this.windowMs,
      };
    }
  }

  /**
   * ✅ EXISTING: Get rate limit info from memory
   */
  private getInfoInMemory(identifier: string): {
    limit: number;
    remaining: number;
    reset: number;
  } {
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
   * Clean up expired entries (in-memory only)
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

  /**
   * ✅ ENHANCED: Reset rate limit (Redis or in-memory)
   */
  async reset(request: NextRequest): Promise<void> {
    const identifier = this.getIdentifier(request);

    if (this.redis) {
      try {
        const key = this.getRedisKey(identifier);
        await this.redis.del(key);
        logger.debug("Rate limit reset (Redis)", { identifier });
      } catch (error) {
        logger.error("Redis reset failed", { error });
      }
    } else {
      this.limits.delete(identifier);
      logger.debug("Rate limit reset (in-memory)", { identifier });
    }
  }
}

// Create rate limiter instances for different endpoints
// ✅ ENHANCED: Added key prefixes for better Redis organization
export const analyzeRateLimiter = new APIRateLimiter(5, 60000, "analyze");
export const statusRateLimiter = new APIRateLimiter(30, 60000, "status");
export const chatRateLimiter = new APIRateLimiter(20, 60000, "chat");
export const feedbackRateLimiter = new APIRateLimiter(10, 60000, "feedback");
export const leadsRateLimiter = new APIRateLimiter(30, 60000, "leads");
export const webhookRateLimiter = new APIRateLimiter(5, 60000, "webhook");
export const analyticsRateLimiter = new APIRateLimiter(30, 60000, "analytics");
export const crmRateLimiter = new APIRateLimiter(10, 60000, "crm");
export const agentTestRateLimiter = new APIRateLimiter(5, 300000, "test");

/**
 * ✅ ENHANCED: Rate limit middleware (now async to support Redis)
 */
export function withRateLimit(
  rateLimiter: APIRateLimiter,
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Check rate limit (now async)
    const isLimited = await rateLimiter.check(request);

    if (isLimited) {
      const info = await rateLimiter.getInfo(request);

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
    const info = await rateLimiter.getInfo(request);
    const response = await handler(request);

    response.headers.set("X-RateLimit-Limit", info.limit.toString());
    response.headers.set("X-RateLimit-Remaining", info.remaining.toString());
    response.headers.set("X-RateLimit-Reset", info.reset.toString());

    return response;
  };
}
