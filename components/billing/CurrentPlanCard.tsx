"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

export function CurrentPlanCard() {
    return (
        <Card className="rounded-xl border border-slate-100 shadow-sm bg-white overflow-hidden dark:bg-slate-900 dark:border-slate-800">
            <CardContent className="p-8 relative">
                <div className="absolute top-8 right-8 bg-slate-50 text-slate-500 text-xs font-bold px-3 py-1.5 rounded-md dark:bg-slate-800 dark:text-slate-400">
                    7 Days Left
                </div>

                <div className="mb-8">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Pro Plan</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Full Access to Webrep AI Agents, Analytics and team features</p>
                </div>

                <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">
                        $49<span className="text-lg text-slate-400 font-medium">/month</span>
                    </div>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 px-6 rounded-lg shadow-sm shadow-blue-200 dark:shadow-blue-900 transition-colors">
                        Change Plan
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
