"use client";

import { Search, ChevronDown, Filter } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

interface FilterBarProps {
    onSearchChange?: (value: string) => void;
    onStatusChange?: (value: string) => void;
    onTypeChange?: (value: string) => void;
    statusFilter?: string;
    typeFilter?: string;
}

export function FilterBar({
    onSearchChange,
    onStatusChange,
    onTypeChange,
    statusFilter,
    typeFilter
}: FilterBarProps) {
    return (
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
            {/* Search Bar */}
            <div className="relative w-full md:w-[400px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search agents by name..."
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                    onChange={(e) => onSearchChange?.(e.target.value)}
                />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 w-full md:w-auto">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            className="h-10 px-4 bg-card border-border/50 text-xs font-bold text-muted-foreground hover:bg-secondary hover:text-foreground uppercase tracking-wide gap-2 rounded-lg transition-colors"
                        >
                            <Filter className="h-3.5 w-3.5" />
                            {statusFilter || "Status"}
                            <ChevronDown className="h-3 w-3 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[180px]">
                        <DropdownMenuCheckboxItem
                            checked={statusFilter === undefined}
                            onCheckedChange={() => onStatusChange?.("")}
                        >
                            All Statuses
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem
                            checked={statusFilter === "Running"}
                            onCheckedChange={() => onStatusChange?.("Running")}
                        >
                            Running
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                            checked={statusFilter === "Paused"}
                            onCheckedChange={() => onStatusChange?.("Paused")}
                        >
                            Paused
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                            checked={statusFilter === "Draft"}
                            onCheckedChange={() => onStatusChange?.("Draft")}
                        >
                            Draft
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                            checked={statusFilter === "Archived"}
                            onCheckedChange={() => onStatusChange?.("Archived")}
                        >
                            Archived
                        </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            className="h-10 px-4 bg-card border-border/50 text-xs font-bold text-muted-foreground hover:bg-secondary hover:text-foreground uppercase tracking-wide gap-2 rounded-lg transition-colors"
                        >
                            <Filter className="h-3.5 w-3.5" />
                            {typeFilter || "Type"}
                            <ChevronDown className="h-3 w-3 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[180px]">
                        <DropdownMenuCheckboxItem
                            checked={typeFilter === undefined}
                            onCheckedChange={() => onTypeChange?.("")}
                        >
                            All Types
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem
                            checked={typeFilter === "support"}
                            onCheckedChange={() => onTypeChange?.("support")}
                        >
                            Support
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                            checked={typeFilter === "sales"}
                            onCheckedChange={() => onTypeChange?.("sales")}
                        >
                            Sales
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                            checked={typeFilter === "assistant"}
                            onCheckedChange={() => onTypeChange?.("assistant")}
                        >
                            Assistant
                        </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
