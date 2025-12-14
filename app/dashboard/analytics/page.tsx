"use client";

import { Button } from "@/components/ui/Button";
import { ChevronDown, Calendar } from "lucide-react";
import { MetricCard } from "@/components/analytics/MetricCard";
import { AnalyticsChart } from "@/components/analytics/AnalyticsChart";
import { AgentSummaryCard } from "@/components/analytics/AgentSummaryCard";
import { AgentInsightsCard } from "@/components/analytics/AgentInsightsCard";

export default function AnalyticsPage() {
    return (
        <div className="space-y-6 pt-2 pb-10">
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Analytics</h1>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="bg-slate-50 border-none text-xs font-bold text-slate-600 h-9 gap-2 shadow-sm dark:bg-slate-800 dark:text-slate-300">
                        <Calendar className="h-3.5 w-3.5" />
                        08 Nov - 20 Dec
                        <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                    <Button variant="outline" className="bg-slate-50 border-none text-xs font-bold text-slate-600 h-9 gap-2 shadow-sm uppercase tracking-wide dark:bg-slate-800 dark:text-slate-300">
                        ALL AGENTS
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
                    value="1.4 sec"
                    trend="-8%"
                    subLabel="improvement"
                    trendDirection="down" // Down is good for time, but visually we use Red for down. Wait, in reference: Red arrow down -8% improvement. So color is Red, Icon is Down.
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
                <AnalyticsChart title="Conversation Over Time" />
                <AnalyticsChart title="Traffic handled by agents over time" />
            </div>

            {/* Bottom Detail Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AgentSummaryCard />
                <AgentInsightsCard />
            </div>
        </div>
    );
}
