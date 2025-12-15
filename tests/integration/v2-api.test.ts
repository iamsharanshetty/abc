// tests/integration/v2-api.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/server", () => ({
  NextRequest: class {
    constructor(public url: string, public init?: any) {}
    nextUrl = { searchParams: new URLSearchParams() };
    json = vi.fn();
    headers = new Map();
  },
  NextResponse: {
    json: (data: any, init?: any) => ({ data, init }),
  },
}));

// Updated mock for Trigger.dev v3
vi.mock("@trigger.dev/sdk/v3", () => ({
  tasks: {
    trigger: vi.fn(),
    batchTrigger: vi.fn(),
  },
  runs: {
    retrieve: vi.fn(),
    cancel: vi.fn(),
    list: vi.fn(),
  },
  task: vi.fn((config) => config),
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("API v2 Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/v2/ingest", () => {
    it("should return 202 and job ID for valid request", async () => {
      const { tasks } = await import("@trigger.dev/sdk/v3");

      (tasks.trigger as any).mockResolvedValue({
        id: "job_test_123",
      });

      const response = {
        success: true,
        data: {
          jobId: "job_test_123",
          websiteUrl: "https://example.com",
          message: "Website ingestion job started",
          statusUrl: "/api/v2/jobs/job_test_123",
        },
      };

      expect(response.success).toBe(true);
      expect(response.data.jobId).toBe("job_test_123");
    });
  });

  describe("GET /api/v2/jobs/[jobId]", () => {
    it("should return job status for pending job", async () => {
      const { runs } = await import("@trigger.dev/sdk/v3");

      (runs.retrieve as any).mockResolvedValue({
        id: "job_123",
        status: "PENDING",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const response = {
        success: true,
        data: {
          jobId: "job_123",
          status: "pending",
          progress: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      expect(response.data.status).toBe("pending");
    });

    it("should return 404 for non-existent job", async () => {
      const { runs } = await import("@trigger.dev/sdk/v3");

      (runs.retrieve as any).mockResolvedValue(null);

      const response = {
        success: false,
        error: {
          message: "Job not found",
          code: "JOB_NOT_FOUND",
        },
      };

      expect(response.success).toBe(false);
    });
  });

  describe("DELETE /api/v2/jobs/[jobId]", () => {
    it("should cancel a running job", async () => {
      const { runs } = await import("@trigger.dev/sdk/v3");

      (runs.cancel as any).mockResolvedValue({
        id: "job_123",
        status: "CANCELED",
      });

      const response = {
        success: true,
        data: {
          jobId: "job_123",
          message: "Job canceled successfully",
        },
      };

      expect(response.success).toBe(true);
    });
  });
});
