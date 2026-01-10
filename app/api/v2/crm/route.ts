// app/api/v2/crm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { CRMService } from "@/lib/services/crmService";
import { handleError } from "@/lib/errors/errorHandler";
import { ValidationError } from "@/lib/errors/AppError";
import { logger } from "@/lib/utils/logger";
import { createClient } from "@/lib/supabase/server";
import { withRateLimit, crmRateLimiter } from "@/lib/middleware/rateLimiter";

/**
 * POST /api/v2/crm/test - Test CRM connection
 * Rate Limited: 10 requests per minute per IP
 */
async function crmTestHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const crmType = body.crmType || "hubspot";

    if (crmType !== "hubspot") {
      throw new ValidationError(
        "Only HubSpot is currently supported. Salesforce coming soon."
      );
    }

    const crmService = new CRMService();

    if (!crmService.isHubSpotConfigured()) {
      throw new ValidationError(
        "HubSpot API key not configured. Please set HUBSPOT_API_KEY in environment variables."
      );
    }

    const result = await crmService.testHubSpotConnection();

    logger.info("CRM connection test", { crmType, success: result.success });

    return NextResponse.json({
      success: result.success,
      data: {
        crmType,
        connected: result.success,
        accountName: result.accountName,
        error: result.error,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

// Export POST with rate limiting
export const POST = withRateLimit(crmRateLimiter, crmTestHandler);

/**
 * PUT /api/v2/crm/sync-lead - Manually sync a lead to CRM
 * Rate Limited: 10 requests per minute per IP
 */
async function crmSyncHandler(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.leadId) {
      throw new ValidationError("leadId is required");
    }

    const supabase = await createClient();

    // Get lead details
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("*, agents(name, role)")
      .eq("id", body.leadId)
      .single();

    if (leadError || !lead) {
      throw new ValidationError("Lead not found");
    }

    // Check if already synced
    if (lead.crm_synced) {
      return NextResponse.json({
        success: true,
        data: {
          message: "Lead already synced to CRM",
          leadId: body.leadId,
          crmContactId: lead.crm_sync_id,
        },
      });
    }

    const crmService = new CRMService();

    if (!crmService.isHubSpotConfigured()) {
      throw new ValidationError("HubSpot is not configured");
    }

    // Sync to HubSpot
    const result = await crmService.syncToHubSpot(
      {
        name: lead.name || undefined,
        email: lead.email || undefined,
        phone: lead.phone || undefined,
        company: lead.company || undefined,
        interest: lead.interest || undefined,
        capturedAt: lead.captured_at,
        conversationId: lead.conversation_id || "",
      },
      lead.agents?.name || "Unknown Agent"
    );

    if (!result.success) {
      throw new Error(`CRM sync failed: ${result.error}`);
    }

    // Update lead in database
    await supabase
      .from("leads")
      .update({
        crm_synced: true,
        crm_sync_id: result.crmContactId,
        crm_synced_at: new Date().toISOString(),
      })
      .eq("id", body.leadId);

    logger.info("Lead synced to CRM", {
      leadId: body.leadId,
      crmContactId: result.crmContactId,
    });

    return NextResponse.json({
      success: true,
      data: {
        message: "Lead synced to HubSpot successfully",
        leadId: body.leadId,
        crmContactId: result.crmContactId,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

// Export PUT with rate limiting
export const PUT = withRateLimit(crmRateLimiter, crmSyncHandler);

/**
 * GET /api/v2/crm/status - Get CRM integration status
 * Rate Limited: 10 requests per minute per IP
 */
async function crmStatusHandler(request: NextRequest) {
  try {
    const crmService = new CRMService();

    const hubspotConfigured = crmService.isHubSpotConfigured();
    let hubspotConnected = false;
    let hubspotAccountName = null;

    if (hubspotConfigured) {
      const testResult = await crmService.testHubSpotConnection();
      hubspotConnected = testResult.success;
      hubspotAccountName = testResult.accountName || null;
    }

    return NextResponse.json({
      success: true,
      data: {
        integrations: {
          hubspot: {
            configured: hubspotConfigured,
            connected: hubspotConnected,
            accountName: hubspotAccountName,
          },
          salesforce: {
            configured: false,
            connected: false,
            note: "Coming soon",
          },
        },
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

// Export GET with rate limiting
export const GET = withRateLimit(crmRateLimiter, crmStatusHandler);
