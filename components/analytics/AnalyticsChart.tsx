"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";

interface ChartData {
    date: string;
    value: number;
}

interface AnalyticsChartProps {
    title: string;
    data?: ChartData[];
    color?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border border-border bg-popover px-3 py-1.5 text-sm shadow-md">
                <p className="font-semibold text-foreground">{label}</p>
                <div className="flex items-center gap-2">
                    <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: payload[0].color }}
                    />
                    <span className="font-medium text-muted-foreground">
                        {payload[0].value}
                    </span>
                </div>
            </div>
        );
    }
    return null;
};

export function AnalyticsChart({ title, data = [], color = "#3b82f6" }: AnalyticsChartProps) {
    // Fallback data if none provided
    const chartData = data.length > 0 ? data : [
        { date: "Mon", value: 12 },
        { date: "Tue", value: 18 },
        { date: "Wed", value: 15 },
        { date: "Thu", value: 25 },
        { date: "Fri", value: 20 },
        { date: "Sat", value: 30 },
        { date: "Sun", value: 28 },
    ];

    return (
        <Card className="rounded-xl border border-slate-100 shadow-sm bg-white overflow-hidden dark:bg-slate-900 dark:border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 pb-0 pl-0 pr-0">
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={chartData}
                            margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 10, fill: '#888888' }}
                                dy={10}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={color}
                                strokeWidth={2}
                                fill={`url(#gradient-${title})`}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
