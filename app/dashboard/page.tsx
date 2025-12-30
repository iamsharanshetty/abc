
import { getAgents, getAgentStats } from "@/lib/actions/agents";
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import {
    TrendingUp,
    TrendingDown,
    MoreHorizontal,
    Bot,
    ChevronDown,
    ArrowRight,
    Search,
    Plus,
    Activity
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default async function DashboardPage() {
    const stats = await getAgentStats();
    const agents = await getAgents();
    const hasAgents = agents.length > 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Overview</h1>
                    <p className="text-muted-foreground mt-1">Welcome back. Here's what's happening today.</p>
                </div>
                <Link href="/dashboard/create">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
                        <Plus className="w-4 h-4 mr-2" />
                        New Agent
                    </Button>
                </Link>
            </div>

            {/* 1. Bento Grid Stats */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Agents"
                    value={stats.total.toString()}
                    description="Deployed across sites"
                    icon={<Bot className="w-5 h-5 text-blue-500" />}
                />
                <StatCard
                    title="Active Conversations"
                    value={stats.active.toString()} // Using 'active' as a placeholder for conversations for now
                    description="In the last 24 hours"
                    icon={<Activity className="w-5 h-5 text-emerald-500" />}
                    trend="+12%"
                    trendUp={true}
                />
                <StatCard
                    title="Messages Processed"
                    value="12.5k"
                    description="Total tokens used"
                    icon={<MoreHorizontal className="w-5 h-5 text-purple-500" />}
                    trend="+5%"
                    trendUp={true}
                />
                <StatCard
                    title="Avg. Response Time"
                    value="1.2s"
                    description="Global latency"
                    icon={<ZapIcon className="w-5 h-5 text-amber-500" />}
                />
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* 2. Main Chart Section */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="rounded-3xl border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-border/50 flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-foreground">Traffic Overview</h3>
                                <p className="text-sm text-muted-foreground">Visitor engagement over time</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="h-8 text-xs">This Week</Button>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="relative h-[300px] w-full flex items-end justify-between gap-2 px-2">
                                {/* Simulated Bar Chart */}
                                {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                                    <div key={i} className="w-full bg-secondary/30 rounded-t-lg relative group h-full flex items-end">
                                        <div
                                            className="w-full bg-blue-500/80 hover:bg-blue-500 transition-all duration-500 rounded-t-md mx-1"
                                            style={{ height: `${h}%` }}
                                        />
                                        <div className="absolute -bottom-6 left-0 right-0 text-center text-xs text-muted-foreground font-medium">
                                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* Agent List */}
                    <Card className="rounded-3xl border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-border/50 flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-foreground">Deployed Agents</h3>
                                <p className="text-sm text-muted-foreground">Manage your active AI representatives</p>
                            </div>
                        </div>
                        <div className="p-0">
                            {!hasAgents ? (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Bot className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-medium text-foreground mb-2">No agents yet</h3>
                                    <p className="text-muted-foreground mb-6">Create your first agent to start engaging visitors.</p>
                                    <Link href="/dashboard/create">
                                        <Button>Create Agent</Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="divide-y divide-border/50">
                                    <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-secondary/10">
                                        <div className="col-span-5">Name</div>
                                        <div className="col-span-3">Status</div>
                                        <div className="col-span-2">Role</div>
                                        <div className="col-span-2 text-right">Actions</div>
                                    </div>
                                    {agents.map((agent: any) => (
                                        <div key={agent.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-secondary/20 transition-colors group">
                                            <div className="col-span-5 font-medium text-foreground flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                                                    {agent.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                {agent.name}
                                            </div>
                                            <div className="col-span-3">
                                                <Badge status={agent.status} />
                                            </div>
                                            <div className="col-span-2 text-sm text-muted-foreground capitalize">
                                                {agent.role}
                                            </div>
                                            <div className="col-span-2 text-right">
                                                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Manage
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* 3. Right Sidebar / Insights */}
                <div className="space-y-6">
                    <Card className="rounded-3xl border-border/50 bg-gradient-to-br from-blue-600 to-violet-700 text-white overflow-hidden relative border-none">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10" />
                        <div className="p-8">
                            <h3 className="text-lg font-bold mb-2">Upgrade to Pro</h3>
                            <p className="text-blue-100/80 text-sm mb-6 leading-relaxed">
                                Unlock unlimited agents, advanced analytics, and custom LLM fine-tuning.
                            </p>
                            <Button className="w-full bg-white text-blue-600 hover:bg-blue-50 border-none font-semibold">
                                View Plans
                            </Button>
                        </div>
                    </Card>

                    <Card className="rounded-3xl border-border/50 bg-card shadow-sm overflow-hidden">
                        <div className="p-6">
                            <h3 className="font-semibold text-foreground mb-4">Recent Activity</h3>
                            <div className="space-y-4">
                                {[1, 2, 3].map((_, i) => (
                                    <div key={i} className="flex gap-4 items-start">
                                        <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm text-foreground">New conversation started from <strong>Pricing Page</strong></p>
                                            <p className="text-xs text-muted-foreground mt-1">2 mins ago</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}

function StatCard({ title, value, description, icon, trend, trendUp }: any) {
    return (
        <Card className="rounded-2xl border-border/50 bg-card shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-secondary/50 rounded-lg group-hover:bg-blue-500/10 transition-colors">
                    {icon}
                </div>
                {trend && (
                    <span className={cn("text-xs font-medium px-2 py-1 rounded-full", trendUp ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600")}>
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-foreground tracking-tight">{value}</h3>
                <p className="text-xs text-muted-foreground mt-2">{description}</p>
            </div>
        </Card>
    )
}

function Badge({ status }: { status: string }) {
    const isRunning = status === 'active';
    return (
        <div className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
            isRunning
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-slate-500/10 text-slate-600 dark:text-slate-400"
        )}>
            <div className={cn("w-1.5 h-1.5 rounded-full mr-1.5", isRunning ? "bg-emerald-500" : "bg-slate-500")} />
            {isRunning ? 'Active' : 'Paused'}
        </div>
    )
}

function ZapIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
    )
}
