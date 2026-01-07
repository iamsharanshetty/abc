// components/agents/FilterBar.tsx
"use client";

import { Search, ChevronDown, Filter } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FilterBarProps {
  onSearchChange?: (value: string) => void;
  onStatusChange?: (value: string) => void;
  onTypeChange?: (value: string) => void;
}

export function FilterBar({
  onSearchChange,
  onStatusChange,
  onTypeChange,
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
        {/* Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-10 px-4 bg-card border-border/50 text-xs font-bold text-muted-foreground hover:bg-secondary hover:text-foreground uppercase tracking-wide gap-2 rounded-lg transition-colors"
            >
              <Filter className="h-3.5 w-3.5" />
              Status
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => onStatusChange?.("all")}
            >
              All Status
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => onStatusChange?.("running")}
            >
              Running
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => onStatusChange?.("paused")}
            >
              Paused
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Type Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-10 px-4 bg-card border-border/50 text-xs font-bold text-muted-foreground hover:bg-secondary hover:text-foreground uppercase tracking-wide gap-2 rounded-lg transition-colors"
            >
              <Filter className="h-3.5 w-3.5" />
              Type
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => onTypeChange?.("all")}
            >
              All Types
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => onTypeChange?.("support agent")}
            >
              Support Agent
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => onTypeChange?.("sales")}
            >
              Sales
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => onTypeChange?.("faq")}
            >
              FAQ
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => onTypeChange?.("custom")}
            >
              Custom
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
