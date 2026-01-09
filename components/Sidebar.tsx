"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    MessageSquare,
    BarChart2,
    Bot,
    Users,
    CreditCard,
    Building,
    Headphones,
    Zap,
    LifeBuoy
} from "lucide-react"

import { cn } from "@/lib/utils"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    onLinkClick?: () => void
}

export function Sidebar({ className, onLinkClick }: SidebarProps) {
    const pathname = usePathname()

    const navItems = [
        { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
        { name: "My Agents", href: "/dashboard/previous-agents", icon: Bot },
        { name: "Analytics", href: "/dashboard/analytics", icon: BarChart2 },
        { name: "Integrations", href: "/dashboard/integrations", icon: Zap },
    ]

    const settingsItems = [
        { name: "Team Members", href: "/dashboard/team", icon: Users },
        { name: "Billing & Plans", href: "/dashboard/billing", icon: CreditCard },
        { name: "Settings", href: "/dashboard/settings", icon: Building },
    ]

    const NavLink = ({ item }: { item: any }) => {
        const isActive = pathname === item.href
        return (
            <Link
                href={item.href}
                onClick={onLinkClick}
                className={cn(
                    "group flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200",
                    isActive
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
            >
                <item.icon className={cn("h-4 w-4 transition-colors", isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground")} />
                {item.name}
            </Link>
        )
    }

    return (
        <div className={cn("flex flex-col h-full bg-card border-r border-border/50", className)}>
            {/* Logo Area */}
            <div className="p-6 pb-8">
                <div className="flex items-center gap-3 group cursor-pointer">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300">
                        W
                    </div>
                    <span className="font-bold text-lg tracking-tight select-none">WebRep</span>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 px-4 py-2 space-y-8 overflow-y-auto custom-scrollbar">
                <div>
                    <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Platform</h3>
                    <div className="space-y-1">
                        {navItems.map((item) => (
                            <NavLink key={item.href} item={item} />
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Organization</h3>
                    <div className="space-y-1">
                        {settingsItems.map((item) => (
                            <NavLink key={item.href} item={item} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 m-4 rounded-xl bg-secondary/30 border border-border/50">
                <Link href="/help" className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-blue-500 transition-colors mb-2">
                    <LifeBuoy className="h-4 w-4" />
                    Help & Support
                </Link>
                <div className="text-xs text-muted-foreground">
                    WebRep v1.0.0
                </div>
            </div>
        </div>
    )
}

