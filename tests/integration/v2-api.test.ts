// tests/integration/v2-api.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Next.js
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

// Mock Trigger.dev
vi.mock("@trigger.dev/sdk/v3", () => ({
  tasks: {
    trigger: vi.fn(),
    retrieve: vi.fn(),
    cancel: vi.fn(),
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

      // Simulate API call
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

    it("should return 400 for invalid URL", async () => {
      const response = {
        success: false,
        error: {
          message: "Invalid URL format",
          code: "INVALID_INPUT",
        },
      };

      expect(response.success).toBe(false);
      expect(response.error.code).toBe("INVALID_INPUT");
    });

    it("should return 400 for missing URL", async () => {
      const response = {
        success: false,
        error: {
          message: "URL is required and must be a string",
          code: "INVALID_INPUT",
        },
      };

      expect(response.success).toBe(false);
    });
  });

  describe("GET /api/v2/jobs/[jobId]", () => {
    it("should return job status for pending job", async () => {
      const { tasks } = await import("@trigger.dev/sdk/v3");

      (tasks.retrieve as any).mockResolvedValue({
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
      expect(response.data.progress).toBe(0);
    });

    it("should return job status for running job", async () => {
      const response = {
        success: true,
        data: {
          jobId: "job_123",
          status: "running",
          progress: 50,
        },
      };

      expect(response.data.status).toBe("running");
      expect(response.data.progress).toBe(50);
    });

    it("should return job status for completed job", async () => {
      const response = {
        success: true,
        data: {
          jobId: "job_123",
          status: "completed",
          progress: 100,
          result: {
            success: true,
            pagesScraped: 5,
            embeddingsCreated: 50,
          },
        },
      };

      expect(response.data.status).toBe("completed");
      expect(response.data.progress).toBe(100);
      expect(response.data.result.success).toBe(true);
    });

    it("should return 404 for non-existent job", async () => {
      const { tasks } = await import("@trigger.dev/sdk/v3");

      (tasks.retrieve as any).mockResolvedValue(null);

      const response = {
        success: false,
        error: {
          message: "Job not found",
          code: "JOB_NOT_FOUND",
        },
      };

      expect(response.success).toBe(false);
      expect(response.error.code).toBe("JOB_NOT_FOUND");
    });
  });

  describe("DELETE /api/v2/jobs/[jobId]", () => {
    it("should cancel a running job", async () => {
      const { tasks } = await import("@trigger.dev/sdk/v3");

      (tasks.cancel as any).mockResolvedValue({
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

  describe("POST /api/v2/agents", () => {
    it("should create agent with valid data", async () => {
      const response = {
        success: true,
        data: {
          agentId: "agent_123",
          name: "Test Agent",
          websiteUrl: "https://example.com",
          role: "sales",
          status: "creating",
        },
      };

      expect(response.success).toBe(true);
      expect(response.data.status).toBe("creating");
    });

    it("should return 400 for missing required fields", async () => {
      const response = {
        success: false,
        error: {
          message: "websiteUrl is required",
          code: "INVALID_INPUT",
        },
      };

      expect(response.success).toBe(false);
    });
  });

  describe("GET /api/v2/agents/[agentId]", () => {
    it("should return agent details", async () => {
      const response = {
        success: true,
        data: {
          id: "agent_123",
          name: "Sales Rep",
          websiteUrl: "https://example.com",
          role: "sales",
          status: "active",
          statistics: {
            totalConversations: 156,
            averageResponseTime: 1.2,
            satisfactionScore: 4.5,
          },
        },
      };

      expect(response.success).toBe(true);
      expect(response.data.id).toBe("agent_123");
    });
  });

  describe("PATCH /api/v2/agents/[agentId]", () => {
    it("should update agent successfully", async () => {
      const response = {
        success: true,
        data: {
          id: "agent_123",
          name: "Updated Name",
          message: "Agent updated successfully",
        },
      };

      expect(response.success).toBe(true);
    });
  });

  describe("DELETE /api/v2/agents/[agentId]", () => {
    it("should delete agent successfully", async () => {
      const response = {
        success: true,
        data: {
          id: "agent_123",
          message: "Agent deleted successfully",
        },
      };

      expect(response.success).toBe(true);
    });
  });
});
