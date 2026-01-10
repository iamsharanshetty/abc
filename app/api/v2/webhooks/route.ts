// app/api/v2/webhooks/route.ts - ENHANCED VERSION
// ✅ Fixed: Added comprehensive webhook response validation

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
 * ✅ NEW: Webhook validation options
 */
interface WebhookValidationOptions {
  validateResponse?: boolean;
  expectedStructure?: {
    requiredFields?: string[];
    responseType?: "json" | "text" | "any";
  };
  verifySignature?: boolean;
  signatureHeader?: string;
  signatureSecret?: string;
}

/**
 * ✅ NEW: Webhook test result with detailed validation info
 */
interface WebhookTestResult {
  webhookUrl: string;
  testSuccessful: boolean;
  statusCode: number;
  responseTime: number;
  validation: {
    statusCodeValid: boolean;
    responseBodyValid: boolean;
    responseBodyParsed?: any;
    responseBodyError?: string;
    requiredFieldsPresent?: boolean;
    missingFields?: string[];
    signatureValid?: boolean;
  };
  message: string;
  recommendations?: string[];
}

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
 * ✅ NEW: Validate webhook response body
 */
async function validateWebhookResponse(
  response: Response,
  options?: WebhookValidationOptions
): Promise<{
  valid: boolean;
  parsed?: any;
  error?: string;
  missingFields?: string[];
}> {
  // If validation is disabled, return valid
  if (!options?.validateResponse) {
    return { valid: true };
  }

  try {
    const contentType = response.headers.get("content-type") || "";
    let parsed: any;

    // Parse based on content type
    if (contentType.includes("application/json")) {
      const text = await response.text();
<<<<<<< HEAD
      
=======

>>>>>>> chat-backup
      // Check for empty response
      if (!text || text.trim().length === 0) {
        return {
          valid: options.expectedStructure?.responseType !== "json",
          error: "Empty response body",
        };
      }

      try {
        parsed = JSON.parse(text);
<<<<<<< HEAD
      } catch (parseError) {
=======
      } catch {
>>>>>>> chat-backup
        return {
          valid: false,
          error: "Invalid JSON in response",
        };
      }

      // Validate required fields if specified
      if (options.expectedStructure?.requiredFields) {
        const missingFields: string[] = [];
<<<<<<< HEAD
        
=======

>>>>>>> chat-backup
        for (const field of options.expectedStructure.requiredFields) {
          // Support nested field checking (e.g., "data.id")
          const fieldParts = field.split(".");
          let current = parsed;
          let found = true;

          for (const part of fieldParts) {
            if (current && typeof current === "object" && part in current) {
              current = current[part];
            } else {
              found = false;
              break;
            }
          }

          if (!found) {
            missingFields.push(field);
          }
        }

        if (missingFields.length > 0) {
          return {
            valid: false,
            parsed,
            error: `Missing required fields: ${missingFields.join(", ")}`,
            missingFields,
          };
        }
      }

      return { valid: true, parsed };
    } else if (contentType.includes("text/")) {
      const text = await response.text();
      return { valid: true, parsed: text };
    } else {
      // Binary or unknown content type
      return {
        valid: options.expectedStructure?.responseType !== "json",
        error: `Unexpected content type: ${contentType}`,
      };
    }
  } catch (error) {
    return {
      valid: false,
<<<<<<< HEAD
      error: `Failed to validate response: ${error instanceof Error ? error.message : String(error)}`,
=======
      error: `Failed to validate response: ${
        error instanceof Error ? error.message : String(error)
      }`,
>>>>>>> chat-backup
    };
  }
}

/**
 * ✅ NEW: Verify webhook signature (for webhooks that support it)
 */
<<<<<<< HEAD
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    // Using crypto (Node.js built-in)
    const crypto = require("crypto");
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(payload);
    const expectedSignature = hmac.digest("hex");

    // Compare signatures (timing-safe comparison)
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    logger.error("Signature verification failed", { error });
    return false;
  }
}
=======
// function verifyWebhookSignature(
//   payload: string,
//   signature: string,
//   secret: string
// ): boolean {
//   try {
//     // Using crypto (Node.js built-in)
//     const crypto = require("crypto");
//     const hmac = crypto.createHmac("sha256", secret);
//     hmac.update(payload);
//     const expectedSignature = hmac.digest("hex");

//     // Compare signatures (timing-safe comparison)
//     return crypto.timingSafeEqual(
//       Buffer.from(signature),
//       Buffer.from(expectedSignature)
//     );
//   } catch (error) {
//     logger.error("Signature verification failed", { error });
//     return false;
//   }
// }
>>>>>>> chat-backup

/**
 * ✅ ENHANCED: Test webhook with comprehensive validation
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

    // ✅ NEW: Parse validation options
    const validationOptions: WebhookValidationOptions = {
      validateResponse: body.validateResponse !== false, // Default to true
      expectedStructure: body.expectedStructure || {
        responseType: "any",
      },
      verifySignature: body.verifySignature || false,
      signatureHeader: body.signatureHeader || "X-Webhook-Signature",
      signatureSecret: body.signatureSecret,
    };

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

    const payloadString = JSON.stringify(testPayload);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Webhook-Test": "true",
      "User-Agent": "WebRep/1.0",
    };

    // ✅ NEW: Add signature if requested
<<<<<<< HEAD
    if (validationOptions.verifySignature && validationOptions.signatureSecret) {
      const crypto = require("crypto");
      const hmac = crypto.createHmac("sha256", validationOptions.signatureSecret);
      hmac.update(payloadString);
      const signature = hmac.digest("hex");
      headers[validationOptions.signatureHeader || "X-Webhook-Signature"] = signature;
=======
    if (
      validationOptions.verifySignature &&
      validationOptions.signatureSecret
    ) {
      const crypto = require("crypto");
      const hmac = crypto.createHmac(
        "sha256",
        validationOptions.signatureSecret
      );
      hmac.update(payloadString);
      const signature = hmac.digest("hex");
      headers[validationOptions.signatureHeader || "X-Webhook-Signature"] =
        signature;
>>>>>>> chat-backup
    }

    // ✅ ENHANCED: Make request with timing
    const startTime = Date.now();
    let response: Response;
<<<<<<< HEAD
    
=======

>>>>>>> chat-backup
    try {
      response = await fetch(body.webhookUrl, {
        method: "POST",
        headers,
        body: payloadString,
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });
    } catch (fetchError: any) {
      // Handle network errors
      logger.error("Webhook test request failed", {
        webhookUrl: body.webhookUrl,
        error: fetchError.message,
      });

      return NextResponse.json({
        success: false,
        error: {
          webhookUrl: body.webhookUrl,
          testSuccessful: false,
          statusCode: 0,
          responseTime: Date.now() - startTime,
          validation: {
            statusCodeValid: false,
            responseBodyValid: false,
            responseBodyError: fetchError.message,
          },
          message: `Request failed: ${fetchError.message}`,
          recommendations: [
            "Check if the webhook URL is accessible",
            "Verify the URL is correct and the service is running",
            "Check if there are any firewall rules blocking the request",
          ],
        },
      });
    }

    const responseTime = Date.now() - startTime;

    // ✅ NEW: Validate response
    const responseValidation = await validateWebhookResponse(
      response,
      validationOptions
    );

    // ✅ NEW: Build test result with detailed validation
    const testResult: WebhookTestResult = {
      webhookUrl: body.webhookUrl,
      testSuccessful: response.ok && responseValidation.valid,
      statusCode: response.status,
      responseTime,
      validation: {
        statusCodeValid: response.ok,
        responseBodyValid: responseValidation.valid,
        responseBodyParsed: responseValidation.parsed,
        responseBodyError: responseValidation.error,
        missingFields: responseValidation.missingFields,
      },
      message: "",
      recommendations: [],
    };

    // ✅ NEW: Generate message and recommendations
    if (testResult.testSuccessful) {
      testResult.message = `✓ Webhook is configured correctly (${responseTime}ms response time)`;
<<<<<<< HEAD
      
=======

>>>>>>> chat-backup
      if (responseTime > 3000) {
        testResult.recommendations?.push(
          "⚠️ Response time is slow (>3s). Consider optimizing your webhook handler."
        );
      }
    } else {
      // Status code issues
      if (!testResult.validation.statusCodeValid) {
        testResult.message = `✗ Webhook returned error status ${response.status}`;
        testResult.recommendations?.push(
          `Check webhook logs to see why it returned ${response.status}`,
<<<<<<< HEAD
          "Verify the webhook handler can process the test payload",
=======
          "Verify the webhook handler can process the test payload"
>>>>>>> chat-backup
        );

        if (response.status === 404) {
          testResult.recommendations?.push(
            "The URL might be incorrect or the endpoint doesn't exist"
          );
        } else if (response.status === 401 || response.status === 403) {
          testResult.recommendations?.push(
            "Authentication might be required for this webhook"
          );
        } else if (response.status >= 500) {
          testResult.recommendations?.push(
            "The webhook service is experiencing server errors"
          );
        }
      }

      // Response body issues
      if (!testResult.validation.responseBodyValid) {
        testResult.message += ` - ${testResult.validation.responseBodyError}`;
<<<<<<< HEAD
        
        if (testResult.validation.missingFields?.length) {
          testResult.recommendations?.push(
            `Expected fields missing: ${testResult.validation.missingFields.join(", ")}`
=======

        if (testResult.validation.missingFields?.length) {
          testResult.recommendations?.push(
            `Expected fields missing: ${testResult.validation.missingFields.join(
              ", "
            )}`
>>>>>>> chat-backup
          );
        }

        if (testResult.validation.responseBodyError?.includes("JSON")) {
          testResult.recommendations?.push(
            "Ensure webhook returns valid JSON if Content-Type is application/json"
          );
        }
      }

      // Timeout issues
      if (responseTime > 9000) {
        testResult.recommendations?.push(
          "⚠️ Request nearly timed out. Webhook should respond within 10 seconds."
        );
      }
    }

    logger.info("Webhook test completed", {
      webhookUrl: body.webhookUrl,
      success: testResult.testSuccessful,
      statusCode: response.status,
      responseTime,
      validationEnabled: validationOptions.validateResponse,
    });

    return NextResponse.json({
      success: true,
      data: testResult,
    });
  } catch (error) {
    return handleError(error);
  }
}

// Export PUT with rate limiting
<<<<<<< HEAD
export const PUT = withRateLimit(webhookRateLimiter, webhookTestHandler);
=======
export const PUT = withRateLimit(webhookRateLimiter, webhookTestHandler);
>>>>>>> chat-backup
