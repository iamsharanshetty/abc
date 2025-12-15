"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/Switch";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/Select";

export function PreferencesSection() {
    const [theme, setTheme] = useState<"light" | "dark" | "system">("light");
    const [notifications, setNotifications] = useState({
        billing: true,
        performance: true,
        updates: true
    });

    const toggleNotification = (key: keyof typeof notifications) => {
        setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    }

    return (
        <div className="mt-12">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-6">Preferences</h3>

            {/* Timezone & Theme */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-900 dark:text-slate-200">Timezone</label>
                    <Select defaultValue="utc">
                        <SelectTrigger className="w-full h-10 border-slate-200 text-slate-700 font-medium">
                            <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="utc">UTC</SelectItem>
                            <SelectItem value="est">EST (UTC-5)</SelectItem>
                            <SelectItem value="pst">PST (UTC-8)</SelectItem>
                            <SelectItem value="ist">IST (UTC+5:30)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-900 dark:text-slate-200">Theme</label>
                    <div className="flex items-center gap-6 h-10">
                        <label className="flex items-center gap-2 cursor-pointer" onClick={() => setTheme("light")}>
                            <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center transition-colors dark:bg-slate-950", theme === "light" ? "border-blue-600" : "border-slate-300 dark:border-slate-600")}>
                                {theme === "light" && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                            </div>
                            <span className={cn("text-sm font-medium transition-colors", theme === "light" ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-400")}>Light</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer" onClick={() => setTheme("dark")}>
                            <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center transition-colors dark:bg-slate-950", theme === "dark" ? "border-blue-600" : "border-slate-300 dark:border-slate-600")}>
                                {theme === "dark" && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                            </div>
                            <span className={cn("text-sm font-medium transition-colors", theme === "dark" ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-400")}>Dark</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer" onClick={() => setTheme("system")}>
                            <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center transition-colors dark:bg-slate-950", theme === "system" ? "border-blue-600" : "border-slate-300 dark:border-slate-600")}>
                                {theme === "system" && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                            </div>
                            <span className={cn("text-sm font-medium transition-colors", theme === "system" ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-400")}>System</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Toggles */}
            <div className="space-y-6">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Preferences</h4>

                <div className="space-y-4">
                    <div className="flex items-center justify-between max-w-xl">
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-600 rounded-full p-0.5">
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Billing Notifications</span>
                        </div>
                        <Switch checked={notifications.billing} onCheckedChange={() => toggleNotification('billing')} />
                    </div>

                    <div className="flex items-center justify-between max-w-xl">
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-600 rounded-full p-0.5">
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Agent Performance Report via email</span>
                        </div>
                        <Switch checked={notifications.performance} onCheckedChange={() => toggleNotification('performance')} />
                    </div>

                    <div className="flex items-center justify-between max-w-xl">
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-600 rounded-full p-0.5">
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Product updates & Announcements</span>
                        </div>
                        <Switch checked={notifications.updates} onCheckedChange={() => toggleNotification('updates')} />
                    </div>
                </div>
            </div>

        </div>
    );
}
