// app/api/v2/webhooks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleError } from "@/lib/errors/errorHandler";
import { ValidationError } from "@/lib/errors/AppError";
import { logger } from "@/lib/utils/logger";
import { AIAgentService } from "@/lib/services/aiAgent";
import {
  withRateLimit,
  webhookRateLimiter,
} from "@/lib/middleware/rateLimiter";

/**
 * POST /api/v2/webhooks/send-lead - Send a lead to webhook
 * Rate Limited: 5 requests per minute per IP
 */
async function webhookPostHandler(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.leadId) {
      throw new ValidationError("leadId is required");
    }

    if (!body.webhookUrl) {
      throw new ValidationError("webhookUrl is required");
    }

    // Validate webhook URL
    try {
      new URL(body.webhookUrl);
    } catch {
      throw new ValidationError("Invalid webhook URL");
    }

    const supabase = await createClient();

    // Get lead details
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("*, agents(name, role, settings)")
      .eq("id", body.leadId)
      .single();

    if (leadError || !lead) {
      throw new ValidationError("Lead not found");
    }

    // Send to webhook
    const aiService = new AIAgentService();
    const success = await aiService.sendLeadToWebhook(body.webhookUrl, {
      name: lead.name || undefined,
      email: lead.email || undefined,
      phone: lead.phone || undefined,
      company: lead.company || undefined,
      interest: lead.interest || undefined,
      capturedAt: lead.captured_at,
      conversationId: lead.conversation_id || "",
    });

    if (!success) {
      throw new Error("Failed to send lead to webhook");
    }

    // Update lead as sent
    await supabase
      .from("leads")
      .update({
        sent_to_webhook: true,
        webhook_sent_at: new Date().toISOString(),
      })
      .eq("id", body.leadId);

    logger.info("Lead sent to webhook", {
      leadId: body.leadId,
      webhookUrl: body.webhookUrl,
    });

    return NextResponse.json({
      success: true,
      data: {
        message: "Lead sent to webhook successfully",
        leadId: body.leadId,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

// Export POST with rate limiting
export const POST = withRateLimit(webhookRateLimiter, webhookPostHandler);

/**
 * PUT /api/v2/webhooks/test - Test webhook configuration
 * Rate Limited: 5 requests per minute per IP
 */
async function webhookTestHandler(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.webhookUrl) {
      throw new ValidationError("webhookUrl is required");
    }

    // Validate webhook URL
    try {
      new URL(body.webhookUrl);
    } catch {
      throw new ValidationError("Invalid webhook URL");
    }

    // Send test payload
    const testPayload = {
      event: "lead_captured",
      timestamp: new Date().toISOString(),
      test: true,
      lead: {
        name: "John Doe",
        email: "john@example.com",
        phone: "+1234567890",
        company: "Test Company",
        interest: "Product Demo",
        capturedAt: new Date().toISOString(),
        conversationId: "test_conversation",
      },
    };

    const response = await fetch(body.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Test": "true",
      },
      body: JSON.stringify(testPayload),
    });

    const success = response.ok;
    const statusCode = response.status;

    logger.info("Webhook test completed", {
      webhookUrl: body.webhookUrl,
      success,
      statusCode,
    });

    return NextResponse.json({
      success: true,
      data: {
        webhookUrl: body.webhookUrl,
        testSuccessful: success,
        statusCode,
        message: success
          ? "Webhook is configured correctly"
          : `Webhook returned error (${statusCode})`,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

// Export PUT with rate limiting
export const PUT = withRateLimit(webhookRateLimiter, webhookTestHandler);
