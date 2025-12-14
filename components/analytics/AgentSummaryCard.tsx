"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { TrendingUp } from "lucide-react";

export function AgentSummaryCard() {
    return (
        <Card className="rounded-xl border border-slate-100 shadow-sm bg-white p-6 h-full flex flex-col justify-between dark:bg-slate-900 dark:border-slate-800">
            <CardContent className="p-0 space-y-6">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">Support Assistent</h3>
                    <p className="text-xs text-slate-500">AI Assistant trainer from your website content</p>
                </div>

                <div className="grid grid-cols-2 gap-8">
                    <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-200 mb-2">Total Conversations</div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-slate-900 dark:text-white">1.2k</span>
                            <span className="text-xs font-medium text-green-600 dark:text-green-400">Convert /</span>
                        </div>
                    </div>
                    <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-200 mb-2">Avg Rating: 4.8</div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-slate-900 dark:text-white">8%</span>
                            <span className="text-xs font-bold text-green-600 flex items-center dark:text-green-400">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                Improvement
                            </span>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-50 dark:border-slate-800">
                    <div className="text-xs font-medium text-slate-500">Traffic Handled By Agents</div>
                </div>
            </CardContent>
        </Card>
    );
}
