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
    Zap
} from "lucide-react"

import { cn } from "@/lib/utils"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    onLinkClick?: () => void
}

export function Sidebar({ className, onLinkClick }: SidebarProps) {
    const pathname = usePathname()

    const navItems = [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Previous Agents", href: "/dashboard/previous-agents", icon: MessageSquare },
        { name: "Analytics", href: "/dashboard/analytics", icon: BarChart2 },
        { name: "Create Agent", href: "/dashboard/create", icon: Bot },
        { name: "Integrations", href: "/dashboard/integrations", icon: Zap },
        { name: "Team", href: "/dashboard/team", icon: Users },
        { name: "Billing", href: "/dashboard/billing", icon: CreditCard },
        { name: "Organization Settings", href: "/dashboard/settings", icon: Building },
    ]

    return (
        <div className={cn("flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800", className)}>
            {/* Logo Area */}
            <div className="p-6">
                <div className="flex items-center gap-2 font-bold text-xl text-slate-900 dark:text-white">
                    <div className="w-0 h-0 border-l-[10px] border-l-transparent border-b-[16px] border-b-blue-600 border-r-[10px] border-r-transparent mb-1"></div>
                    WEBREP
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onLinkClick}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                                isActive
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-slate-400 dark:text-slate-500")} />
                            {item.name}
                        </Link>
                    )
                })}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-50 dark:border-slate-800/50">
                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer mb-4 transition-colors">
                    <Headphones className="h-4 w-4" />
                    <span className="text-sm font-medium">Need Any Help?</span>
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-600 font-medium">
                    Webrep v0.1
                </div>
            </div>
        </div>
    )
}
