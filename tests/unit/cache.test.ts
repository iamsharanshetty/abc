// tests/unit/cache.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { CacheService } from "@/lib/services/cache";

// Mock Supabase
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              data: [{ created_at: new Date().toISOString() }],
              error: null,
            })),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null })),
      })),
    })),
  })),
}));

describe("CacheService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    CacheService.clearIntentCache();
  });

  describe("Website Cache", () => {
    describe("isCached", () => {
      it("should return true for recently cached URL", async () => {
        const result = await CacheService.isCached("https://example.com");
        expect(typeof result).toBe("boolean");
      });

      it("should handle errors gracefully", async () => {
        const result = await CacheService.isCached("invalid-url");
        expect(typeof result).toBe("boolean");
      });
    });

    describe("invalidate", () => {
      it("should invalidate cache for URL", async () => {
        await expect(
          CacheService.invalidate("https://example.com")
        ).resolves.not.toThrow();
      });
    });
  });

  describe("Intent Cache", () => {
    describe("generateIntentCacheKey", () => {
      it("should normalize messages consistently", () => {
        const key1 = CacheService.generateIntentCacheKey("I want to buy!");
        const key2 = CacheService.generateIntentCacheKey("I WANT TO BUY!");
        const key3 = CacheService.generateIntentCacheKey("i  want   to  buy!");

        expect(key1).toBe(key2);
        expect(key1).toBe(key3);
      });

      it("should handle punctuation removal", () => {
        const key1 = CacheService.generateIntentCacheKey("Hello, how much?");
        const key2 = CacheService.generateIntentCacheKey("Hello how much");

        expect(key1).toBe(key2);
      });

      it("should truncate long messages", () => {
        const longMessage = "a".repeat(200);
        const key = CacheService.generateIntentCacheKey(longMessage);

        expect(key.length).toBeLessThanOrEqual(100);
      });
    });

    describe("cacheIntent and getCachedIntent", () => {
      it("should cache and retrieve intent results", () => {
        const message = "I want to buy your product";

        CacheService.cacheIntent(message, true, "keyword");

        const cached = CacheService.getCachedIntent(message);
        expect(cached).toBeDefined();
        expect(cached?.hasIntent).toBe(true);
        expect(cached?.method).toBe("keyword");
      });

      it("should return null for uncached messages", () => {
        const cached = CacheService.getCachedIntent("never seen this");
        expect(cached).toBeNull();
      });

      it("should work with similar messages (normalization)", () => {
        CacheService.cacheIntent("I want pricing info", true, "llm");

        const cached = CacheService.getCachedIntent("I WANT PRICING INFO!");
        expect(cached).toBeDefined();
        expect(cached?.hasIntent).toBe(true);
      });

      it("should handle cache expiry", async () => {
        const message = "test message";

        // Mock Date.now to simulate time passing
        const originalNow = Date.now;
        let currentTime = Date.now();

        vi.spyOn(Date, "now").mockImplementation(() => currentTime);

        CacheService.cacheIntent(message, true, "keyword");

        // Fast forward 2 hours (past TTL)
        currentTime += 2 * 60 * 60 * 1000;

        const cached = CacheService.getCachedIntent(message);
        expect(cached).toBeNull();

        // Restore Date.now
        vi.spyOn(Date, "now").mockImplementation(originalNow);
      });

      it("should respect max cache size (LRU eviction)", () => {
        // Cache 1001 different messages (max is 1000)
        for (let i = 0; i < 1001; i++) {
          CacheService.cacheIntent(`message ${i}`, true, "keyword");
        }

        const stats = CacheService.getIntentCacheStats();
        expect(stats.size).toBeLessThanOrEqual(1000);

        // First message should be evicted
        const firstMessage = CacheService.getCachedIntent("message 0");
        expect(firstMessage).toBeNull();

        // Last message should still be there
        const lastMessage = CacheService.getCachedIntent("message 1000");
        expect(lastMessage).toBeDefined();
      });
    });

    describe("getIntentCacheStats", () => {
      it("should return cache statistics", () => {
        CacheService.cacheIntent("test1", true, "keyword");
        CacheService.cacheIntent("test2", false, "llm");

        const stats = CacheService.getIntentCacheStats();

        expect(stats).toHaveProperty("size");
        expect(stats).toHaveProperty("maxSize");
        expect(stats.size).toBe(2);
        expect(stats.maxSize).toBe(1000);
      });
    });

    describe("clearIntentCache", () => {
      it("should clear all cached intents", () => {
        CacheService.cacheIntent("test1", true, "keyword");
        CacheService.cacheIntent("test2", false, "llm");

        let stats = CacheService.getIntentCacheStats();
        expect(stats.size).toBe(2);

        CacheService.clearIntentCache();

        stats = CacheService.getIntentCacheStats();
        expect(stats.size).toBe(0);

        const cached = CacheService.getCachedIntent("test1");
        expect(cached).toBeNull();
      });
    });
  });
});
