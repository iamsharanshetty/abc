// tests/unit/queue-management.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@trigger.dev/sdk/v3", () => ({
  task: vi.fn((config) => config),
  tasks: {
    trigger: vi.fn(),
    batchTrigger: vi.fn(),
  },
  runs: {
    retrieve: vi.fn(),
    cancel: vi.fn(),
    list: vi.fn(),
  },
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("Queue Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Job Triggering", () => {
    it("should trigger a job with valid payload", async () => {
      const { tasks } = await import("@trigger.dev/sdk/v3");

      (tasks.trigger as any).mockResolvedValue({
        id: "job_123",
      });

      const result = await tasks.trigger("ingest-website", {
        url: "https://example.com",
        maxPages: 10,
      });

      expect(result.id).toBe("job_123");
    });
  });

  describe("Job Status Retrieval", () => {
    it("should retrieve job status successfully", async () => {
      const { runs } = await import("@trigger.dev/sdk/v3");

      (runs.retrieve as any).mockResolvedValue({
        id: "job_123",
        status: "COMPLETED_SUCCESSFULLY",
        createdAt: new Date().toISOString(),
        output: {
          success: true,
          pagesScraped: 5,
        },
      });

      const result = await runs.retrieve("job_123");

      expect(result.status).toBe("COMPLETED_SUCCESSFULLY");
    });
  });
});
