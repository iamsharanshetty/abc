// tests/unit/deduplication.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { DeduplicationService } from "@/lib/services/deduplication";

describe("DeduplicationService", () => {
  let service: DeduplicationService;

  beforeEach(() => {
    service = new DeduplicationService();
  });

  describe("isDuplicate", () => {
    it("should detect exact duplicate content", () => {
      const url1 = "https://example.com/page1";
      const url2 = "https://example.com/page2";
      const title = "Same Title";
      const content = "This is the exact same content.";

      service.isDuplicate(url1, title, content);
      const isDupe = service.isDuplicate(url2, title, content);

      expect(isDupe).toBe(true);
    });

    it("should not flag different content as duplicate", () => {
      const url1 = "https://example.com/page1";
      const url2 = "https://example.com/page2";
      const title1 = "Title 1";
      const title2 = "Title 2";
      const content1 = "This is content for page 1.";
      const content2 = "This is completely different content for page 2.";

      service.isDuplicate(url1, title1, content1);
      const isDupe = service.isDuplicate(url2, title2, content2);

      expect(isDupe).toBe(false);
    });

    it("should detect duplicates with same title and similar length", () => {
      const url1 = "https://example.com/page1";
      const url2 = "https://example.com/page2";
      const title = "Same Title";
      const content1 = "Content with about the same length here.";
      const content2 = "Content with similar length goes here now.";

      service.isDuplicate(url1, title, content1);
      const isDupe = service.isDuplicate(url2, title, content2);

      expect(isDupe).toBe(true);
    });

    it("should not flag same URL as duplicate", () => {
      const url = "https://example.com/page1";
      const title = "Title";
      const content = "Content";

      service.isDuplicate(url, title, content);
      const isDupe = service.isDuplicate(url, title, content);

      expect(isDupe).toBe(false);
    });
  });

  describe("getStats", () => {
    it("should return correct statistics", () => {
      service.isDuplicate("https://example.com/page1", "Title 1", "Content 1");
      service.isDuplicate("https://example.com/page2", "Title 2", "Content 2");
      service.isDuplicate("https://example.com/page3", "Title 1", "Content 1"); // Duplicate

      const stats = service.getStats();

      expect(stats.uniquePages).toBe(2);
      expect(stats.duplicatesFound).toBe(1);
      expect(stats.duplicateRate).toBeGreaterThan(0);
    });
  });

  describe("reset", () => {
    it("should reset all statistics", () => {
      service.isDuplicate("https://example.com/page1", "Title", "Content");
      service.reset();

      const stats = service.getStats();
      expect(stats.uniquePages).toBe(0);
      expect(stats.duplicatesFound).toBe(0);
    });
  });
});
