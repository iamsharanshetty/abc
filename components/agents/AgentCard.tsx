"use client";

import {
    MoreHorizontal,
    Play,
    Pause,
    ChevronRight,
    Copy,
    Archive,
    Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface AgentProps {
    id: string;
    name: string;
    type: "Support Agent" | "Sales" | "FAQ" | "Custom";
    status: "Running" | "Paused";
    description: string;
    website: string;
    conversations: string;
    lastActive: string;
    tags: string[];
}

export function AgentCard({ agent }: { agent: AgentProps }) {
    const isRunning = agent.status === "Running";

    return (
        <Card className="rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow bg-white">
            <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1.5">
                        <h3 className="font-bold text-slate-900 text-lg">{agent.name}</h3>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="font-medium text-slate-500">AI Assistent</span>
                            <span
                                className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-semibold",
                                    isRunning
                                        ? "bg-green-50 text-green-700"
                                        : "bg-slate-100 text-slate-600"
                                )}
                            >
                                {agent.status}
                            </span>
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-full hover:bg-slate-50 text-slate-400"
                            >
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                            <DropdownMenuItem className="gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 focus:bg-slate-50 dark:focus:bg-slate-800 cursor-pointer">
                                <Copy className="h-3.5 w-3.5" /> Duplicate Agent
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 focus:bg-slate-50 dark:focus:bg-slate-800 cursor-pointer">
                                <Archive className="h-3.5 w-3.5" /> Archive Agent
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-xs font-medium text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30 cursor-pointer">
                                <Trash2 className="h-3.5 w-3.5" /> Delete Agent
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Description */}
                <p className="text-sm text-slate-500 mb-5 leading-relaxed min-h-[40px]">
                    {agent.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {agent.tags.map((tag) => (
                        <span
                            key={tag}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-xs font-medium",
                                tag === agent.type
                                    ? "bg-blue-50 text-blue-700"
                                    : "bg-slate-50 text-slate-600"
                            )}
                        >
                            {tag}
                        </span>
                    ))}
                </div>

                {/* Website */}
                <div className="mb-6">
                    <p className="text-sm text-slate-500 truncate">{agent.website}</p>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between mb-6 text-xs text-slate-500 font-medium">
                    <span>{agent.conversations} Conversations</span>
                    <div className="flex items-center gap-1.5">
                        <span
                            className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                isRunning ? "bg-green-500" : "bg-slate-300"
                            )}
                        />
                        {agent.lastActive}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center bg-blue-600 rounded-lg p-1">
                        <button
                            className={cn(
                                "px-4 py-1.5 text-xs font-bold rounded-md transition-colors",
                                isRunning ? "bg-white text-blue-600" : "text-white/90 hover:text-white"
                            )}
                        >
                            Start
                        </button>
                        <button
                            className={cn(
                                "px-4 py-1.5 text-xs font-bold rounded-md transition-colors",
                                !isRunning
                                    ? "bg-white text-blue-600"
                                    : "text-white/90 hover:text-white"
                            )}
                        >
                            Pause
                        </button>
                        <div className="px-2 border-l border-white/20 ml-1">
                            <ChevronRight className="h-4 w-4 text-white" />
                        </div>
                    </div>

                    <Link
                        href="#"
                        className="text-xs font-bold text-slate-900 hover:text-blue-600 transition-colors"
                    >
                        View Settings
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
