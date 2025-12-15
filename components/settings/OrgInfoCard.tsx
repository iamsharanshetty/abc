"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export function OrgInfoCard() {
    return (
        <Card className="rounded-xl border border-slate-100 shadow-sm bg-white overflow-hidden dark:bg-slate-900 dark:border-slate-800">
            <CardContent className="p-8">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6">Organization Info</h3>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Side: Inputs */}
                    <div className="flex-1 space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-900 dark:text-slate-200">Organization Name</label>
                            <Input
                                defaultValue="Acme Inc."
                                className="bg-slate-50 border-transparent focus:bg-white focus:border-blue-600 transition-colors h-10 text-sm font-medium text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 dark:focus:border-blue-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-900 dark:text-slate-200">Default Website</label>
                            <Input
                                defaultValue="https://acmeinc.com"
                                className="bg-slate-50 border-transparent focus:bg-white focus:border-blue-600 transition-colors h-10 text-sm font-medium text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 dark:focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Right Side: Upload */}
                    <div className="w-full lg:w-[320px] flex-shrink-0">
                        <div className="bg-white border-2 border-slate-50 rounded-lg overflow-hidden flex flex-col items-center dark:bg-slate-950 dark:border-slate-800">
                            <div className="h-[120px] w-full flex items-center justify-center bg-white dark:bg-slate-900">
                                <span className="text-slate-400 text-sm font-medium">320 × 120</span>
                            </div>
                            <Button variant="ghost" className="w-full bg-slate-50 hover:bg-slate-100 text-blue-600 font-bold h-10 rounded-none transition-colors dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-blue-400">
                                Upload
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
