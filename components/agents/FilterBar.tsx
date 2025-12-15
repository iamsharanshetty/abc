"use client";

import { Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";

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
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search Agent..."
                    className="w-full h-11 pl-10 pr-4 rounded-lg bg-gray-50 border-none text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    onChange={(e) => onSearchChange?.(e.target.value)}
                />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 w-full md:w-auto">
                <Button
                    variant="outline"
                    className="h-10 px-4 bg-gray-50 border-none text-xs font-bold text-slate-600 hover:bg-gray-100 hover:text-slate-900 uppercase tracking-wide gap-2"
                >
                    All Status
                    <ChevronDown className="h-3 w-3" />
                </Button>
                <Button
                    variant="outline"
                    className="h-10 px-4 bg-gray-50 border-none text-xs font-bold text-slate-600 hover:bg-gray-100 hover:text-slate-900 uppercase tracking-wide gap-2"
                >
                    All Type
                    <ChevronDown className="h-3 w-3" />
                </Button>
            </div>
        </div>
    );
}
