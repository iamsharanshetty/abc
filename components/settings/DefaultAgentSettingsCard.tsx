"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateSettings } from "@/lib/actions/settings";
import { toast } from "sonner";
import { Switch } from "@/components/ui/Switch";

interface DefaultAgentSettingsProps {
    initialSettings: {
        require_approval?: boolean;
        persona?: string;
        team?: string;
    };
}

export function DefaultAgentSettingsCard({ initialSettings }: DefaultAgentSettingsProps) {
    const [settings, setSettings] = useState(initialSettings);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setSettings(initialSettings);
    }, [initialSettings]);

    const handleUpdate = async (newValues: any) => {
        const updated = { ...settings, ...newValues };
        setSettings(updated);

        // Debounce or immediate save? Immediate for settings usually fine or small debounce
        // For buttons/toggles, immediate is good.
        setSaving(true);
        const res = await updateSettings({ default_agent_settings: updated });
        if (res.success) {
            toast.success("Settings updated");
        } else {
            toast.error("Failed to update settings");
        }
        setSaving(false);
    };

    return (
        <Card className="rounded-xl border border-slate-100 shadow-sm bg-white overflow-hidden dark:bg-slate-900 dark:border-slate-800">
            <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Default Agent Setting</h3>
                    {saving && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                </div>

                {/* Toggle */}
                <div className="flex items-center justify-between mb-8">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Require Approval for Live</span>
                    <Switch
                        checked={settings.require_approval || false}
                        onCheckedChange={(checked) => handleUpdate({ require_approval: checked })}
                    />
                </div>

                <div className="h-px bg-slate-50 w-full mb-8 dark:bg-slate-800" />

                <div className="space-y-6">
                    {/* Default Domains / Tags */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200">Default Persona</h4>
                        <div className="flex items-center gap-3">
                            {["Friendly", "Professional", "Playful"].map((persona) => {
                                const isSelected = settings.persona === persona;
                                return (
                                    <button
                                        key={persona}
                                        onClick={() => handleUpdate({ persona })}
                                        className={cn(
                                            "px-4 py-1.5 rounded-full border text-xs font-bold transition-all",
                                            isSelected
                                                ? "border-blue-200 text-blue-600 bg-blue-50/50 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-900"
                                                : "border-slate-200 text-slate-600 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800"
                                        )}
                                    >
                                        {persona}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Default Team */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-200">Default Team</h4>
                        <div className="flex items-center gap-4">
                            <span className="text-xs font-bold text-slate-500 w-[80px] dark:text-slate-400">Default: Team</span>
                            <div className="flex-1 relative">
                                <div className="w-full h-10 border border-slate-200 rounded-lg flex items-center justify-between px-3 bg-white text-xs font-medium text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 opacity-50 cursor-not-allowed">
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
