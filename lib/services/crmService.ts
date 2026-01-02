// lib/services/crmService.ts
import { logger } from "@/lib/utils/logger";
import { LeadData } from "./aiAgent";

interface HubSpotContact {
  properties: {
    email: string;
    firstname?: string;
    lastname?: string;
    phone?: string;
    company?: string;
    hs_lead_status?: string;
    lead_source?: string;
    notes?: string;
  };
}

interface CRMSyncResult {
  success: boolean;
  crmContactId?: string;
  error?: string;
}

/**
 * Configuration for retry logic
 */
interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // Base delay in ms
  maxDelay: number; // Maximum delay in ms
  timeout: number; // Request timeout in ms
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  timeout: 10000, // 10 seconds
};

/**
 * CRM Integration Service
 * Currently supports HubSpot with easy extension for other CRMs
 */
export class CRMService {
  private hubspotApiKey: string | undefined;
  private retryConfig: RetryConfig;

  constructor(retryConfig?: Partial<RetryConfig>) {
    this.hubspotApiKey = process.env.HUBSPOT_API_KEY;
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  }

  /**
   * Check if HubSpot is configured
   */
  isHubSpotConfigured(): boolean {
    return !!this.hubspotApiKey;
  }

  /**
   * Parse full name into first and last name
   */
  private parseFullName(fullName: string): {
    firstname: string;
    lastname: string;
  } {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) {
      return { firstname: parts[0], lastname: "" };
    }
    return {
      firstname: parts[0],
      lastname: parts.slice(1).join(" "),
    };
  }

  /**
   * Determine if an error is retryable based on HTTP status or error type
   */
  private isRetryableError(error: any, statusCode?: number): boolean {
    // Retry on network errors
    if (error.name === "AbortError" || error.name === "TypeError") {
      return true;
    }

    // Retry on specific HTTP status codes
    if (statusCode) {
      // 429: Rate limit - definitely retry
      // 500, 502, 503, 504: Server errors - retry
      // 408: Request timeout - retry
      const retryableStatuses = [408, 429, 500, 502, 503, 504];
      return retryableStatuses.includes(statusCode);
    }

    return false;
  }

  /**
   * Calculate delay for exponential backoff
   * For rate limits (429), use longer delays
   */
  private calculateDelay(attempt: number, statusCode?: number): number {
    // For rate limits, use longer delays
    const multiplier = statusCode === 429 ? 2 : 1;
    const delay = Math.min(
      this.retryConfig.baseDelay * Math.pow(2, attempt) * multiplier,
      this.retryConfig.maxDelay
    );

    // Add jitter (random variation) to prevent thundering herd
    const jitter = Math.random() * 0.3 * delay; // ±30% jitter
    return delay + jitter;
  }

  /**
   * Make HTTP request with timeout and retry logic
   */
  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    attempt: number = 0
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.retryConfig.timeout
    );

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // If response is ok or not retryable, return it
      if (response.ok || !this.isRetryableError(null, response.status)) {
        return response;
      }

      // If we should retry
      if (attempt < this.retryConfig.maxRetries) {
        const delay = this.calculateDelay(attempt, response.status);

        logger.warn("HubSpot API request failed, retrying", {
          attempt: attempt + 1,
          maxRetries: this.retryConfig.maxRetries,
          statusCode: response.status,
          retryInMs: Math.round(delay),
        });

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Retry
        return this.fetchWithRetry(url, options, attempt + 1);
      }

      // Max retries exceeded
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);

      // Check if error is retryable
      if (
        this.isRetryableError(error) &&
        attempt < this.retryConfig.maxRetries
      ) {
        const delay = this.calculateDelay(attempt);

        logger.warn("HubSpot API request error, retrying", {
          attempt: attempt + 1,
          maxRetries: this.retryConfig.maxRetries,
          error: error.message,
          retryInMs: Math.round(delay),
        });

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Retry
        return this.fetchWithRetry(url, options, attempt + 1);
      }

      // Not retryable or max retries exceeded
      throw error;
    }
  }

  /**
   * Sync lead to HubSpot with retry logic
   */
  async syncToHubSpot(
    leadData: LeadData,
    agentName: string
  ): Promise<CRMSyncResult> {
    if (!this.hubspotApiKey) {
      return {
        success: false,
        error: "HubSpot API key not configured",
      };
    }

    try {
      // Parse name if provided
      const names = leadData.name
        ? this.parseFullName(leadData.name)
        : { firstname: "", lastname: "" };

      // Prepare contact data
      const contactData: HubSpotContact = {
        properties: {
          email: leadData.email || "",
          ...(names.firstname && { firstname: names.firstname }),
          ...(names.lastname && { lastname: names.lastname }),
          ...(leadData.phone && { phone: leadData.phone }),
          ...(leadData.company && { company: leadData.company }),
          hs_lead_status: "NEW",
          lead_source: `WebRep AI Agent: ${agentName}`,
          notes: `Lead captured via AI agent conversation.
Conversation ID: ${leadData.conversationId}
Interest: ${leadData.interest || "Not specified"}
Captured: ${leadData.capturedAt}`,
        },
      };

      logger.info("Syncing lead to HubSpot", {
        email: leadData.email,
        agentName,
      });

      // Create contact in HubSpot with retry logic
      const response = await this.fetchWithRetry(
        "https://api.hubapi.com/crm/v3/objects/contacts",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.hubspotApiKey}`,
          },
          body: JSON.stringify(contactData),
        }
      );

      if (!response.ok) {
        // If contact exists (409), try to update instead
        if (response.status === 409) {
          logger.info("Contact exists, attempting update", {
            email: leadData.email,
          });
          return await this.updateHubSpotContact(leadData.email!, contactData);
        }

        const errorText = await response.text();
        logger.error("HubSpot API error", {
          status: response.status,
          error: errorText,
        });
        return {
          success: false,
          error: `HubSpot API error: ${response.status}`,
        };
      }

      const result = await response.json();
      logger.info("Lead synced to HubSpot successfully", {
        contactId: result.id,
        email: leadData.email,
      });

      return {
        success: true,
        crmContactId: result.id,
      };
    } catch (error: any) {
      logger.error("Error syncing to HubSpot", { error: error.message });

      // Provide specific error messages
      if (error.name === "AbortError") {
        return {
          success: false,
          error: "HubSpot API request timed out",
        };
      }

      return {
        success: false,
        error: error.message || "Unknown error",
      };
    }
  }

  /**
   * Update existing HubSpot contact with retry logic
   */
  private async updateHubSpotContact(
    email: string,
    contactData: HubSpotContact
  ): Promise<CRMSyncResult> {
    try {
      // First, search for the contact by email
      const searchResponse = await this.fetchWithRetry(
        `https://api.hubapi.com/crm/v3/objects/contacts/search`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.hubspotApiKey}`,
          },
          body: JSON.stringify({
            filterGroups: [
              {
                filters: [
                  {
                    propertyName: "email",
                    operator: "EQ",
                    value: email,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!searchResponse.ok) {
        return {
          success: false,
          error: "Failed to search for existing contact",
        };
      }

      const searchResult = await searchResponse.json();
      if (!searchResult.results || searchResult.results.length === 0) {
        return {
          success: false,
          error: "Contact not found for update",
        };
      }

      const contactId = searchResult.results[0].id;

      // Update the contact
      const updateResponse = await this.fetchWithRetry(
        `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.hubspotApiKey}`,
          },
          body: JSON.stringify(contactData),
        }
      );

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        logger.error("HubSpot update error", {
          status: updateResponse.status,
          error: errorText,
        });
        return {
          success: false,
          error: `Failed to update contact: ${updateResponse.status}`,
        };
      }

      logger.info("HubSpot contact updated", { contactId, email });
      return {
        success: true,
        crmContactId: contactId,
      };
    } catch (error: any) {
      logger.error("Error updating HubSpot contact", { error: error.message });

      if (error.name === "AbortError") {
        return {
          success: false,
          error: "HubSpot API request timed out",
        };
      }

      return {
        success: false,
        error: error.message || "Unknown error",
      };
    }
  }

  /**
   * Test HubSpot connection with retry logic
   */
  async testHubSpotConnection(): Promise<{
    success: boolean;
    accountName?: string;
    error?: string;
  }> {
    if (!this.hubspotApiKey) {
      return {
        success: false,
        error: "HubSpot API key not configured",
      };
    }

    try {
      const response = await this.fetchWithRetry(
        "https://api.hubapi.com/account-info/v3/details",
        {
          headers: {
            Authorization: `Bearer ${this.hubspotApiKey}`,
          },
        }
      );

      if (!response.ok) {
        return {
          success: false,
          error: `API returned ${response.status}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        accountName: data.portalId || "Connected",
      };
    } catch (error: any) {
      if (error.name === "AbortError") {
        return {
          success: false,
          error: "Connection test timed out",
        };
      }

      return {
        success: false,
        error: error.message || "Unknown error",
      };
    }
  }

  /**
   * Add note/activity to HubSpot contact with retry logic
   */
  async addActivityToContact(
    contactId: string,
    activityNote: string
  ): Promise<boolean> {
    if (!this.hubspotApiKey) {
      return false;
    }

    try {
      const response = await this.fetchWithRetry(
        "https://api.hubapi.com/crm/v3/objects/notes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.hubspotApiKey}`,
          },
          body: JSON.stringify({
            properties: {
              hs_note_body: activityNote,
              hs_timestamp: new Date().getTime(),
            },
            associations: [
              {
                to: { id: contactId },
                types: [
                  {
                    associationCategory: "HUBSPOT_DEFINED",
                    associationTypeId: 202, // Note to Contact
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        logger.error("Failed to add activity to HubSpot contact", {
          contactId,
          status: response.status,
        });
        return false;
      }

      logger.info("Activity added to HubSpot contact", { contactId });
      return true;
    } catch (error: any) {
      logger.error("Error adding activity to HubSpot", {
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Placeholder for Salesforce integration
   * Implement when needed
   */
  async syncToSalesforce(
    leadData: LeadData,
    agentName: string
  ): Promise<CRMSyncResult> {
    // TODO: Implement Salesforce integration
    logger.warn("Salesforce integration not yet implemented");
    return {
      success: false,
      error: "Salesforce integration not implemented",
    };
  }
}