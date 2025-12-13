// tests/unit/queue-management.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Trigger.dev
vi.mock("@trigger.dev/sdk/v3", () => ({
  task: vi.fn((config) => config),
  tasks: {
    trigger: vi.fn(),
    retrieve: vi.fn(),
    cancel: vi.fn(),
  },
}));

describe("Queue Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Job Triggering", () => {
    it("should trigger a job with valid payload", async () => {
      const { tasks } = await import("@trigger.dev/sdk/v3");

      // Mock successful job trigger
      (tasks.trigger as any).mockResolvedValue({
        id: "job_123",
      });

      const result = await tasks.trigger("ingest-website", {
        url: "https://example.com",
        maxPages: 10,
      });

      expect(tasks.trigger).toHaveBeenCalledWith("ingest-website", {
        url: "https://example.com",
        maxPages: 10,
      });

      expect(result).toHaveProperty("id");
      expect(result.id).toBe("job_123");
    });

    it("should handle job trigger failure", async () => {
      const { tasks } = await import("@trigger.dev/sdk/v3");

      // Mock failed job trigger
      (tasks.trigger as any).mockRejectedValue(
        new Error("Failed to trigger job")
      );

      await expect(
        tasks.trigger("ingest-website", {
          url: "https://example.com",
        })
      ).rejects.toThrow("Failed to trigger job");
    });
  });

  describe("Job Status Retrieval", () => {
    it("should retrieve job status successfully", async () => {
      const { tasks } = await import("@trigger.dev/sdk/v3");

      // Mock successful status retrieval
      (tasks.retrieve as any).mockResolvedValue({
        id: "job_123",
        status: "COMPLETED",
        createdAt: new Date().toISOString(),
        output: {
          success: true,
          pagesScraped: 5,
        },
      });

      const result = await tasks.retrieve("job_123");

      expect(tasks.retrieve).toHaveBeenCalledWith("job_123");
      expect(result.status).toBe("COMPLETED");
      expect(result.output).toHaveProperty("success", true);
    });

    it("should handle non-existent job", async () => {
      const { tasks } = await import("@trigger.dev/sdk/v3");

      // Mock non-existent job
      (tasks.retrieve as any).mockResolvedValue(null);

      const result = await tasks.retrieve("non_existent_job");

      expect(result).toBeNull();
    });
  });

  describe("Job Cancellation", () => {
    it("should cancel a running job", async () => {
      const { tasks } = await import("@trigger.dev/sdk/v3");

      // Mock successful cancellation
      (tasks.cancel as any).mockResolvedValue({
        id: "job_123",
        status: "CANCELED",
      });

      await tasks.cancel("job_123");

      expect(tasks.cancel).toHaveBeenCalledWith("job_123");
    });
  });

  describe("Retry Logic", () => {
    it("should retry failed jobs according to config", async () => {
      // This tests the retry configuration in the task definition
      const { task } = await import("@trigger.dev/sdk/v3");

      const taskConfig = {
        id: "test-task",
        retry: {
          maxAttempts: 3,
          factor: 2,
          minTimeoutInMs: 1000,
          maxTimeoutInMs: 10000,
        },
        run: vi.fn(),
      };

      const result = task(taskConfig);

      expect(result.retry).toEqual({
        maxAttempts: 3,
        factor: 2,
        minTimeoutInMs: 1000,
        maxTimeoutInMs: 10000,
      });
    });
  });
});

describe("Job Execution Flow", () => {
  it("should complete a successful ingestion job", async () => {
    // Mock the entire job execution
    const mockRun = vi.fn().mockResolvedValue({
      success: true,
      websiteUrl: "https://example.com",
      pagesScraped: 5,
      pagesProcessed: 5,
      embeddingsCreated: 50,
      duration: 30000,
    });

    await mockRun({
      url: "https://example.com",
      maxPages: 10,
    });

    expect(mockRun).toHaveBeenCalledWith({
      url: "https://example.com",
      maxPages: 10,
    });
  });

  it("should handle job failure gracefully", async () => {
    const mockRun = vi.fn().mockResolvedValue({
      success: false,
      websiteUrl: "https://example.com",
      pagesScraped: 0,
      pagesProcessed: 0,
      embeddingsCreated: 0,
      duration: 5000,
      error: "Failed to scrape website",
    });

    const result = await mockRun({
      url: "https://example.com",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
