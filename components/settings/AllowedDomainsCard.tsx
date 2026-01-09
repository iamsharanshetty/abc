"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { updateSettings } from "@/lib/actions/settings";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/Input";

interface AllowedDomainsCardProps {
    initialDomains: string[];
}

export function AllowedDomainsCard({ initialDomains }: AllowedDomainsCardProps) {
    const [domains, setDomains] = useState<string[]>(Array.isArray(initialDomains) ? initialDomains : []);
    const [newDomain, setNewDomain] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setDomains(Array.isArray(initialDomains) ? initialDomains : []);
    }, [initialDomains]);

    const handleAddDomain = async () => {
        if (!newDomain) return;
        setSaving(true);

        const updatedDomains = [...domains, newDomain];
        const res = await updateSettings({ allowed_domains: updatedDomains });

        if (res.success) {
            setDomains(updatedDomains);
            toast.success("Domain added");
            setNewDomain("");
            setIsDialogOpen(false);
        } else {
            toast.error("Failed to add domain");
        }
        setSaving(false);
    };

    const handleRemoveDomain = async (domainToRemove: string) => {
        if (!confirm(`Are you sure you want to remove ${domainToRemove}?`)) return;

        const updatedDomains = domains.filter(d => d !== domainToRemove);
        // Optimistic update
        setDomains(updatedDomains);

        const res = await updateSettings({ allowed_domains: updatedDomains });
        if (!res.success) {
            toast.error("Failed to remove domain");
            // Revert
            setDomains(domains);
        } else {
            toast.success("Domain removed");
        }
    };

    return (
        <Card className="rounded-xl border border-slate-100 shadow-sm bg-white overflow-hidden dark:bg-slate-900 dark:border-slate-800">
            <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Allowed Domains</h3>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 p-0 h-auto">
                                + Add Domain
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Allowed Domain</DialogTitle>
                                <DialogDescription>
                                    Enter the domain you want to whitelist for your agents.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <Input
                                    placeholder="example.com"
                                    value={newDomain}
                                    onChange={(e) => setNewDomain(e.target.value)}
                                />
                            </div>
                            <DialogFooter>
                                <Button onClick={handleAddDomain} disabled={saving}>
                                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Add Domain
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="w-full">
                    {domains.length === 0 ? (
                        <p className="text-sm text-slate-500 italic">No allowed domains configured.</p>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className="text-left text-xs font-bold text-slate-900 dark:text-slate-200 pb-4 w-[60%]">Domain</th>
                                    <th className="text-left text-xs font-bold text-slate-900 dark:text-slate-200 pb-4 w-[20%]">Status</th>
                                    <th className="text-right text-xs font-bold text-slate-900 dark:text-slate-200 pb-4 w-[20%]">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {domains.map((domain, i) => (
                                    <tr key={i}>
                                        <td className="py-3 text-xs font-medium text-slate-600 dark:text-slate-300">{domain}</td>
                                        <td className="py-3">
                                            <span className="bg-[#e6f4ea] text-[#137333] px-2 py-1 rounded-md text-[10px] font-bold dark:bg-green-500/10 dark:text-green-500">
                                                Active
                                            </span>
                                        </td>
                                        <td className="py-3 text-right">
                                            <button
                                                onClick={() => handleRemoveDomain(domain)}
                                                className="text-slate-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
