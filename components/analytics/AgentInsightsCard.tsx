"use client";

import { Card, CardContent } from "@/components/ui/Card";

export function AgentInsightsCard() {
    // For now, these are static "simulated" insights as we don't have detailed Q&A analytics yet.
    // In a real app, this would come from an NLP clustering service.
    const insights = [
        { topic: "What is your pricing?", count: 240, percentage: 85 },
        { topic: "Do you offer support?", count: 180, percentage: 65 },
        { topic: "How can I contact sales?", count: 120, percentage: 45 },
    ];

    return (
        <Card className="rounded-xl border border-slate-100 shadow-sm bg-white p-6 h-full dark:bg-slate-900 dark:border-slate-800">
            <CardContent className="p-0 space-y-6">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                        Topic Insights
                    </h3>
                    <p className="text-xs text-slate-500">
                        Top recurring user questions identified by AI
                    </p>
                </div>

                <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-4">
                        Common Queries
                    </h4>
                    <div className="space-y-4">
                        {insights.map((item, index) => (
                            <div key={index} className="flex items-center gap-4">
                                <div className="flex-1 text-xs font-bold text-blue-900 dark:text-blue-300 min-w-[140px] truncate" title={item.topic}>
                                    {item.topic}
                                </div>
                                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                                        style={{ width: `${item.percentage}%` }}
                                    />
                                </div>
                                <div className="text-xs font-bold text-slate-500 w-10 text-right">
                                    ({item.count})
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
