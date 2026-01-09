"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface SecurityAccessCardProps {
    email: string;
}

export function SecurityAccessCard({ email }: SecurityAccessCardProps) {
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);

    const handleUpdatePassword = async () => {
        if (!password) return;
        if (password !== confirm) {
            toast.error("Passwords do not match");
            return;
        }
        if (password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        const supabase = createClient();
        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
            toast.error(error.message);
        } else {
            toast.success("Password updated successfully");
            setPassword("");
            setConfirm("");
        }
        setLoading(false);
    };

    return (
        <Card className="rounded-xl border border-slate-100 shadow-sm bg-white overflow-hidden dark:bg-slate-900 dark:border-slate-800">
            <CardContent className="p-8">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6">Security & Access</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-900 dark:text-slate-200">Email Address</label>
                        <Input
                            value={email}
                            disabled
                            className="bg-slate-50 border-transparent transition-colors h-10 text-sm font-medium text-slate-500 cursor-not-allowed dark:bg-slate-950 dark:border-slate-800"
                        />
                    </div>
                </div>

                <div className="border-t border-slate-50 pt-8 dark:border-slate-800">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Change Password</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-900 dark:text-slate-200">New Password</label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-slate-50 border-transparent focus:bg-white focus:border-blue-600 transition-colors h-10 text-sm font-medium text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 dark:focus:border-blue-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-900 dark:text-slate-200">Confirm Password</label>
                            <Input
                                type="password"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                className="bg-slate-50 border-transparent focus:bg-white focus:border-blue-600 transition-colors h-10 text-sm font-medium text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 dark:focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button
                            onClick={handleUpdatePassword}
                            disabled={loading || !password}
                            className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                        >
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Update Password
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
