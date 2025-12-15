"use client";

import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: "Owner" | "Admin" | "Member";
    status: "Active" | "Invited";
    lastActive: string | null;
    avatarSeed: string;
}

const TEAM_MEMBERS: TeamMember[] = [
    {
        id: "1",
        name: "Robert Fox",
        email: "robert@company.com",
        role: "Owner",
        status: "Active",
        lastActive: "2h Ago",
        avatarSeed: "Robert",
    },
    {
        id: "2",
        name: "Jenny Wilson",
        email: "jenny@company.com",
        role: "Admin",
        status: "Invited",
        lastActive: null,
        avatarSeed: "Jenny",
    },
    {
        id: "3",
        name: "Sarah Lee",
        email: "sarah@company.com",
        role: "Admin",
        status: "Active",
        lastActive: "30m Ago",
        avatarSeed: "Sarah",
    },
    {
        id: "4",
        name: "Jacob Jones",
        email: "alex@company.com",
        role: "Member",
        status: "Active",
        lastActive: "2h Ago",
        avatarSeed: "Jacob",
    },
];

export function TeamTable() {
    return (
        <div className="w-full overflow-hidden">
            <table className="w-full border-collapse">
                <thead className="bg-[#fafafa] dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                    <tr>
                        <th className="text-left py-4 px-6 text-xs font-bold text-slate-900 dark:text-slate-200 w-[30%]">
                            Member
                        </th>
                        <th className="text-left py-4 px-6 text-xs font-bold text-slate-900 dark:text-slate-200 w-[25%]">
                            Email
                        </th>
                        <th className="text-left py-4 px-6 text-xs font-bold text-slate-900 dark:text-slate-200 w-[15%]">
                            Role
                        </th>
                        <th className="text-left py-4 px-6 text-xs font-bold text-slate-900 dark:text-slate-200 w-[15%]">
                            Status
                        </th>
                        <th className="text-right py-4 px-6 text-xs font-bold text-slate-900 dark:text-slate-200 w-[15%]">
                            Last Active
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {TEAM_MEMBERS.map((member) => (
                        <tr
                            key={member.id}
                            className="border-b border-slate-50 last:border-none hover:bg-slate-50/50 transition-colors"
                        >
                            {/* Member Column */}
                            <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700">
                                        <img
                                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.avatarSeed}`}
                                            alt={member.name}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                        {member.name}
                                    </span>
                                </div>
                            </td>

                            {/* Email Column */}
                            <td className="py-4 px-6">
                                <span className="text-sm font-medium text-slate-500">
                                    {member.email}
                                </span>
                            </td>

                            {/* Role Column */}
                            <td className="py-4 px-6">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-3 text-xs font-medium text-slate-900 bg-slate-50 border-slate-200/60 hover:bg-slate-100 hover:text-slate-900 flex items-center gap-1.5 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700"
                                >
                                    {member.role}
                                    <ChevronDown className="h-3 w-3 text-slate-400" />
                                </Button>
                            </td>

                            {/* Status Column */}
                            <td className="py-4 px-6">
                                <span
                                    className={cn(
                                        "px-2.5 py-1 rounded-md text-xs font-semibold inline-block",
                                        member.status === "Active"
                                            ? "bg-[#e6f4ea] text-[#137333] dark:bg-green-500/10 dark:text-green-400" // Google/Material-like green pill
                                            : "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                                    )}
                                >
                                    {member.status}
                                </span>
                            </td>

                            {/* Last Active Column */}
                            <td className="py-4 px-6 text-right">
                                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                    {member.lastActive || "—"}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
