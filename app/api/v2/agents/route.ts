// app/api/v2/agents/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from "next/server";
import { handleError } from "@/lib/errors/errorHandler";
import { logger } from "@/lib/utils/logger";
import { ValidationError } from "@/lib/errors/AppError";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

// Type helper for agents table
type AgentRow = Database["public"]["Tables"]["agents"]["Row"];

// GET /api/v2/agents - List all agents
export async function GET(request: NextRequest) {
  try {
    logger.info("Fetching agents list");

    // ✅ FIXED: Query the actual database
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.warn("User not authenticated in GET /api/v2/agents");
      throw new ValidationError("Authentication required");
    }

    // Fetch agents from database - RLS will automatically filter by user_id
    const { data: agents, error } = await supabase
      .from("agents")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching agents", { error: error.message });
      throw new Error(`Database error: ${error.message}`);
    }

    // ✅ FIXED: Add proper type annotation to map function
    const formattedAgents = (agents || []).map((agent: AgentRow) => ({
      id: agent.id,
      name: agent.name,
      websiteUrl: agent.website_url,
      role: agent.role,
      status: agent.status,
      createdAt: agent.created_at,
      updatedAt: agent.updated_at,
      settings: agent.settings,
    }));

    logger.info("Agents fetched successfully", {
      count: formattedAgents.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        agents: formattedAgents,
        total: formattedAgents.length,
        page: 1,
        pageSize: formattedAgents.length,
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

    // ✅ FIXED: Create agent in database
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new ValidationError("Authentication required");
    }

    // Prepare settings
    const settings = {
      name: body.name,
      url: body.websiteUrl,
      role: body.role,
      persona: body.persona || `Professional ${body.role} representative`,
      summary:
        body.summary || `AI ${body.role} assistant for ${body.websiteUrl}`,
      tone: body.tone || "professional",
      ...(body.settings || {}),
    };

    // Insert agent into database
    const { data: agent, error } = await supabase
      .from("agents")
      .insert({
        user_id: user.id,
        name: body.name,
        website_url: body.websiteUrl,
        role: body.role,
        status: body.status || "active",
        settings: settings,
        system_prompt: body.systemPrompt || null,
      })
      .select()
      .single();

    if (error) {
      logger.error("Error creating agent", { error: error.message });
      throw new Error(`Database error: ${error.message}`);
    }

    if (!agent) {
      throw new Error("No agent returned from database");
    }

    logger.info("Agent created successfully", {
      agentId: agent.id,
      userId: user.id,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          agentId: agent.id,
          name: agent.name,
          websiteUrl: agent.website_url,
          role: agent.role,
          persona: body.persona || settings.persona,
          status: agent.status,
          message: "Agent created successfully",
          createdAt: agent.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}
