// lib/services/analyticsService.ts
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/utils/logger";

export interface ChatAnalytics {
  agentId: string;
  totalConversations: number;
  totalMessages: number;
  averageResponseTime: number;
  satisfactionScore: number;
  topQuestions: { question: string; count: number }[];
  leadConversionRate: number;
  periodStart: string;
  periodEnd: string;
}

export interface FeedbackData {
  chatLogId: string;
  feedback: "helpful" | "unhelpful";
  comment?: string;
  userId?: string;
}

export class AnalyticsService {
  /**
   * Record user feedback on AI response
   */
  static async recordFeedback(feedbackData: FeedbackData): Promise<boolean> {
    try {
      const supabase = await createClient();

      const { error } = await supabase
        .from("chat_logs")
        .update({
          user_feedback: feedbackData.feedback,
          metadata: {
            feedback_comment: feedbackData.comment,
            feedback_timestamp: new Date().toISOString(),
          },
        })
        .eq("id", feedbackData.chatLogId);

      if (error) {
        throw new Error(`Failed to record feedback: ${error.message}`);
      }

      logger.info("Feedback recorded", {
        chatLogId: feedbackData.chatLogId,
        feedback: feedbackData.feedback,
      });

      return true;
    } catch (error) {
      logger.error("Error recording feedback", { error, feedbackData });
      return false;
    }
  }

  /**
   * Get analytics for an agent
   */
  static async getAgentAnalytics(
    agentId: string,
    periodDays: number = 30
  ): Promise<ChatAnalytics> {
    try {
      const supabase = await createClient();

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);

      // Get all chat logs for the period
      const { data: logs, error } = await supabase
        .from("chat_logs")
        .select("*")
        .eq("agent_id", agentId)
        .gte("timestamp", startDate.toISOString());

      if (error) {
        throw new Error(`Failed to fetch analytics: ${error.message}`);
      }

      // Calculate metrics
      const totalMessages = logs?.length || 0;
      const sessionsSet = new Set(
        logs?.map((log) => log.session_id).filter(Boolean)
      );
      const totalConversations = sessionsSet.size;

      // Calculate satisfaction score
      const feedbackLogs = logs?.filter((log) => log.user_feedback) || [];
      const helpfulCount = feedbackLogs.filter(
        (log) => log.user_feedback === "helpful"
      ).length;
      const satisfactionScore =
        feedbackLogs.length > 0
          ? (helpfulCount / feedbackLogs.length) * 100
          : 0;

      // Find top questions (simple frequency analysis)
      const questionFrequency = new Map<string, number>();
      logs?.forEach((log) => {
        const question = log.user_message.toLowerCase().trim();
        if (question.length > 10) {
          // Filter out very short messages
          const firstWords = question.split(" ").slice(0, 5).join(" ");
          questionFrequency.set(
            firstWords,
            (questionFrequency.get(firstWords) || 0) + 1
          );
        }
      });

      const topQuestions = Array.from(questionFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([question, count]) => ({ question, count }));

      // Calculate lead conversion rate
      const { data: leads } = await supabase
        .from("leads")
        .select("status")
        .eq("agent_id", agentId)
        .gte("created_at", startDate.toISOString());

      const totalLeads = leads?.length || 0;
      const convertedLeads =
        leads?.filter((l) => l.status === "converted").length || 0;
      const leadConversionRate =
        totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

      return {
        agentId,
        totalConversations,
        totalMessages,
        averageResponseTime: 1.5, // TODO: Calculate actual response time
        satisfactionScore: Math.round(satisfactionScore * 10) / 10,
        topQuestions,
        leadConversionRate: Math.round(leadConversionRate * 10) / 10,
        periodStart: startDate.toISOString(),
        periodEnd: new Date().toISOString(),
      };
    } catch (error) {
      logger.error("Error getting agent analytics", { error, agentId });
      throw error;
    }
  }

  /**
   * Get conversation history for a session
   */
  static async getConversationHistory(sessionId: string): Promise<any[]> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("chat_logs")
        .select("*")
        .eq("session_id", sessionId)
        .order("timestamp", { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch conversation: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      logger.error("Error getting conversation history", { error, sessionId });
      return [];
    }
  }

  /**
   * Export analytics data
   */
  static async exportAnalyticsData(
    agentId: string,
    startDate: string,
    endDate: string
  ): Promise<any[]> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("chat_logs")
        .select("*")
        .eq("agent_id", agentId)
        .gte("timestamp", startDate)
        .lte("timestamp", endDate)
        .order("timestamp", { ascending: true });

      if (error) {
        throw new Error(`Failed to export data: ${error.message}`);
      }

      logger.info("Analytics data exported", {
        agentId,
        records: data?.length || 0,
      });

      return data || [];
    } catch (error) {
      logger.error("Error exporting analytics data", { error, agentId });
      return [];
    }
  }

  /**
   * Get unhelpful responses for improvement
   */
  static async getUnhelpfulResponses(
    agentId: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("chat_logs")
        .select("*")
        .eq("agent_id", agentId)
        .eq("user_feedback", "unhelpful")
        .order("timestamp", { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(
          `Failed to fetch unhelpful responses: ${error.message}`
        );
      }

      return data || [];
    } catch (error) {
      logger.error("Error getting unhelpful responses", { error, agentId });
      return [];
    }
  }

  /**
   * Track agent performance metrics
   */
  static async trackPerformanceMetric(
    agentId: string,
    metric: {
      type: "response_time" | "error_rate" | "token_usage" | "api_calls";
      value: number;
      timestamp?: string;
    }
  ): Promise<void> {
    try {
      logger.info("Performance metric tracked", {
        agentId,
        metric,
      });

      // In production, send to analytics platform like Mixpanel, Amplitude, etc.
      // For now, just log
    } catch (error) {
      logger.error("Error tracking performance metric", {
        error,
        agentId,
        metric,
      });
    }
  }

  /**
   * Generate daily report
   */
  static async generateDailyReport(agentId: string): Promise<{
    date: string;
    conversations: number;
    messages: number;
    leads: number;
    satisfaction: number;
    topIssues: string[];
  }> {
    try {
      const analytics = await this.getAgentAnalytics(agentId, 1);
      const unhelpfulResponses = await this.getUnhelpfulResponses(agentId, 10);

      const topIssues = unhelpfulResponses
        .map((r) => r.user_message)
        .slice(0, 5);

      return {
        date: new Date().toISOString().split("T")[0],
        conversations: analytics.totalConversations,
        messages: analytics.totalMessages,
        leads: 0, // TODO: Add lead count for today
        satisfaction: analytics.satisfactionScore,
        topIssues,
      };
    } catch (error) {
      logger.error("Error generating daily report", { error, agentId });
      throw error;
    }
  }
}
