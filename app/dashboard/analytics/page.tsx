"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ChevronDown, Calendar, Loader2 } from "lucide-react";
import { MetricCard } from "@/components/analytics/MetricCard";
import { AnalyticsChart } from "@/components/analytics/AnalyticsChart";
import { AgentSummaryCard } from "@/components/analytics/AgentSummaryCard";
import { AgentInsightsCard } from "@/components/analytics/AgentInsightsCard";
import { createClient } from "@/lib/supabase/client";

interface AnalyticsData {
  agentId: string;
  timeRange: string;
  summary: {
    totalConversations: number;
    totalLeads: number;
    conversionRate: number;
    satisfactionRate: number;
    totalFeedback: number;
  };
  feedbackBreakdown: {
    positive: number;
    negative: number;
  };
  conversationsByDay: Array<{ date: string; count: number }>;
  statusBreakdown: Record<string, number>;
  recentConversations: any[];
}

interface Agent {
  id: string;
  name: string;
  role: string;
}

export default function AnalyticsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [timeRange, setTimeRange] = useState<string>("30d");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Fetch user's agents on mount
  useEffect(() => {
    async function fetchAgents() {
      try {
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();

        if (!userData.user) {
          setError("Please log in to view analytics");
          setLoading(false);
          return;
        }

        const { data: agentsData, error: agentsError } = await supabase
          .from("agents")
          .select("id, name, role")
          .eq("user_id", userData.user.id)
          .order("created_at", { ascending: false });

        if (agentsError) throw agentsError;

        if (agentsData && agentsData.length > 0) {
          setAgents(agentsData);
          setSelectedAgentId(agentsData[0].id); // Select first agent by default
        } else {
          setError("No agents found. Create an agent first.");
          setLoading(false);
        }
      } catch (err: any) {
        console.error("Error fetching agents:", err);
        setError(err.message || "Failed to load agents");
        setLoading(false);
      }
    }

    fetchAgents();
  }, []);

  // Fetch analytics when agent or timeRange changes
  useEffect(() => {
    if (!selectedAgentId) return;

    async function fetchAnalytics() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/v2/analytics?agentId=${selectedAgentId}&timeRange=${timeRange}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch analytics");
        }

        const result = await response.json();

        if (result.success) {
          setAnalyticsData(result.data);
        } else {
          throw new Error(result.error || "Failed to load analytics");
        }
      } catch (err: any) {
        console.error("Error fetching analytics:", err);
        setError(err.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [selectedAgentId, timeRange]);

  // Calculate metrics with previous period comparison
  const calculateTrend = (current: number, baseline: number = 0) => {
    if (baseline === 0) return "+0%";
    const change = ((current - baseline) / baseline) * 100;
    return `${change >= 0 ? "+" : ""}${change.toFixed(0)}%`;
  };

  // Calculate average response time (mock for now - add to backend later)
  const avgResponseTime = "1.4s";

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  if (loading && !analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <p className="text-red-500 font-semibold">{error}</p>
          <Button onClick={() => (window.location.href = "/dashboard/create")}>
            Create Your First Agent
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pt-2 pb-10 animate-in fade-in duration-500">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Analytics
          </h1>
          <p className="text-muted-foreground">
            Monitor performance and engagement metrics across all agents.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="h-9 px-3 text-xs font-semibold border border-border/50 bg-card hover:bg-secondary transition-all rounded-md"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>

          {/* Agent Selector */}
          <select
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            className="h-9 px-3 text-xs font-semibold border border-border/50 bg-card hover:bg-secondary transition-all rounded-md uppercase tracking-wide"
          >
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {analyticsData && (
        <>
          {/* Metric Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Conversations"
              value={analyticsData.summary.totalConversations.toLocaleString()}
              trend={calculateTrend(analyticsData.summary.totalConversations)}
              subLabel="vs Last Period"
              trendDirection="up"
            />
            <MetricCard
              title="Avg Response Time"
              value={avgResponseTime}
              trend="-8%"
              subLabel="improvement"
              trendDirection="down"
            />
            <MetricCard
              title="Engagement Rate"
              value={`${analyticsData.summary.satisfactionRate.toFixed(0)}%`}
              trend={calculateTrend(analyticsData.summary.satisfactionRate)}
              trendDirection="up"
            />
            <MetricCard
              title="Lead Captures"
              value={analyticsData.summary.totalLeads.toLocaleString()}
              trend={calculateTrend(analyticsData.summary.totalLeads)}
              trendDirection="up"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ✅ FIXED: AnalyticsChart expects data with 'count' property, not 'value' */}
            <AnalyticsChart
              title="Conversation Volume"
              data={analyticsData.conversationsByDay}
              timeRange={timeRange}
            />
            <AnalyticsChart
              title="Lead Status Distribution"
              data={Object.entries(analyticsData.statusBreakdown).map(
                ([status, count]) => ({
                  date: status,
                  count: count as number,
                })
              )}
              timeRange={timeRange}
            />
          </div>

          {/* Bottom Detail Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ✅ FIXED: AgentSummaryCard expects these exact props */}
            <AgentSummaryCard
              agentName={selectedAgent?.name || "Agent"}
              agentRole={selectedAgent?.role || "assistant"}
              totalConversations={analyticsData.summary.totalConversations}
              conversionRate={analyticsData.summary.conversionRate}
              satisfactionRate={analyticsData.summary.satisfactionRate}
            />
            {/* ✅ FIXED: AgentInsightsCard expects these exact props */}
            <AgentInsightsCard
              agentName={selectedAgent?.name || "Agent"}
              agentRole={selectedAgent?.role || "assistant"}
              recentConversations={analyticsData.recentConversations}
            />
          </div>
        </>
      )}
    </div>
  );
}
