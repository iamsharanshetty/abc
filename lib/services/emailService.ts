// lib/services/emailService.ts
import { logger } from "@/lib/utils/logger";
import { LeadData } from "./aiAgent";

interface EmailConfig {
  provider: "resend" | "smtp";
  apiKey?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  fromEmail: string;
  fromName: string;
}

/**
 * Email service for sending lead notifications
 */
export class EmailService {
  private config: EmailConfig;

  constructor() {
    // Determine which email provider to use
    if (process.env.RESEND_API_KEY) {
      this.config = {
        provider: "resend",
        apiKey: process.env.RESEND_API_KEY,
        fromEmail: process.env.FROM_EMAIL || "notifications@webrep.app",
        fromName: process.env.FROM_NAME || "WebRep Notifications",
      };
    } else if (process.env.SMTP_HOST) {
      this.config = {
        provider: "smtp",
        smtpHost: process.env.SMTP_HOST,
        smtpPort: parseInt(process.env.SMTP_PORT || "587"),
        smtpUser: process.env.SMTP_USER,
        smtpPass: process.env.SMTP_PASS,
        fromEmail: process.env.FROM_EMAIL || process.env.SMTP_USER || "",
        fromName: process.env.FROM_NAME || "WebRep Notifications",
      };
    } else {
      throw new Error(
        "No email service configured. Set RESEND_API_KEY or SMTP credentials."
      );
    }
  }

  /**
   * Send lead notification email using Resend
   */
  private async sendWithResend(
    to: string,
    subject: string,
    html: string
  ): Promise<boolean> {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          from: `${this.config.fromName} <${this.config.fromEmail}>`,
          to: [to],
          subject,
          html,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        logger.error("Resend API error", { error, status: response.status });
        return false;
      }

      const data = await response.json();
      logger.info("Email sent via Resend", { emailId: data.id, to });
      return true;
    } catch (error) {
      logger.error("Error sending email via Resend", { error });
      return false;
    }
  }

  /**
   * Send lead notification email using SMTP
   */
  private async sendWithSMTP(
    to: string,
    subject: string,
    html: string
  ): Promise<boolean> {
    try {
      // Dynamic import to avoid bundling nodemailer if not used
      const nodemailer = await import("nodemailer");

      const transporter = nodemailer.createTransport({
        host: this.config.smtpHost,
        port: this.config.smtpPort,
        secure: this.config.smtpPort === 465,
        auth: {
          user: this.config.smtpUser,
          pass: this.config.smtpPass,
        },
      });

      const info = await transporter.sendMail({
        from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
        to,
        subject,
        html,
      });

      logger.info("Email sent via SMTP", { messageId: info.messageId, to });
      return true;
    } catch (error) {
      logger.error("Error sending email via SMTP", { error });
      return false;
    }
  }

  /**
   * Generate lead notification email HTML
   */
  private generateLeadEmailHTML(
    leadData: LeadData,
    agentName: string,
    agentRole: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Lead Captured</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .lead-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .info-row { padding: 10px 0; border-bottom: 1px solid #eee; }
            .info-label { font-weight: bold; color: #667eea; display: inline-block; width: 120px; }
            .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 New Lead Captured!</h1>
              <p>A new lead has shown interest through your AI agent</p>
            </div>
            
            <div class="content">
              <p><strong>Agent:</strong> ${agentName} (${agentRole})</p>
              
              <div class="lead-info">
                <h2>Lead Information</h2>
                ${
                  leadData.name
                    ? `<div class="info-row"><span class="info-label">Name:</span> ${leadData.name}</div>`
                    : ""
                }
                ${
                  leadData.email
                    ? `<div class="info-row"><span class="info-label">Email:</span> <a href="mailto:${leadData.email}">${leadData.email}</a></div>`
                    : ""
                }
                ${
                  leadData.phone
                    ? `<div class="info-row"><span class="info-label">Phone:</span> <a href="tel:${leadData.phone}">${leadData.phone}</a></div>`
                    : ""
                }
                ${
                  leadData.company
                    ? `<div class="info-row"><span class="info-label">Company:</span> ${leadData.company}</div>`
                    : ""
                }
                ${
                  leadData.interest
                    ? `<div class="info-row"><span class="info-label">Interest:</span> ${leadData.interest}</div>`
                    : ""
                }
                <div class="info-row">
                  <span class="info-label">Captured:</span> ${new Date(
                    leadData.capturedAt
                  ).toLocaleString()}
                </div>
                <div class="info-row">
                  <span class="info-label">Conversation:</span> ${
                    leadData.conversationId
                  }
                </div>
              </div>
              
              <p style="margin-top: 30px;">
                <strong>Next Steps:</strong><br>
                Follow up with this lead promptly to increase your chances of conversion. 
                The faster you respond, the more likely they are to engage with your business.
              </p>
              
              <div style="text-align: center;">
                <a href="${
                  process.env.NEXT_PUBLIC_APP_URL || "https://webrep.app"
                }/dashboard/analytics?conversationId=${
      leadData.conversationId
    }" class="cta-button">
                  View Full Conversation
                </a>
              </div>
            </div>
            
            <div class="footer">
              <p>This is an automated notification from WebRep AI Agent System</p>
              <p>To manage your notification settings, visit your dashboard</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Send lead notification email
   */
  async sendLeadNotification(
    leadData: LeadData,
    agentName: string,
    agentRole: string,
    recipientEmail?: string
  ): Promise<boolean> {
    try {
      const to = recipientEmail || process.env.LEAD_NOTIFICATION_EMAIL || "";

      if (!to) {
        logger.warn("No recipient email configured for lead notifications");
        return false;
      }

      const subject = `🎯 New Lead: ${
        leadData.name || leadData.email || "Unknown"
      } - ${agentName}`;
      const html = this.generateLeadEmailHTML(leadData, agentName, agentRole);

      logger.info("Sending lead notification email", {
        to,
        leadEmail: leadData.email,
        agentName,
      });

      // Send based on configured provider
      if (this.config.provider === "resend") {
        return await this.sendWithResend(to, subject, html);
      } else {
        return await this.sendWithSMTP(to, subject, html);
      }
    } catch (error) {
      logger.error("Error sending lead notification", { error });
      return false;
    }
  }

  /**
   * Send test email to verify configuration
   */
  async sendTestEmail(recipientEmail: string): Promise<boolean> {
    try {
      const subject = "Test Email from WebRep";
      const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>✅ Email Configuration Test</h1>
          <p>If you're reading this, your email service is configured correctly!</p>
          <p>Provider: ${this.config.provider}</p>
          <p>From: ${this.config.fromEmail}</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
        </div>
      `;

      if (this.config.provider === "resend") {
        return await this.sendWithResend(recipientEmail, subject, html);
      } else {
        return await this.sendWithSMTP(recipientEmail, subject, html);
      }
    } catch (error) {
      logger.error("Error sending test email", { error });
      return false;
    }
  }
}
