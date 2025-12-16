// app/api/webhooks/lead-capture/route.ts
import { NextRequest, NextResponse } from "next/server";
import { LeadService, WebhookPayload } from "@/lib/services/leadService";
import { handleError } from "@/lib/errors/errorHandler";
import { logger } from "@/lib/utils/logger";
import { ValidationError } from "@/lib/errors/AppError";

/**
 * Configure webhook endpoint for lead capture
 * POST /api/webhooks/lead-capture
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { leadId, webhookUrl, notificationEmail } = body;

    if (!leadId) {
      throw new ValidationError("leadId is required");
    }

    // Get lead details
    const lead = await LeadService.getLead(leadId);

    if (!lead) {
      throw new ValidationError("Lead not found");
    }

    // Prepare webhook payload
    const payload: WebhookPayload = {
      leadId: lead.id,
      agentId: lead.agent_id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      message: lead.message,
      capturedAt: lead.created_at,
      websiteUrl: lead.metadata?.websiteUrl || "",
    };

    // Send to webhook if provided
    let webhookSent = false;
    if (webhookUrl) {
      webhookSent = await LeadService.sendWebhookNotification(
        webhookUrl,
        payload
      );
    }

    // Send email notification if provided
    let emailSent = false;
    if (notificationEmail) {
      emailSent = await LeadService.sendEmailNotification(
        notificationEmail,
        lead,
        lead.metadata?.websiteUrl || ""
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        leadId,
        webhookSent,
        emailSent,
        payload,
      },
    });
  } catch (error) {
    logger.error("Webhook API error", { error });
    return handleError(error);
  }
}

/**
 * Test webhook endpoint
 * GET /api/webhooks/lead-capture?url=...
 */
export async function GET(req: NextRequest) {
  try {
    const webhookUrl = req.nextUrl.searchParams.get("url");

    if (!webhookUrl) {
      throw new ValidationError("url parameter is required");
    }

    // Send test payload
    const testPayload: WebhookPayload = {
      leadId: "test_lead_123",
      agentId: "test_agent_123",
      name: "John Doe",
      email: "john@example.com",
      message: "This is a test lead",
      capturedAt: new Date().toISOString(),
      websiteUrl: "https://example.com",
    };

    const success = await LeadService.sendWebhookNotification(
      webhookUrl,
      testPayload
    );

    return NextResponse.json({
      success,
      message: success
        ? "Test webhook sent successfully"
        : "Failed to send test webhook",
      testPayload,
    });
  } catch (error) {
    logger.error("Webhook test error", { error });
    return handleError(error);
  }
}
