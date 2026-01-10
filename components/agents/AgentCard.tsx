// components/agents/AgentCard.tsx
"use client";

import {
<<<<<<< HEAD
    MoreHorizontal,
    Play,
    Pause,
    ChevronRight,
    Copy,
    Archive,
    Trash2,
=======
  MoreHorizontal,
  Play,
  Pause,
  ChevronRight,
  Copy,
  Archive,
  Trash2,
>>>>>>> chat-backup
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
import { useState } from "react";
<<<<<<< HEAD
import { duplicateAgent, archiveAgent, deleteAgent, updateAgentStatus } from "@/lib/actions/agents";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";

export interface AgentProps {
    id: string;
    name: string;
    type: string;
    status: string;
    description: string;
    website: string;
    conversations: string;
    lastActive: string;
    tags: string[];
}

export function AgentCard({ agent }: { agent: AgentProps }) {
    const statusLower = agent.status.toLowerCase();
    const isRunning = statusLower === "running" || statusLower === "active";

    const [isLoading, setIsLoading] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // We can rely on realtime / page refresh from actions, so simple state is enough for confirmation
    const router = useRouter();

    const handleDuplicate = async () => {
        setIsLoading(true);
        await duplicateAgent(agent.id);
        setIsLoading(false);
    };

    const handleArchive = async () => {
        setIsLoading(true);
        await archiveAgent(agent.id);
        setIsLoading(false);
    };

    const handleDelete = async () => {
        setIsLoading(true);
        await deleteAgent(agent.id);
        setIsLoading(false);
        setIsDeleteModalOpen(false);
    };

    const toggleStatus = async () => {
        setIsLoading(true);
        const newStatus = isRunning ? "paused" : "running"; // Note: DB uses lowercase
        await updateAgentStatus(agent.id, newStatus);
        setIsLoading(false);
    };

    // Determine status badge color
    const getStatusColor = (status: string) => {
        const s = status.toLowerCase();
        if (s === 'running' || s === 'active') return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
        if (s === 'paused') return "bg-amber-500/10 text-amber-600 border-amber-500/20";
        if (s === 'archived') return "bg-gray-500/10 text-gray-600 border-gray-500/20";
        return "bg-secondary text-muted-foreground border-border";
    };

    const statusLabel = agent.status.charAt(0).toUpperCase() + agent.status.slice(1);

    return (
        <>
            <Card className="rounded-xl border border-border/50 shadow-sm hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 bg-card group">
                <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600/10 to-violet-600/10 flex items-center justify-center text-blue-600 font-bold text-lg shrink-0">
                                {agent.name.substring(0, 1)}
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-foreground text-lg leading-none line-clamp-1" title={agent.name}>{agent.name}</h3>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="font-medium text-muted-foreground">AI Assistant</span>
                                    <span
                                        className={cn(
                                            "px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                                            getStatusColor(agent.status)
                                        )}
                                    >
                                        {statusLabel}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-full hover:bg-secondary text-muted-foreground"
                                    disabled={isLoading}
                                >
                                    <MoreHorizontal className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[160px]">
                                <DropdownMenuItem onClick={handleDuplicate} className="gap-2 text-xs font-medium cursor-pointer">
                                    <Copy className="h-3.5 w-3.5" /> Duplicate Agent
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleArchive} className="gap-2 text-xs font-medium cursor-pointer">
                                    <Archive className="h-3.5 w-3.5" /> Archive Agent
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setIsDeleteModalOpen(true)} className="gap-2 text-xs font-medium text-destructive focus:text-destructive cursor-pointer">
                                    <Trash2 className="h-3.5 w-3.5" /> Delete Agent
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground mb-5 leading-relaxed min-h-[40px] line-clamp-2">
                        {agent.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {agent.tags.map((tag) => (
                            <span
                                key={tag}
                                className={cn(
                                    "px-2.5 py-1 rounded-md text-xs font-medium border",
                                    tag === agent.type
                                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30"
                                        : "bg-secondary/50 text-muted-foreground border-border"
                                )}
                            >
                                {tag}
                            </span>
                        ))}
                    </div>

                    {/* Stats */}
                    {/* ... stats code ... */}
                    <div className="grid grid-cols-2 gap-4 mb-6 pt-4 border-t border-border/50">
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground font-medium">Conversations</p>
                            <p className="text-sm font-bold text-foreground">{agent.conversations}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground font-medium">Last Active</p>
                            <div className="flex items-center gap-1.5">
                                <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse", isRunning ? "bg-emerald-500" : "bg-slate-400")} />
                                <p className="text-sm font-bold text-foreground">{agent.lastActive}</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            onClick={toggleStatus}
                            disabled={isLoading}
                            className={cn(
                                "flex-1 font-semibold text-xs transition-all",
                                isRunning
                                    ? "bg-secondary text-foreground hover:bg-secondary/80 border border-border"
                                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20"
                            )}
                        >
                            {isRunning ? (
                                <>
                                    <Pause className="w-3.5 h-3.5 mr-2" /> Pause
                                </>
                            ) : (
                                <>
                                    <Play className="w-3.5 h-3.5 mr-2" /> Resume
                                </>
                            )}
                        </Button>
                        <Link href={`/dashboard/agent/${agent.id}`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full text-xs font-semibold border-border/50 hover:bg-secondary/50">
                                Details <ChevronRight className="w-3.5 h-3.5 ml-1 opacity-50" />
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Agent"
                className="sm:max-w-md"
            >
                <div className="space-y-4 py-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Are you sure you want to delete <strong>{agent.name}</strong>? This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isLoading}
                        >
                            {isLoading ? "Deleting..." : "Confirm Delete"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
=======
import { createClient } from "@/lib/supabase/client";

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
  const [currentStatus, setCurrentStatus] = useState(agent.status);
  const [isUpdating, setIsUpdating] = useState(false);
  const isRunning = currentStatus === "Running";

  // Handle status toggle (pause/start)
  async function handleStatusToggle() {
    try {
      setIsUpdating(true);
      const supabase = createClient();

      const newStatus = isRunning ? "inactive" : "active";
      const newDisplayStatus = isRunning ? "Paused" : "Running";

      const { error } = await supabase
        .from("agents")
        .update({ status: newStatus })
        .eq("id", agent.id);

      if (error) {
        console.error("Error updating agent status:", error);
        alert("Failed to update agent status. Please try again.");
        return;
      }

      setCurrentStatus(newDisplayStatus);
    } catch (err) {
      console.error("Exception updating agent status:", err);
      alert("An error occurred. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  }

  // Handle agent deletion
  async function handleDelete() {
    if (
      !confirm(
        `Are you sure you want to delete "${agent.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("agents")
        .delete()
        .eq("id", agent.id);

      if (error) {
        console.error("Error deleting agent:", error);
        alert("Failed to delete agent. Please try again.");
        return;
      }

      // Reload the page to reflect changes
      window.location.reload();
    } catch (err) {
      console.error("Exception deleting agent:", err);
      alert("An error occurred. Please try again.");
    }
  }

  // Handle agent duplication
  async function handleDuplicate() {
    try {
      const supabase = createClient();

      // Get the full agent data
      const { data: originalAgent, error: fetchError } = await supabase
        .from("agents")
        .select("*")
        .eq("id", agent.id)
        .single();

      if (fetchError || !originalAgent) {
        console.error("Error fetching agent:", fetchError);
        alert("Failed to duplicate agent. Please try again.");
        return;
      }

      // Create duplicate with modified name
      const { error: insertError } = await supabase.from("agents").insert({
        user_id: originalAgent.user_id,
        name: `${originalAgent.name} (Copy)`,
        website_url: originalAgent.website_url,
        role: originalAgent.role,
        status: "inactive", // Start as inactive
        settings: originalAgent.settings,
        system_prompt: originalAgent.system_prompt,
      });

      if (insertError) {
        console.error("Error duplicating agent:", insertError);
        alert("Failed to duplicate agent. Please try again.");
        return;
      }

      // Reload the page to show the new agent
      window.location.reload();
    } catch (err) {
      console.error("Exception duplicating agent:", err);
      alert("An error occurred. Please try again.");
    }
  }

  return (
    <Card className="rounded-xl border border-border/50 shadow-sm hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 bg-card group">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600/10 to-violet-600/10 flex items-center justify-center text-blue-600 font-bold text-lg">
              {agent.name.substring(0, 1)}
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-foreground text-lg leading-none">
                {agent.name}
              </h3>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-medium text-muted-foreground">
                  AI Assistant
                </span>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                    isRunning
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : "bg-secondary text-muted-foreground border-border"
                  )}
                >
                  {currentStatus}
                </span>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-full hover:bg-secondary text-muted-foreground"
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuItem
                className="gap-2 text-xs font-medium cursor-pointer"
                onClick={handleDuplicate}
              >
                <Copy className="h-3.5 w-3.5" /> Duplicate Agent
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 text-xs font-medium cursor-pointer"
                onClick={() => alert("Archive feature coming soon!")}
              >
                <Archive className="h-3.5 w-3.5" /> Archive Agent
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 text-xs font-medium text-destructive focus:text-destructive cursor-pointer"
                onClick={handleDelete}
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete Agent
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-5 leading-relaxed min-h-[40px] line-clamp-2">
          {agent.description}
        </p>

        {/* Tags - FIXED: Using index-based keys to ensure uniqueness */}
        <div className="flex flex-wrap gap-2 mb-6">
          {agent.tags.map((tag, index) => (
            <span
              key={`${agent.id}-tag-${index}`}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-medium border",
                tag === agent.type
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30"
                  : "bg-secondary/50 text-muted-foreground border-border"
              )}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6 pt-4 border-t border-border/50">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">
              Conversations
            </p>
            <p className="text-sm font-bold text-foreground">
              {agent.conversations}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">
              Last Active
            </p>
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full animate-pulse",
                  isRunning ? "bg-emerald-500" : "bg-slate-400"
                )}
              />
              <p className="text-sm font-bold text-foreground">
                {agent.lastActive}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleStatusToggle}
            disabled={isUpdating}
            className={cn(
              "flex-1 font-semibold text-xs",
              isRunning
                ? "bg-secondary text-foreground hover:bg-secondary/80 border border-border"
                : "bg-blue-600 text-white hover:bg-blue-700"
            )}
          >
            {isUpdating ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-2"></div>
                {isRunning ? "Pausing..." : "Starting..."}
              </>
            ) : isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 mr-2" /> Pause
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 mr-2" /> Start Agent
              </>
            )}
          </Button>
          <Link href={`/dashboard/agent/${agent.id}`} className="flex-1">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs font-semibold border-border/50 hover:bg-secondary/50"
            >
              Details <ChevronRight className="w-3.5 h-3.5 ml-1 opacity-50" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
>>>>>>> chat-backup
}
