
import { getAgents, getAgentStats } from "@/lib/actions/agents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import {
    TrendingUp,
    TrendingDown,
    MoreHorizontal,
    Bot,
    ChevronDown
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default async function DashboardPage() {
    const stats = await getAgentStats();
    const agents = await getAgents();

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* 1. Stats Row */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Stat 1 */}
                <StatCard
                    title="Total Agents"
                    value={stats.total.toString()}
                    trend="+12%"
                    trendLabel="This Week"
                    trendUp={true}
                />

                {/* Stat 2 */}
                <StatCard
                    title="Active Agents"
                    value={stats.active.toString()}
                    trend="+15%"
                    trendLabel="This Week"
                    trendUp={true}
                />

                {/* Stat 3 */}
                <StatCard
                    title="Traffic Handled by Agents"
                    value="3210"
                    trend="-4%"
                    trendLabel="This Week"
                    trendUp={false}
                />

                {/* Stat 4 */}
                <StatCard
                    title="Average Satisfaction Rate"
                    value="95%"
                    trend="+30%"
                    trendLabel="This Week"
                    trendUp={true}
                />
            </div>

            {/* 2. Chart Section */}
            <Card className="rounded-xl border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                        Conversation Over Time
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-8 text-xs font-medium text-slate-600 dark:text-slate-300 dark:border-slate-700">
                            All Agents <ChevronDown className="ml-1 h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs font-medium text-slate-600 dark:text-slate-300 dark:border-slate-700">
                            7 Days <ChevronDown className="ml-1 h-3 w-3" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="pt-4 pb-0 pl-0 pr-0">
                    <div className="relative h-[300px] w-full bg-gradient-to-b from-slate-50/50 to-transparent dark:from-slate-800/20">
                        {/* Placeholder Chart Visualization */}
                        {/* Grid lines */}
                        <div className="absolute inset-x-6 top-0 bottom-10 flex flex-col justify-between pointer-events-none">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="w-full h-px bg-slate-100 dark:bg-slate-800 border-dashed border-t border-slate-200 dark:border-slate-800" />
                            ))}
                        </div>

                        {/* The Line & Fill (SVG Approximation) */}
                        <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 1000 300">
                            <defs>
                                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.1" />
                                    <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <path
                                d="M0,120 C100,130 200,140 300,145 C400,150 500,120 600,110 C700,100 800,120 1000,140"
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="2"
                                vectorEffect="non-scaling-stroke"
                            />
                            <path
                                d="M0,120 C100,130 200,140 300,145 C400,150 500,120 600,110 C700,100 800,120 1000,140 V300 H0 Z"
                                fill="url(#chartGradient)"
                                className="opacity-50"
                            />
                            {/* Point Annotation */}
                            <circle cx="680" cy="115" r="4" fill="white" stroke="#3b82f6" strokeWidth="2" />
                        </svg>

                        {/* Annotation Box */}
                        <div className="absolute top-[80px] left-[68%] -translate-x-1/2 bg-white dark:bg-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700 p-2 rounded-lg z-10">
                            <div className="text-[10px] text-slate-400 font-medium">8 Jun 2026</div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white">15</div>
                        </div>

                        {/* X Axis Labels */}
                        <div className="absolute bottom-4 left-6 right-6 flex justify-between text-xs text-slate-400 font-medium">
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

            {/* 3. Bottom Section: Agents Table & CTA */}
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Recent Agents Table (2/3 width) */}
                <div className="lg:col-span-2">
                    <Card className="h-full rounded-xl border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                        <CardHeader>
                            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                                Recent Agents
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="w-full text-left text-sm">
                                {/* Header */}
                                <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate-50 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <div className="col-span-4">Name</div>
                                    <div className="col-span-2">Type</div>
                                    <div className="col-span-2">Status</div>
                                    <div className="col-span-2">Last Active</div>
                                    <div className="col-span-2 text-right"></div>
                                </div>

                                {/* Row 1 */}
                                {agents.length === 0 ? (
                                    <div className="px-6 py-8 text-center text-slate-500 text-sm">
                                        No agents created yet.
                                    </div>
                                ) : (
                                    agents.slice(0, 5).map((agent: any) => (
                                        <AgentRow
                                            key={agent.id}
                                            name={agent.name}
                                            type={agent.role}
                                            status={agent.status === "active" ? "Running" : "Paused"}
                                            lastActive="Just now"
                                        />
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* CTA Card (1/3 width) */}
                <div className="lg:col-span-1">
                    <Card className="h-full rounded-xl border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 flex flex-col justify-center">
                        <CardContent className="p-8 flex flex-col items-start space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-300/50 dark:shadow-none">
                                    <Bot className="h-8 w-8 text-blue-400" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                                    You Haven't Created Any<br /> Agent Yet?
                                </h3>
                            </div>

                            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                Get Started by Creating Your First Webrep AI Agent
                            </p>

                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-11 rounded-lg shadow-lg shadow-blue-200 dark:shadow-none transition-all">
                                Create Your First Agent
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

function StatCard({ title, value, trend, trendLabel, trendUp }: {
    title: string,
    value: string,
    trend: string,
    trendLabel: string,
    trendUp: boolean
}) {
    return (
        <Card className="rounded-xl border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 p-6 flex flex-col justify-between h-[160px] hover:shadow-md transition-shadow">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{title}</h3>
            <div className="space-y-4">
                <div className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</div>
                <div className="flex items-center gap-2 text-sm font-medium">
                    <span className={cn("flex items-center", trendUp ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                        {trendUp ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                        {trend}
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 text-xs">{trendLabel}</span>
                </div>
            </div>
        </Card>
    )
}

function AgentRow({ name, type, status, lastActive }: { name: string, type: string, status: "Running" | "Paused", lastActive: string }) {
    const isRunning = status === "Running";
    return (
        <div className="grid grid-cols-12 gap-4 px-6 py-5 border-b border-slate-50 dark:border-slate-800 items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <div className="col-span-4 font-medium text-slate-900 dark:text-slate-200">{name}</div>
            <div className="col-span-2 text-slate-500 dark:text-slate-400">{type}</div>
            <div className="col-span-2">
                <span className={cn("text-xs font-semibold px-2 py-1 rounded-full",
                    isRunning ? "text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400" : "text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400")}>
                    {status}
                </span>
            </div>
            <div className="col-span-2 text-slate-500 dark:text-slate-400">{lastActive}</div>
            <div className="col-span-2 text-right">
                <Link href="#" className="text-sm font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400">
                    View Agent
                </Link>
            </div>
        </div>
    )
}
