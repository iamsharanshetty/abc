"use client";

import { useEffect, useState } from "react";
import { OrgInfoCard } from "@/components/settings/OrgInfoCard";
import { AllowedDomainsCard } from "@/components/settings/AllowedDomainsCard";
import { DefaultAgentSettingsCard } from "@/components/settings/DefaultAgentSettingsCard";
import { SecurityAccessCard } from "@/components/settings/SecurityAccessCard";

interface Profile {
    id: string;
    full_name: string;
    email: string;
    website_url?: string;
    onboarding_answers?: any;
}

export default function RealtimeSettings({ initialProfile }: { initialProfile: Profile | null }) {
    const [profile, setProfile] = useState<Profile | null>(initialProfile);

    useEffect(() => {
        if (initialProfile) {
            setProfile(initialProfile);
        }
    }, [initialProfile]);

    if (!profile) return null;

    const onboarding = profile.onboarding_answers || {};

    return (
        <div className="space-y-6">
            <OrgInfoCard
                initialName={onboarding.org_name || profile.full_name || ""}
                initialWebsite={onboarding.org_website || profile.website_url || ""}
                initialLogo={onboarding.org_logo || ""}
            />

            <AllowedDomainsCard
                initialDomains={onboarding.allowed_domains || []}
            />

            <DefaultAgentSettingsCard
                initialSettings={onboarding.default_agent_settings || {}}
            />

            <SecurityAccessCard email={profile.email} />
        </div>
    );
}
