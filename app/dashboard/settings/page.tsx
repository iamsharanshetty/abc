"use client";

import { OrgInfoCard } from "@/components/settings/OrgInfoCard";
import { AllowedDomainsCard } from "@/components/settings/AllowedDomainsCard";
import { DefaultAgentSettingsCard } from "@/components/settings/DefaultAgentSettingsCard";
import { SecurityAccessCard } from "@/components/settings/SecurityAccessCard";

export default function SettingsPage() {
    return (
        <div className="space-y-6 pt-2 pb-10 max-w-5xl">
            {/* Note: The image implies "Organization Info" is the first card header, but "Organization Setting" is the page breadcrumb. 
           However, user prompt said "Page title: Organization Info". 
           If I look at "Team" page, H1 is "Team". 
           If I look at "Billing" page, H1 is "Current Plan" (content) or "Billing" (nav).
           I will add a page title "Organization Setting" to match the top nav breadcrumb style or just let the first card be the focus?
           Wait, looking at the image provided for Org Settings... 
           Top left says "Organization Setting".
           Then the big white card starts with H1 "Organization Info". 
           Actually, the "Organization Info" is INSIDE the card in my `OrgInfoCard` component.
           Let's check the Previous Agents / Team / Billing pages...
           They all had an H1 above the card. 
           But in this specific screenshot: 
           "Organization Setting" is small text top left (breadcrumb/header).
           "Organization Info" is the big title inside the first card? Or above it?
           Image: Big text "Organization Info" feels like it's inside the white box or just above it.
           Wait, looking closely at the screenshot...
           "Organization Setting" is at very top left (like breadcrumb).
           Then there is the white card. 
           "Organization Info" is the title OF the card.
           I will put a small "Organization Setting" H1 at top if needed, or matches Layout.
           Let's stick to Layout providing the "Organization Setting" breadcrumb text if dynamic title works?
           Currently `DynamicPageTitle` sets the header text.
           So `dashboard/settings` -> "Organization Settings".
           So I don't need a page H1.
           I will just render the cards.
       */}
            <h1 className="sr-only">Organization Settings</h1> {/* Accessible hidden title */}

            <OrgInfoCard />

            <AllowedDomainsCard />

            <DefaultAgentSettingsCard />

            <SecurityAccessCard />
        </div>
    );
}
