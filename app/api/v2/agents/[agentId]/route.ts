// app/api/v2/agents/[agentId]/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from "next/server";
import { handleError } from "@/lib/errors/errorHandler";
import { logger } from "@/lib/utils/logger";
import { ValidationError } from "@/lib/errors/AppError";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

// GET /api/v2/agents/[agentId] - Get agent details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;

    if (!agentId) {
      throw new ValidationError("Agent ID is required");
    }

    logger.info("Fetching agent details", { agentId });

    // ✅ FIXED: Query the actual database
    // Try authenticated access first, fall back to service client for public access
    let agent = null;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Authenticated request - use RLS
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .eq("id", agentId)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = not found, which is expected for non-owned agents
        logger.error("Error fetching agent", { error: error.message, agentId });
      }

      agent = data;
    }

    // If not found via RLS or no user, try service client (for public embed access)
    if (!agent) {
      const serviceClient = createServiceClient();
      const { data, error } = await serviceClient
        .from("agents")
        .select("*")
        .eq("id", agentId)
        .single();

      if (error) {
        logger.warn("Agent not found", { agentId, error: error.message });
        throw new ValidationError("Agent not found");
      }

      agent = data;
    }

    if (!agent) {
      throw new ValidationError("Agent not found");
    }

    // Parse settings safely
    const settings = agent.settings || {};
    const metadata = agent.metadata || {};

    // Return REAL data from database
    return NextResponse.json({
      success: true,
      data: {
        id: agent.id,
        name: agent.name,
        websiteUrl: agent.website_url,
        role: agent.role,
        persona: (settings as any)?.persona || "",
        status: agent.status,
        settings: {
          language: (settings as any)?.language || "en",
          tone: (settings as any)?.tone || "professional",
          responseLength: (settings as any)?.responseLength || "medium",
          ...(typeof settings === "object" ? settings : {}),
        },
        statistics: {
          totalConversations: (metadata as any)?.totalConversations || 0,
          averageResponseTime: (metadata as any)?.averageResponseTime || 0,
          satisfactionScore: (metadata as any)?.satisfactionScore || 0,
        },
        createdAt: agent.created_at,
        updatedAt: agent.updated_at,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

// PATCH /api/v2/agents/[agentId] - Update agent
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;
    const body = await request.json();

    if (!agentId) {
      throw new ValidationError("Agent ID is required");
    }

    logger.info("Updating agent", { agentId, updates: body });

    // ✅ FIXED: Update in database
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new ValidationError("Authentication required");
    }

    // Prepare update data
    const updateData: any = {};

    if (body.name) updateData.name = body.name;
    if (body.websiteUrl) updateData.website_url = body.websiteUrl;
    if (body.role) updateData.role = body.role;
    if (body.status) updateData.status = body.status;
    if (body.systemPrompt !== undefined)
      updateData.system_prompt = body.systemPrompt;

    // Handle settings update
    if (body.settings) {
      // Get existing agent to merge settings
      const { data: existingAgent } = await supabase
        .from("agents")
        .select("settings")
        .eq("id", agentId)
        .single();

      const currentSettings = existingAgent?.settings || {};
      updateData.settings = {
        ...(typeof currentSettings === "object" ? currentSettings : {}),
        ...body.settings,
      };
    }

    // Update agent
    const { data: agent, error } = await supabase
      .from("agents")
      .update(updateData)
      .eq("id", agentId)
      .select()
      .single();

    if (error) {
      logger.error("Error updating agent", { error: error.message, agentId });
      throw new Error(`Database error: ${error.message}`);
    }

    if (!agent) {
      throw new ValidationError("Agent not found or you don't have permission");
    }

    logger.info("Agent updated successfully", { agentId });

    return NextResponse.json({
      success: true,
      data: {
        id: agent.id,
        name: agent.name,
        websiteUrl: agent.website_url,
        role: agent.role,
        status: agent.status,
        updatedAt: agent.updated_at,
        message: "Agent updated successfully",
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/v2/agents/[agentId] - Delete agent
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;

    if (!agentId) {
      throw new ValidationError("Agent ID is required");
    }

    logger.info("Deleting agent", { agentId });

    // ✅ FIXED: Delete from database
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new ValidationError("Authentication required");
    }

    // Delete agent
    const { error } = await supabase.from("agents").delete().eq("id", agentId);

    if (error) {
      logger.error("Error deleting agent", { error: error.message, agentId });
      throw new Error(`Database error: ${error.message}`);
    }

    logger.info("Agent deleted successfully", { agentId });

    return NextResponse.json({
      success: true,
      data: {
        id: agentId,
        message: "Agent deleted successfully",
        deletedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
