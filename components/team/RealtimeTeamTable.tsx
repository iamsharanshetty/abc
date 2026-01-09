"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface Profile {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string | null;
    subscription_status?: string;
}

export default function RealtimeTeamTable({ initialProfile }: { initialProfile: Profile | null }) {
    const [profile, setProfile] = useState<Profile | null>(initialProfile);
    const supabase = createClient();

    // Subscribe to profile changes
    useEffect(() => {
        if (!initialProfile) return;

        const channel = supabase
            .channel('realtime_profile_team')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${initialProfile.id}` },
                (payload) => {
                    setProfile((prev) => ({ ...prev, ...payload.new } as Profile));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, initialProfile]);

    if (!profile) {
        return <div className="p-8 text-center text-muted-foreground">Please sign in to view your team.</div>;
    }

    // Single Admin View (Using Array for consistency with future multi-user)
    const members = [
        {
            id: profile.id,
            name: profile.full_name || "Admin User",
            email: profile.email || "No email",
            role: "Owner",
            status: "Active",
            lastActive: "Now", // Placeholder
            avatar: profile.avatar_url
        }
    ];

    return (
        <div className="w-full overflow-hidden">
            <table className="w-full border-collapse">
                <thead className="bg-[#fafafa] dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                    <tr>
                        <th className="text-left py-4 px-6 text-xs font-bold text-slate-900 dark:text-slate-200 w-[30%]">Member</th>
                        <th className="text-left py-4 px-6 text-xs font-bold text-slate-900 dark:text-slate-200 w-[25%]">Email</th>
                        <th className="text-left py-4 px-6 text-xs font-bold text-slate-900 dark:text-slate-200 w-[15%]">Role</th>
                        <th className="text-left py-4 px-6 text-xs font-bold text-slate-900 dark:text-slate-200 w-[15%]">Status</th>
                        <th className="text-right py-4 px-6 text-xs font-bold text-slate-900 dark:text-slate-200 w-[15%]">Last Active</th>
                    </tr>
                </thead>
                <tbody>
                    {members.map((member) => (
                        <tr key={member.id} className="border-b border-slate-50 last:border-none hover:bg-slate-50/50 transition-colors">
                            {/* Member */}
                            <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                                        {member.avatar ? (
                                            <img src={member.avatar} alt={member.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <span className="text-lg font-bold text-slate-400">{member.name.charAt(0)}</span>
                                        )}
                                    </div>
                                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{member.name}</span>
                                </div>
                            </td>
                            {/* Email */}
                            <td className="py-4 px-6"><span className="text-sm font-medium text-slate-500">{member.email}</span></td>
                            {/* Role */}
                            <td className="py-4 px-6">
                                <Button variant="outline" size="sm" className="h-8 px-3 text-xs font-medium bg-slate-50 border-slate-200/60 flex items-center gap-1.5 dark:bg-slate-800 dark:border-slate-700">
                                    {member.role}
                                </Button>
                            </td>
                            {/* Status */}
                            <td className="py-4 px-6">
                                <span className="px-2.5 py-1 rounded-md text-xs font-semibold inline-block bg-[#e6f4ea] text-[#137333] dark:bg-green-500/10 dark:text-green-400">
                                    {member.status}
                                </span>
                            </td>
                            {/* Last Active */}
                            <td className="py-4 px-6 text-right"><span className="text-sm font-medium text-slate-900 dark:text-slate-100">{member.lastActive}</span></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
