"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
// We don't have a Visa icon handy in lucide, usually these are SVGs. I will make a simple text or box for now, or use CreditCard icon.
// Design shows a "VISA" logo box. I'll mock it with text style.
import { CreditCard } from "lucide-react";

export function PaymentMethodCard() {
    return (
        <Card className="rounded-xl border border-slate-100 shadow-sm bg-white h-full dark:bg-slate-900 dark:border-slate-800">
            <CardContent className="p-6 flex flex-col justify-between h-full">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-6">Payment Method</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-medium">Change how you pay for your plan</p>

                    <div className="border border-slate-200 rounded-md w-14 h-9 flex items-center justify-center mb-4 bg-white">
                        {/* Mock Visa Logo Style */}
                        <span className="text-blue-800 font-extrabold italic text-sm">VISA</span>
                    </div>

                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                        Visa ****** 4226
                    </div>
                    <div className="text-xs text-slate-400 font-medium">
                        Expires 08/27
                    </div>
                </div>

                <div className="flex justify-end mt-4">
                    <Button variant="outline" className="border-slate-200 text-slate-900 hover:bg-slate-50 font-bold h-9 px-6 rounded-lg transition-colors dark:border-slate-700 dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700">
                        Change
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
