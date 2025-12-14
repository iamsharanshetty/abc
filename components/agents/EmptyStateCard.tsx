"use client";

import { Bot } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import Link from "next/link";

export function EmptyStateCard() {
    return (
        <Card className="rounded-xl border border-slate-100 shadow-sm bg-white h-full min-h-[460px] flex flex-col justify-center items-center text-center p-8">
            <CardContent className="p-0 flex flex-col items-center max-w-[280px]">
                {/* Helper Bot Icon */}
                <div className="mb-6 relative">
                    <div className="h-20 w-20 bg-slate-900 rounded-3xl flex items-center justify-center shadow-xl shadow-slate-200">
                        <div className="absolute top-[28%] left-[25%] flex gap-3">
                            <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                            <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse delay-75" />
                        </div>
                        {/* Simple face construct since we don't have the exact asset */}
                        <div className="w-12 h-6 border-b-4 border-blue-400 rounded-b-full mt-4" />
                    </div>
                    {/* Chat bubble tail */}
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-slate-900 rounded-full" />
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-8 leading-tight">
                    You Haven&apos;t Created Any Agent Yet?
                </h3>

                <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                    Get Started by Creating Your First Webrep AI Agent
                </p>

                <Link href="/dashboard/create" className="w-full">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 rounded-lg shadow-lg shadow-blue-200 transition-all">
                        Create Your First Agent
                    </Button>
                </Link>
            </CardContent>
        </Card>
    );
}
