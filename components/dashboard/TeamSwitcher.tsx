"use client"

import * as React from "react"
import {
    ChevronsUpDown,
    Plus,
    Rocket,
    Settings,
    Users,
} from "lucide-react"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/Button"

export function TeamSwitcher() {
    const [activeTeam, setActiveTeam] = React.useState("Acme Inc.")

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    className="w-[200px] justify-between border-dashed bg-card/50"
                >
                    <div className="flex items-center gap-2">
                        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary text-primary-foreground">
                            <Rocket className="h-3 w-3 text-white" />
                        </div>
                        {activeTeam}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[200px]">
                <DropdownMenuLabel>Teams</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => { setActiveTeam("Acme Inc."); window.location.href = "/dashboard/team"; }}>
                    <div className="flex items-center gap-2">
                        <div className="flex h-5 w-5 items-center justify-center rounded-md border bg-background">
                            <Rocket className="h-3 w-3" />
                        </div>
                        Acme Inc.
                    </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setActiveTeam("Personal"); window.location.href = "/dashboard/team"; }}>
                    <div className="flex items-center gap-2">
                        <div className="flex h-5 w-5 items-center justify-center rounded-md border bg-background">
                            <Users className="h-3 w-3" />
                        </div>
                        Personal
                    </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.location.href = "/dashboard/team"}>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Plus className="h-3 w-3" />
                        Create Team
                    </div>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
