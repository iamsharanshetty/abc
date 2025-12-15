"use client";

import { Card, CardContent } from "@/components/ui/Card";

export function AgentInsightsCard() {
    const insights = [
        { question: "What is your pricing?", count: 240, percentage: 85 },
        { question: "Do you offer support?", count: 180, percentage: 65 },
        { question: "How can i contact sales?", count: 120, percentage: 45 },
    ];

    return (
        <Card className="rounded-xl border border-slate-100 shadow-sm bg-white p-6 h-full dark:bg-slate-900 dark:border-slate-800">
            <CardContent className="p-0 space-y-6">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                        Support Assistent
                    </h3>
                    <p className="text-xs text-slate-500">
                        AI Assistant trainer from your website content
                    </p>
                </div>

                <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-4">
                        Top Agent Breakdown
                    </h4>
                    <div className="space-y-4">
                        {insights.map((item, index) => (
                            <div key={index} className="flex items-center gap-4">
                                <div className="flex-1 text-xs font-bold text-blue-900 dark:text-blue-300 min-w-[140px]">
                                    {item.question}
                                </div>
                                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-600 rounded-full"
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
