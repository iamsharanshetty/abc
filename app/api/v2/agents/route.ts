// app/api/v2/agents/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleError } from "@/lib/errors/errorHandler";
import { logger } from "@/lib/utils/logger";
import { ValidationError } from "@/lib/errors/AppError";

// GET /api/v2/agents - List all agents
export async function GET(request: NextRequest) {
  try {
    logger.info("Fetching agents list");

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Placeholder response
    return NextResponse.json({
      success: true,
      data: {
        agents: [
          {
            id: "agent_1",
            name: "Sales Rep",
            websiteUrl: "https://example.com",
            role: "sales",
            status: "active",
            createdAt: new Date().toISOString(),
          },
          {
            id: "agent_2",
            name: "Support Bot",
            websiteUrl: "https://example2.com",
            role: "support",
            status: "active",
            createdAt: new Date().toISOString(),
          },
        ],
        total: 2,
        page: 1,
        pageSize: 10,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/v2/agents - Create a new agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    logger.info("Creating new agent", { body });

    // Validate required fields
    if (!body.websiteUrl) {
      throw new ValidationError("websiteUrl is required");
    }

    if (!body.name) {
      throw new ValidationError("name is required");
    }

    if (!body.role) {
      throw new ValidationError("role is required");
    }

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Placeholder response
    const agentId = `agent_${Date.now()}`;

    return NextResponse.json(
      {
        success: true,
        data: {
          agentId,
          name: body.name,
          websiteUrl: body.websiteUrl,
          role: body.role,
          persona: body.persona || "Default persona",
          status: "creating",
          message: "Agent creation initiated",
          createdAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}
