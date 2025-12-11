"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Settings, Bot } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    onLinkClick?: () => void
}

export function Sidebar({ className, onLinkClick }: SidebarProps) {
    const pathname = usePathname()

    return (
        <div className={cn("pb-12", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                        Overview
                    </h2>
                    <div className="space-y-1">
                        <Button variant={pathname === "/dashboard" ? "secondary" : "ghost"} className="w-full justify-start" asChild>
                            <Link href="/dashboard" onClick={onLinkClick}>
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                Dashboard
                            </Link>
                        </Button>
                        <Button variant={pathname === "/dashboard/create" ? "secondary" : "ghost"} className="w-full justify-start" asChild>
                            <Link href="/dashboard/create" onClick={onLinkClick}>
                                <Bot className="mr-2 h-4 w-4" />
                                Create Agent
                            </Link>
                        </Button>
                        <Button variant={pathname === "/dashboard/settings" ? "secondary" : "ghost"} className="w-full justify-start" asChild>
                            <Link href="/dashboard/settings" onClick={onLinkClick}>
                                <Settings className="mr-2 h-4 w-4" />
                                Settings
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
