// app/api/v2/leads/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleError } from "@/lib/errors/errorHandler";
import { ValidationError } from "@/lib/errors/AppError";
import { logger } from "@/lib/utils/logger";
import { AIAgentService } from "@/lib/services/aiAgent";
import { withRateLimit, leadsRateLimiter } from "@/lib/middleware/rateLimiter";

/**
 * GET /api/v2/leads - Get all leads for user's agents
 * Rate Limited: 30 requests per minute per IP
 */
async function leadsGetHandler(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const agentId = searchParams.get("agentId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const supabase = await createClient();

    // Build query - Use service client for testing
    let query = supabase
      .from("leads")
      .select("*, agents(name, role)", { count: "exact" })
      .order("captured_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by agent if specified
    if (agentId) {
      query = query.eq("agent_id", agentId);
    }

    // Filter by status if specified
    if (status) {
      query = query.eq("status", status);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    logger.info("Leads retrieved", { count, agentId, status });

    return NextResponse.json({
      success: true,
      data: {
        leads: data || [],
        total: count || 0,
        limit,
        offset,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

// Export GET with rate limiting
export const GET = withRateLimit(leadsRateLimiter, leadsGetHandler);

/**
 * POST /api/v2/leads - Manually create a lead
 * Rate Limited: 30 requests per minute per IP
 */
async function leadsPostHandler(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.agentId) {
      throw new ValidationError("agentId is required");
    }

    if (!body.email && !body.phone) {
      throw new ValidationError("At least email or phone is required");
    }

    const supabase = await createClient();

    // AUTHENTICATION CHECK: Get authenticated user
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      logger.warn("Unauthorized lead creation attempt", {
        agentId: body.agentId,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
          message: "You must be logged in to create leads",
        },
        { status: 401 }
      );
    }

    const userId = authData.user.id;

    // Verify agent exists and belongs to the authenticated user
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("id, user_id")
      .eq("id", body.agentId)
      .single();

    if (agentError || !agent) {
      throw new ValidationError("Agent not found");
    }

    // Verify ownership
    if (agent.user_id !== userId) {
      logger.warn(
        "Attempted to create lead for agent owned by different user",
        {
          agentId: body.agentId,
          requestUserId: userId,
          agentUserId: agent.user_id,
        }
      );
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
          message: "You don't have permission to create leads for this agent",
        },
        { status: 403 }
      );
    }

    // Insert lead
    const { data, error } = await supabase
      .from("leads")
      .insert({
        agent_id: body.agentId,
        conversation_id: body.conversationId || null,
        name: body.name || null,
        email: body.email || null,
        phone: body.phone || null,
        company: body.company || null,
        interest: body.interest || null,
        status: body.status || "new",
        metadata: body.metadata || {},
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    logger.info("Lead created", {
      leadId: data.id,
      agentId: body.agentId,
      userId,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          lead: data,
          message: "Lead created successfully",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}

// Export POST with rate limiting
export const POST = withRateLimit(leadsRateLimiter, leadsPostHandler);

/**
 * PATCH /api/v2/leads - Update a lead
 * Rate Limited: 30 requests per minute per IP
 */
async function leadsPatchHandler(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const leadId = searchParams.get("leadId");

    if (!leadId) {
      throw new ValidationError("leadId is required");
    }

    const body = await request.json();
    const supabase = await createClient();

    // Update lead
    const { data, error } = await supabase
      .from("leads")
      .update({
        ...(body.name !== undefined && { name: body.name }),
        ...(body.email !== undefined && { email: body.email }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.company !== undefined && { company: body.company }),
        ...(body.interest !== undefined && { interest: body.interest }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.metadata !== undefined && { metadata: body.metadata }),
      })
      .eq("id", leadId)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data) {
      throw new ValidationError("Lead not found");
    }

    logger.info("Lead updated", { leadId });

    return NextResponse.json({
      success: true,
      data: {
        lead: data,
        message: "Lead updated successfully",
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

// Export PATCH with rate limiting
export const PATCH = withRateLimit(leadsRateLimiter, leadsPatchHandler);
