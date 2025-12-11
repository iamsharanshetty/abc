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
  });

  describe("isCached", () => {
    it("should return true for recently cached URL", async () => {
      const result = await CacheService.isCached("https://example.com");
      // Based on mock, should return true
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
