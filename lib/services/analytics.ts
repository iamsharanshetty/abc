// lib/services/analytics.ts
import { createClient } from "../supabase/server";
import { createServiceClient } from "../supabase/service";
import { Database } from "../database.types";
import { logger } from "@/lib/utils/logger";

type AnalyticsEvent =
  Database["public"]["Tables"]["analytics_events"]["Insert"];

export class AnalyticsService {
  /**
   * Log a new analytics event
   * @param eventType - Type of event (e.g., "agent_created", "chat_message")
   * @param data - Event data
   * @param useServiceClient - Set to true for background jobs (no cookie context)
   */
  static async logEvent(
    eventType: string,
    data: {
      sessionId?: string;
      userId?: string;
      agentId?: string;
      websiteUrl?: string;
      metadata?: Record<string, any>;
    },
    useServiceClient = false
  ) {
    try {
      // Use service client for background jobs (like Trigger.dev tasks)
      // Use regular client for API routes and server components
      const supabase = useServiceClient
        ? createServiceClient()
        : await createClient();

      // Sanitize metadata to ensure no PII is accidentally logged without consent
      const sanitizedMetadata = data.metadata ? { ...data.metadata } : null;

      const event: AnalyticsEvent = {
        event_type: eventType,
        session_id: data.sessionId,
        user_id: data.userId,
        agent_id: data.agentId,
        website_url: data.websiteUrl,
        metadata: sanitizedMetadata,
      };

      const { error } = await supabase.from("analytics_events").insert(event);

      if (error) {
        logger.error("Failed to log analytics event", { error, event });
      } else {
        logger.debug("Logged analytics event", { eventType });
      }
    } catch (error) {
      // Don't throw - analytics failures shouldn't break the main flow
      logger.error("Error in AnalyticsService", { error });
    }
  }

  /**
   * Get analytics for a specific agent
   */
  static async getAgentAnalytics(
    agentId: string,
    days = 30,
    useServiceClient = false
  ) {
    try {
      const supabase = useServiceClient
        ? createServiceClient()
        : await createClient();

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from("analytics_events")
        .select("*")
        .eq("agent_id", agentId)
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false });

      if (error) {
        logger.error("Error fetching agent analytics", { agentId, error });
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error("Error in getAgentAnalytics", { agentId, error });
      return [];
    }
  }

  /**
   * Get analytics summary
   */
  static async getAnalyticsSummary(userId?: string, useServiceClient = false) {
    try {
      const supabase = useServiceClient
        ? createServiceClient()
        : await createClient();

      let query = supabase
        .from("analytics_events")
        .select("event_type, created_at, metadata");

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query
        .gte(
          "created_at",
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        )
        .order("created_at", { ascending: false });

      if (error) {
        logger.error("Error fetching analytics summary", { error });
        return {};
      }

      // Group by event type
      const summary = (data || []).reduce((acc, event) => {
        const type = event.event_type;
        if (!acc[type]) {
          acc[type] = { count: 0, events: [] };
        }
        acc[type].count++;
        acc[type].events.push(event);
        return acc;
      }, {} as Record<string, { count: number; events: any[] }>);

      return summary;
    } catch (error) {
      logger.error("Error in getAnalyticsSummary", { error });
      return {};
    }
  }
}
