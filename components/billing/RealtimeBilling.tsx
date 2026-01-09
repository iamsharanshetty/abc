"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { UsageSummaryCard } from "@/components/billing/UsageSummaryCard";
import { PaymentMethodCard } from "@/components/billing/PaymentMethodCard";
import { InvoicesTable } from "@/components/billing/InvoicesTable";
import { getBillingUsage } from "@/lib/actions/agents";
import { useRouter } from "next/navigation";

interface Profile {
    id: string;
    plan_tier?: string;
    subscription_status?: string;
    stripe_card_last4?: string; // We might add this to profile schema later, or pass separately
}

interface UsageStats {
    agentsCount: number;
    conversationsCount: number;
    planLimit: { agents: number; conversations: number };
    isPro: boolean;
}

export default function RealtimeBilling({ initialProfile }: { initialProfile: Profile | null }) {
    const [profile, setProfile] = useState<Profile | null>(initialProfile);
    const [usage, setUsage] = useState<UsageStats | null>(null);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        // Fetch initial usage
        getBillingUsage().then(setUsage);

        if (!initialProfile) return;

        // Subscribe to profile changes
        const channel = supabase.channel('realtime_billing')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${initialProfile.id}` }, (payload) => {
                setProfile((prev) => ({ ...prev, ...payload.new } as Profile));
                // Refetch usage on profile change (e.g. upgrade)
                getBillingUsage().then(setUsage);
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [supabase, initialProfile]);

    const planName = profile?.plan_tier === 'pro' ? 'Pro Plan' : 'Free Plan';
    const price = profile?.plan_tier === 'pro' ? '$49' : '$0';
    const isPro = profile?.plan_tier === 'pro';

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Current Plan Card */}
            <Card className="rounded-xl border border-slate-100 shadow-sm bg-white overflow-hidden dark:bg-slate-900 dark:border-slate-800">
                <CardContent className="p-8 relative">
                    <div className="absolute top-8 right-8 bg-slate-50 text-slate-500 text-xs font-bold px-3 py-1.5 rounded-md dark:bg-slate-800 dark:text-slate-400">
                        {profile?.subscription_status === 'active' ? 'Active' : 'Trialing'}
                    </div>

                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{planName}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {isPro ? "Unlimited Access to Webrep AI Agents" : "Perfect for hobbyists and testing"}
                        </p>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="text-3xl font-bold text-slate-900 dark:text-white">
                            {price}<span className="text-lg text-slate-400 font-medium">/month</span>
                        </div>
                        <Button
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 px-6 rounded-lg shadow-sm shadow-blue-200 dark:shadow-blue-900 transition-colors"
                            onClick={() => router.push('/pricing')}
                        >
                            {isPro ? "Manage Subscription" : "Upgrade Plan"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <UsageSummaryCard usage={usage} />
                <PaymentMethodCard isPro={isPro} />
            </div>

            <InvoicesTable />
        </div>
    );
}
