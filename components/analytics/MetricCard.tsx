"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
    title: string;
    value: string;
    trend: string;
    subLabel?: string;
    trendDirection: "up" | "down";
}

export function MetricCard({
    title,
    value,
    trend,
    subLabel,
    trendDirection,
}: MetricCardProps) {
    const isPositive = trendDirection === "up";

    return (
        <Card className="rounded-xl border border-slate-100 shadow-sm bg-white p-6 dark:bg-slate-900 dark:border-slate-800">
            <CardContent className="p-0">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">{title}</h3>
                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-4">{value}</div>
                <div className="flex items-center gap-2 text-xs font-bold">
                    <span
                        className={cn(
                            "flex items-center gap-1",
                            isPositive ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"
                        )}
                    >
                        {isPositive ? (
                            <TrendingUp className="h-3 w-3" />
                        ) : (
                            <TrendingDown className="h-3 w-3" />
                        )}
                        {trend}
                    </span>
                    {subLabel && <span className="text-slate-400 font-medium">{subLabel}</span>}
                </div>
            </CardContent>
        </Card>
    );
}
