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
 * CRM Integration Service
 * Currently supports HubSpot with easy extension for other CRMs
 */
export class CRMService {
  private hubspotApiKey: string | undefined;

  constructor() {
    this.hubspotApiKey = process.env.HUBSPOT_API_KEY;
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
   * Sync lead to HubSpot
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

      // Create or update contact in HubSpot
      const response = await fetch(
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
    } catch (error) {
      logger.error("Error syncing to HubSpot", { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Update existing HubSpot contact
   */
  private async updateHubSpotContact(
    email: string,
    contactData: HubSpotContact
  ): Promise<CRMSyncResult> {
    try {
      // First, search for the contact by email
      const searchResponse = await fetch(
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
      const updateResponse = await fetch(
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
    } catch (error) {
      logger.error("Error updating HubSpot contact", { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Test HubSpot connection
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
      const response = await fetch(
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
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Add note/activity to HubSpot contact
   */
  async addActivityToContact(
    contactId: string,
    activityNote: string
  ): Promise<boolean> {
    if (!this.hubspotApiKey) {
      return false;
    }

    try {
      const response = await fetch(
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
    } catch (error) {
      logger.error("Error adding activity to HubSpot", { error });
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
