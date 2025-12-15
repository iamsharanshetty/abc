"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ChevronDown } from "lucide-react";

interface AnalyticsChartProps {
    title: string;
}

export function AnalyticsChart({ title }: AnalyticsChartProps) {
    return (
        <Card className="rounded-xl border border-slate-100 shadow-sm bg-white overflow-hidden dark:bg-slate-900 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {title}
                </CardTitle>
                {/* Only show 7 Days dropdown on charts based on design */}
                {title === "Conversation Over Time" && (
                    <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold text-slate-500 bg-slate-50 border-none dark:bg-slate-800 dark:text-slate-400">
                        7 Days <ChevronDown className="ml-1 h-3 w-3" />
                    </Button>
                )}
            </CardHeader>
            <CardContent className="pt-4 pb-0 pl-0 pr-0">
                <div className="relative h-[200px] w-full">
                    {/* Grid Lines (Vertical) - implied by visual, using simplified grid */}

                    {/* SVG Chart */}
                    <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                        <defs>
                            <linearGradient id="chartGradientBlue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                            </linearGradient>
                        </defs>

                        {/* Area Fill */}
                        <path
                            d="M0,40 Q25,60 50,30 T100,60 V100 H0 Z"
                            fill="url(#chartGradientBlue)"
                        />

                        {/* Stroke Line */}
                        <path
                            d="M0,40 Q25,60 50,30 T100,60"
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="1.5"
                            vectorEffect="non-scaling-stroke"
                        />
                    </svg>

                    {/* X-Axis Labels */}
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between text-[10px] text-slate-400 font-medium">
                        <span>Jan</span>
                        <span>Feb</span>
                        <span>Mar</span>
                        <span>Apr</span>
                        <span>May</span>
                        <span>Jun</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
