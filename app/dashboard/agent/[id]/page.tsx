
import { getAgentById, getSingleAgentStats, getAgentConversations } from "@/lib/actions/agents";
import { AgentTestWrapper } from "@/components/agents/AgentTestWrapper";
import { ArrowLeft, Bot, Activity, Trash2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AgentSettingsButton } from "@/components/agents/AgentSettings";
import { DeleteAgentButton } from "@/components/agents/DeleteAgentButton";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function AgentDetailsPage({ params }: PageProps) {
    const { id } = await params;
    const agent = await getAgentById(id) as any;
    const stats = await getSingleAgentStats(id);
    const conversations = await getAgentConversations(id);

    if (!agent) {
        return notFound();
    }

    // Safely access settings
    const settings = agent.settings || {};

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header / Nav */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/previous-agents">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        {agent.name}
                        <Badge variant="outline" className={agent.status === 'active' || agent.status === 'running' ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-gray-100 text-gray-500"}>
                            {agent.status}
                        </Badge>
                    </h1>
                </div>
                <div className="flex gap-2">
                    <AgentSettingsButton agent={agent} />
                    <AgentTestWrapper agent={agent} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Bot className="w-5 h-5 text-blue-500" /> Configuration
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Role</label>
                                <p className="text-base font-medium">{agent.role}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Description</label>
                                <p className="text-sm text-foreground/80 leading-relaxed">
                                    {settings.description || "No description provided."}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Source URL</label>
                                <p className="text-sm text-blue-600 hover:underline cursor-pointer">
                                    {settings.url || "N/A"}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <MessageCircle className="w-5 h-5 text-green-500" /> Recent Conversations
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {conversations.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    No messages yet. Try testing your agent!
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {conversations.map((msg: any) => (
                                        <div key={msg.id} className="flex flex-col gap-1 p-3 rounded-lg border bg-card/50">
                                            <div className="flex justify-between items-center">
                                                <Badge
                                                    variant="secondary"
                                                    className={cn(
                                                        "text-xs capitalize",
                                                        msg.role === 'user' ? "bg-blue-500/10 text-blue-600" : "bg-green-500/10 text-green-600"
                                                    )}
                                                >
                                                    {msg.role}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground tabular-nums">
                                                    {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className="text-sm mt-1 whitespace-pre-wrap line-clamp-3">
                                                {msg.content}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Stats / Quick Actions */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Activity className="w-5 h-5 text-purple-500" /> Stats
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Total Messages</span>
                                <span className="font-bold">{stats.totalMessages}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Last Active</span>
                                <span className="font-bold">
                                    {stats.lastActive
                                        ? formatDistanceToNow(new Date(stats.lastActive), { addSuffix: true })
                                        : "Never"}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-red-100 dark:border-red-900/20">
                        <CardHeader>
                            <CardTitle className="text-lg text-red-600 dark:text-red-400 flex items-center gap-2">
                                <Trash2 className="w-5 h-5" /> Danger Zone
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <DeleteAgentButton agentId={agent.id} agentName={agent.name} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
