"use client";

import { Button } from "@/components/ui/Button";
import { TeamTable } from "@/components/team/TeamTable";

export default function TeamPage() {
    return (
        <div className="space-y-8 pt-2 pb-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Team</h1>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold h-10 px-6 rounded-lg shadow-sm shadow-blue-200 dark:shadow-blue-900 transition-colors">
                    Invite Member
                </Button>
            </div>

            {/* Main Content Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <TeamTable />
            </div>
        </div>
    );
}
