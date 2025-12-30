"use client";

import { Button } from "@/components/ui/Button";
import { ChevronDown, Calendar, BarChart3 } from "lucide-react";
import { MetricCard } from "@/components/analytics/MetricCard";
import { AnalyticsChart } from "@/components/analytics/AnalyticsChart";
import { AgentSummaryCard } from "@/components/analytics/AgentSummaryCard";
import { AgentInsightsCard } from "@/components/analytics/AgentInsightsCard";

export default function AnalyticsPage() {
    return (
        <div className="space-y-8 pt-2 pb-10 animate-in fade-in duration-500">
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Analytics</h1>
                    <p className="text-muted-foreground">Monitor performance and engagement metrics across all agents.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="h-9 gap-2 text-xs font-semibold border-border/50 bg-card hover:bg-secondary transition-all">
                        <Calendar className="h-3.5 w-3.5 opacity-70" />
                        Last 30 Days
                        <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                    <Button variant="outline" className="h-9 gap-2 text-xs font-semibold border-border/50 bg-card hover:bg-secondary transition-all uppercase tracking-wide">
                        All Agents
                        <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                </div>
            </div>

            {/* Metric Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Conversations"
                    value="12,480"
                    trend="+12%"
                    subLabel="vs Last Period"
                    trendDirection="up"
                />
                <MetricCard
                    title="Avg Response Time"
                    value="1.4s"
                    trend="-8%"
                    subLabel="improvement"
                    trendDirection="down" // Down is good for time
                />
                <MetricCard
                    title="Engagement Rate"
                    value="68%"
                    trend="+3%"
                    trendDirection="up"
                />
                <MetricCard
                    title="Lead Captures"
                    value="320"
                    trend="+5%"
                    trendDirection="up"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AnalyticsChart title="Conversation Volume" />
                <AnalyticsChart title="Traffic Distribution" />
            </div>

            {/* Bottom Detail Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AgentSummaryCard />
                <AgentInsightsCard />
            </div>
        </div>
    );
}
