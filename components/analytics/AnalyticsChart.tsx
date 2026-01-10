"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
<<<<<<< HEAD
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
=======
import { useMemo } from "react";

interface AnalyticsChartProps {
  title: string;
  data: Array<{ date: string; count: number }>;
  timeRange: string;
}

export function AnalyticsChart({
  title,
  data,
  timeRange,
}: AnalyticsChartProps) {
  // Generate SVG path from data
  const { path, maxValue, labels } = useMemo(() => {
    if (!data || data.length === 0) {
      return { path: "M0,50 L100,50", maxValue: 100, labels: [] };
    }

    const maxValue = Math.max(...data.map((d) => d.count), 1);
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - (item.count / maxValue) * 80; // Use 80% of height for data
      return { x, y };
    });

    // Create smooth curve path
    const path = points.reduce((acc, point, index) => {
      if (index === 0) {
        return `M${point.x},${point.y}`;
      }
      const prevPoint = points[index - 1];
      const controlX = (prevPoint.x + point.x) / 2;
      return `${acc} Q${controlX},${prevPoint.y} ${point.x},${point.y}`;
    }, "");

    // Generate labels based on data
    const labelIndices = [
      0,
      Math.floor(data.length / 4),
      Math.floor(data.length / 2),
      Math.floor((3 * data.length) / 4),
      data.length - 1,
    ];
    const labels = labelIndices.map((i) => {
      if (i >= data.length) return "";
      const date = new Date(data[i].date);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    });

    return { path, maxValue, labels };
  }, [data]);

  return (
    <Card className="rounded-xl border border-slate-100 shadow-sm bg-white overflow-hidden dark:bg-slate-900 dark:border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
          {title}
        </CardTitle>
        <div className="text-xs text-slate-500 font-semibold">
          {timeRange === "7d" && "Last 7 Days"}
          {timeRange === "30d" && "Last 30 Days"}
          {timeRange === "90d" && "Last 90 Days"}
        </div>
      </CardHeader>
      <CardContent className="pt-4 pb-0 pl-0 pr-0">
        <div className="relative h-[200px] w-full">
          {data && data.length > 0 ? (
            <>
              {/* SVG Chart */}
              <svg
                className="absolute inset-0 h-full w-full px-4"
                preserveAspectRatio="none"
                viewBox="0 0 100 100"
              >
                <defs>
                  <linearGradient
                    id={`chartGradient-${title}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Area Fill */}
                <path
                  d={`${path} V100 H0 Z`}
                  fill={`url(#chartGradient-${title})`}
                />

                {/* Stroke Line */}
                <path
                  d={path}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>

              {/* X-Axis Labels */}
              <div className="absolute bottom-4 left-4 right-4 flex justify-between text-[10px] text-slate-400 font-medium">
                {labels.map((label, index) => (
                  <span key={index}>{label}</span>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              No data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
>>>>>>> chat-backup
}
