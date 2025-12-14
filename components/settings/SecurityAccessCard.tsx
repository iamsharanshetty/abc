"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Power } from "lucide-react";

export function SecurityAccessCard() {
    return (
        <Card className="rounded-xl border border-slate-100 shadow-sm bg-white overflow-hidden dark:bg-slate-900 dark:border-slate-800">
            <CardContent className="p-8">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-6">Security & Access</h3>

                <div className="flex items-center justify-between mb-8">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Two- Factor Authentication</span>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 flex items-center gap-1 dark:border-slate-700">
                            <Power className="h-3 w-3" /> OFF
                        </span>
                    </div>
                </div>

                <div>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 px-6 rounded-lg shadow-sm shadow-blue-200 transition-colors dark:shadow-blue-900">
                        Save Changes
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
