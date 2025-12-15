"use client";

import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/dashboard/previous-agents": "Previous Agents",
    "/dashboard/analytics": "Analytics",
    "/dashboard/create": "Create Agent",
    "/dashboard/team": "Team",
    "/dashboard/billing": "Billing",
    "/dashboard/settings": "Organization Settings",
};

export function DynamicPageTitle() {
    const pathname = usePathname();
    const title = PAGE_TITLES[pathname] || "Dashboard";

    return (
        <h2 className="text-lg font-medium text-slate-800 dark:text-slate-200">
            {title}
        </h2>
    );
}
