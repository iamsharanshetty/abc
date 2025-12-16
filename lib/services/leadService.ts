// lib/services/leadService.ts
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { logger } from "@/lib/utils/logger";

export interface Lead {
  id: string;
  agent_id: string;
  session_id?: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  message?: string;
  source: string;
  status: "new" | "contacted" | "qualified" | "converted" | "lost";
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface WebhookPayload {
  leadId: string;
  agentId: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  message?: string;
  capturedAt: string;
  websiteUrl: string;
}

export class LeadService {
  /**
   * Create a new lead
   */
  static async createLead(leadData: Partial<Lead>): Promise<Lead> {
    try {
      const supabase = createServiceClient();

      const { data, error } = await supabase
        .from("leads")
        .insert({
          ...leadData,
          status: leadData.status || "new",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create lead: ${error.message}`);
      }

      logger.info("Lead created successfully", {
        leadId: data.id,
        email: data.email,
      });

      return data;
    } catch (error) {
      logger.error("Error creating lead", { error, leadData });
      throw error;
    }
  }

  /**
   * Get lead by ID
   */
  static async getLead(leadId: string): Promise<Lead | null> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("id", leadId)
        .single();

      if (error) {
        logger.error("Error fetching lead", { error, leadId });
        return null;
      }

      return data;
    } catch (error) {
      logger.error("Error getting lead", { error, leadId });
      return null;
    }
  }

  /**
   * Get all leads for an agent
   */
  static async getAgentLeads(
    agentId: string,
    options?: {
      status?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<Lead[]> {
    try {
      const supabase = await createClient();

      let query = supabase
        .from("leads")
        .select("*")
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false });

      if (options?.status) {
        query = query.eq("status", options.status);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(
          options.offset,
          options.offset + (options.limit || 10) - 1
        );
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch leads: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      logger.error("Error getting agent leads", { error, agentId });
      return [];
    }
  }

  /**
   * Update lead status
   */
  static async updateLeadStatus(
    leadId: string,
    status: Lead["status"],
    notes?: string
  ): Promise<boolean> {
    try {
      const supabase = await createClient();

      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (notes) {
        updateData.metadata = { notes };
      }

      const { error } = await supabase
        .from("leads")
        .update(updateData)
        .eq("id", leadId);

      if (error) {
        throw new Error(`Failed to update lead: ${error.message}`);
      }

      logger.info("Lead status updated", { leadId, status });
      return true;
    } catch (error) {
      logger.error("Error updating lead status", { error, leadId, status });
      return false;
    }
  }

  /**
   * Send lead notification via webhook
   */
  static async sendWebhookNotification(
    webhookUrl: string,
    payload: WebhookPayload
  ): Promise<boolean> {
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "WebRep-Lead-Notifier/1.0",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          `Webhook returned ${response.status}: ${response.statusText}`
        );
      }

      logger.info("Webhook notification sent", {
        webhookUrl,
        leadId: payload.leadId,
      });

      return true;
    } catch (error) {
      logger.error("Error sending webhook notification", {
        error,
        webhookUrl,
        payload,
      });
      return false;
    }
  }

  /**
   * Send email notification
   */
  static async sendEmailNotification(
    toEmail: string,
    lead: Partial<Lead>,
    websiteUrl: string
  ): Promise<boolean> {
    try {
      // In production, integrate with an email service like SendGrid, Resend, etc.
      // For now, we'll log the email content
      const emailContent = `
New Lead Captured!

From: ${lead.name || "Anonymous"} (${lead.email || "No email"})
Website: ${websiteUrl}
Message: ${lead.message || "No message provided"}

Captured at: ${new Date().toISOString()}

---
This lead was captured by WebRep AI Agent.
`;

      logger.info("Email notification prepared", {
        toEmail,
        leadEmail: lead.email,
        content: emailContent,
      });

      // TODO: Integrate actual email service
      console.log("EMAIL TO SEND:");
      console.log(`To: ${toEmail}`);
      console.log(`Subject: New Lead from ${websiteUrl}`);
      console.log(`Body: ${emailContent}`);

      return true;
    } catch (error) {
      logger.error("Error sending email notification", { error, toEmail });
      return false;
    }
  }

  /**
   * Get lead statistics
   */
  static async getLeadStats(agentId: string): Promise<{
    total: number;
    new: number;
    contacted: number;
    qualified: number;
    converted: number;
    conversionRate: number;
  }> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("leads")
        .select("status")
        .eq("agent_id", agentId);

      if (error || !data) {
        return {
          total: 0,
          new: 0,
          contacted: 0,
          qualified: 0,
          converted: 0,
          conversionRate: 0,
        };
      }

      const stats = {
        total: data.length,
        new: data.filter((l) => l.status === "new").length,
        contacted: data.filter((l) => l.status === "contacted").length,
        qualified: data.filter((l) => l.status === "qualified").length,
        converted: data.filter((l) => l.status === "converted").length,
        conversionRate: 0,
      };

      if (stats.total > 0) {
        stats.conversionRate = (stats.converted / stats.total) * 100;
      }

      return stats;
    } catch (error) {
      logger.error("Error getting lead stats", { error, agentId });
      return {
        total: 0,
        new: 0,
        contacted: 0,
        qualified: 0,
        converted: 0,
        conversionRate: 0,
      };
    }
  }
}
