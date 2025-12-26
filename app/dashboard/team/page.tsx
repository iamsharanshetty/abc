"use client";

import { Button } from "@/components/ui/Button";
import { TeamTable } from "@/components/team/TeamTable";
import { UserPlus } from "lucide-react";

export default function TeamPage() {
    return (
        <div className="space-y-8 pt-2 pb-10 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Team Management</h1>
                    <p className="text-muted-foreground">Invite and manage users in your organization.</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold h-10 px-6 rounded-lg shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite Member
                </Button>
            </div>

            {/* Main Content Card */}
            <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
                <TeamTable />
            </div>
        </div>
    );
}
