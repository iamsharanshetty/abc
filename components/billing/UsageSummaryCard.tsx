"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import Link from "next/link";

interface UsageStats {
    agentsCount: number;
    conversationsCount: number;
    planLimit: { agents: number; conversations: number };
    isPro: boolean;
}

export function UsageSummaryCard({ usage }: { usage: UsageStats | null }) {
    if (!usage) {
        // Skeleton state
        return (
            <Card className="rounded-xl border border-slate-100 shadow-sm bg-white h-full dark:bg-slate-900 dark:border-slate-800">
                <CardContent className="p-6 space-y-6">
                    <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
                    <div className="space-y-2">
                        <div className="flex justify-between"><div className="h-3 w-20 bg-slate-100 rounded" /><div className="h-3 w-10 bg-slate-100 rounded" /></div>
                        <div className="h-2 w-full bg-slate-100 rounded" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    const { agentsCount, conversationsCount, planLimit, isPro } = usage;

    // Calculate Percentages
    const agentsPercent = isPro ? 10 : Math.min(100, (agentsCount / planLimit.agents) * 100);
    const conversationsPercent = isPro ? 5 : Math.min(100, (conversationsCount / planLimit.conversations) * 100);

    return (
        <Card className="rounded-xl border border-slate-100 shadow-sm bg-white h-full dark:bg-slate-900 dark:border-slate-800">
            <CardContent className="p-6">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-6">Usage Summary</h3>

                <div className="space-y-6">
                    {/* Agents Used */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-900 dark:text-slate-200">Agents Used</span>
                            <span className="text-slate-500 dark:text-slate-400">
                                {agentsCount} / {isPro ? '∞' : planLimit.agents}
                            </span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                                style={{ width: `${agentsPercent}%` }}
                            />
                        </div>
                    </div>

                    {/* Conversations */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-900 dark:text-slate-200">Total Events</span>
                            <span className="text-slate-500 dark:text-slate-400">
                                {conversationsCount} / {isPro ? '∞' : planLimit.conversations}
                            </span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                                style={{ width: `${conversationsPercent}%` }}
                            />
                        </div>
                    </div>

                    {!isPro && (
                        <div className="flex justify-end pt-2">
                            <Link href="/pricing">
                                <Button className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-9 px-6 rounded-lg transition-colors dark:bg-slate-700 dark:hover:bg-slate-600">
                                    Upgrade to Pro
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
