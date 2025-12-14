"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

export function UsageSummaryCard() {
    return (
        <Card className="rounded-xl border border-slate-100 shadow-sm bg-white h-full dark:bg-slate-900 dark:border-slate-800">
            <CardContent className="p-6">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-6">Usage Summary</h3>

                <div className="space-y-6">
                    {/* Agents Used */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-900 dark:text-slate-200">Agents Used</span>
                            <span className="text-slate-500 dark:text-slate-400">3/5 Agents</span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 w-[60%] rounded-full" />
                        </div>
                    </div>

                    {/* Conversations */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-900 dark:text-slate-200">Conversations</span>
                            <span className="text-slate-500 dark:text-slate-400">3500/10000 per Month</span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 w-[35%] rounded-full" />
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-9 px-6 rounded-lg transition-colors dark:bg-slate-700 dark:hover:bg-slate-600">
                            Upgrade
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
