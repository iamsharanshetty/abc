"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function DefaultAgentSettingsCard() {
    return (
        <Card className="rounded-xl border border-slate-100 shadow-sm bg-white overflow-hidden dark:bg-slate-900 dark:border-slate-800">
            <CardContent className="p-8">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-6">Default Agent Setting</h3>

                {/* Toggle */}
                <div className="flex items-center justify-between mb-8">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Two- Factor Authentication</span>
                    <div className="w-11 h-6 bg-slate-200 rounded-full relative cursor-pointer shadow-inner dark:bg-slate-700">
                        <div className="absolute top-1 left-1 bg-white h-4 w-4 rounded-full shadow-sm" />
                    </div>
                </div>

                <div className="h-px bg-slate-50 w-full mb-8 dark:bg-slate-800" />

                <div className="space-y-6">
                    {/* Default Domains / Tags */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200">Default Domains</h4>
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-500 mr-2 dark:text-slate-400">Persona</span>
                            <span className="px-4 py-1.5 rounded-full border border-blue-200 text-blue-600 text-xs font-bold bg-blue-50/50 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-900">
                                Friendly
                            </span>
                            <span className="px-4 py-1.5 rounded-full border border-slate-200 text-slate-600 text-xs font-bold bg-white dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700">
                                Professional
                            </span>
                            <span className="px-4 py-1.5 rounded-full border border-slate-200 text-slate-600 text-xs font-bold bg-white dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700">
                                Playful
                            </span>
                        </div>
                    </div>

                    {/* Default Team */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200">Default Team</h4>
                        <div className="flex items-center gap-4">
                            <span className="text-xs font-bold text-slate-500 w-[80px] dark:text-slate-400">Default: Team</span>
                            <div className="flex-1 relative">
                                <div className="w-full h-10 border border-slate-200 rounded-lg flex items-center justify-between px-3 bg-white text-xs font-medium text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200">
                                    Customer Services
                                    <ChevronDown className="h-4 w-4 text-slate-400" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
