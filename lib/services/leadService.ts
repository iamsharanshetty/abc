// lib/services/leadService.ts
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";
import { Database } from "@/lib/database.types";

// Type alias for Lead from database
type Lead = Database["public"]["Tables"]["leads"]["Row"];
type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "lost";

export interface WebhookPayload {
  leadId: string;
  agentId: string;
  name: string | null;
  email: string | null;
  phone?: string | null;
  company?: string | null;
  message?: string | null;
  capturedAt: string;
  websiteUrl: string;
}

export class LeadService {
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
      logger.error("Error in getLead", { error, leadId });
      return null;
    }
  }

  /**
   * Create a new lead
   */
  static async createLead(leadData: {
    agent_id: string;
    session_id?: string;
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    message?: string;
    source?: string;
    metadata?: any;
  }): Promise<Lead | null> {
    try {
      const supabase = await createClient();

      // Build insert object with proper types
      const insertData: LeadInsert = {
        agent_id: leadData.agent_id,
        session_id: leadData.session_id || null,
        name: leadData.name || null,
        email: leadData.email || null,
        phone: leadData.phone || null,
        company: leadData.company || null,
        message: leadData.message || null,
        source: leadData.source || "chat",
        status: "new",
        metadata: leadData.metadata || null,
      };

      const { data, error } = await supabase
        .from("leads")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        logger.error("Error creating lead", { error, leadData });
        return null;
      }

      logger.info("Lead created successfully", { leadId: data.id });
      return data;
    } catch (error) {
      logger.error("Error in createLead", { error, leadData });
      return null;
    }
  }

  /**
   * Update lead status
   */
  static async updateLeadStatus(
    leadId: string,
    status: LeadStatus
  ): Promise<boolean> {
    try {
      const supabase = await createClient();

      const { error } = await supabase
        .from("leads")
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq("id", leadId);

      if (error) {
        logger.error("Error updating lead status", { error, leadId, status });
        return false;
      }

      logger.info("Lead status updated", { leadId, status });
      return true;
    } catch (error) {
      logger.error("Error in updateLeadStatus", { error, leadId });
      return false;
    }
  }

  /**
   * Get leads for an agent
   */
  static async getAgentLeads(
    agentId: string,
    limit: number = 50
  ): Promise<Lead[]> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        logger.error("Error fetching agent leads", { error, agentId });
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error("Error in getAgentLeads", { error, agentId });
      return [];
    }
  }

  /**
   * Send webhook notification for captured lead
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
          "User-Agent": "WebRep-LeadCapture/1.0",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        logger.error("Webhook request failed", {
          status: response.status,
          statusText: response.statusText,
        });
        return false;
      }

      logger.info("Webhook notification sent successfully", {
        webhookUrl,
        leadId: payload.leadId,
      });
      return true;
    } catch (error) {
      logger.error("Error sending webhook notification", { error, webhookUrl });
      return false;
    }
  }

  /**
   * Send email notification for captured lead
   */
  static async sendEmailNotification(
    emailAddress: string,
    lead: Lead,
    websiteUrl: string
  ): Promise<boolean> {
    try {
      // In production, integrate with your email service (SendGrid, AWS SES, etc.)
      // For now, we'll just log the notification
      logger.info("Email notification would be sent", {
        to: emailAddress,
        leadId: lead.id,
        leadEmail: lead.email,
        leadName: lead.name,
      });

      // TODO: Implement actual email sending
      // Example with SendGrid:
      // const sgMail = require('@sendgrid/mail');
      // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      // await sgMail.send({
      //   to: emailAddress,
      //   from: 'noreply@webrep.com',
      //   subject: `New Lead Captured - ${lead.name}`,
      //   html: `<p>New lead from ${websiteUrl}</p>...`,
      // });

      return true;
    } catch (error) {
      logger.error("Error sending email notification", {
        error,
        emailAddress,
      });
      return false;
    }
  }

  /**
   * Export leads to CSV
   */
  static async exportLeadsToCSV(agentId: string): Promise<string> {
    try {
      const leads = await this.getAgentLeads(agentId, 1000);

      if (leads.length === 0) {
        return "";
      }

      // Create CSV header
      const headers = [
        "ID",
        "Name",
        "Email",
        "Phone",
        "Company",
        "Message",
        "Status",
        "Source",
        "Created At",
        "Updated At",
      ];

      // Create CSV rows
      const rows = leads.map((lead) => [
        lead.id,
        lead.name || "",
        lead.email || "",
        lead.phone || "",
        lead.company || "",
        lead.message || "",
        lead.status,
        lead.source,
        lead.created_at,
        lead.updated_at,
      ]);

      // Combine into CSV string
      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

      return csvContent;
    } catch (error) {
      logger.error("Error exporting leads to CSV", { error, agentId });
      return "";
    }
  }

  /**
   * Get leads by status
   */
  static async getLeadsByStatus(
    agentId: string,
    status: LeadStatus
  ): Promise<Lead[]> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("agent_id", agentId)
        .eq("status", status)
        .order("created_at", { ascending: false });

      if (error) {
        logger.error("Error fetching leads by status", {
          error,
          agentId,
          status,
        });
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error("Error in getLeadsByStatus", { error, agentId, status });
      return [];
    }
  }

  /**
   * Get lead statistics for an agent
   */
  static async getLeadStats(agentId: string): Promise<{
    total: number;
    new: number;
    contacted: number;
    qualified: number;
    converted: number;
    lost: number;
  }> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("leads")
        .select("status")
        .eq("agent_id", agentId);

      if (error) {
        logger.error("Error fetching lead stats", { error, agentId });
        return { total: 0, new: 0, contacted: 0, qualified: 0, converted: 0, lost: 0 };
      }

      const stats = {
        total: data?.length || 0,
        new: 0,
        contacted: 0,
        qualified: 0,
        converted: 0,
        lost: 0,
      };

      data?.forEach((lead) => {
        if (lead.status === "new") stats.new++;
        else if (lead.status === "contacted") stats.contacted++;
        else if (lead.status === "qualified") stats.qualified++;
        else if (lead.status === "converted") stats.converted++;
        else if (lead.status === "lost") stats.lost++;
      });

      return stats;
    } catch (error) {
      logger.error("Error in getLeadStats", { error, agentId });
      return { total: 0, new: 0, contacted: 0, qualified: 0, converted: 0, lost: 0 };
    }
  }
}

// Re-export the Lead type for convenience
export type { Lead, LeadInsert, LeadStatus };