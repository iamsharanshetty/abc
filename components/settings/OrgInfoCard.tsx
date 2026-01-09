"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { updateSettings } from "@/lib/actions/settings";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface OrgInfoCardProps {
    initialName: string;
    initialWebsite: string;
    initialLogo?: string;
}

export function OrgInfoCard({ initialName, initialWebsite, initialLogo }: OrgInfoCardProps) {
    const [orgName, setOrgName] = useState(initialName);
    const [website, setWebsite] = useState(initialWebsite);
    const [logoUrl, setLogoUrl] = useState(initialLogo);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync state with props on re-validation
    useEffect(() => {
        setOrgName(initialName);
        setWebsite(initialWebsite);
        if (initialLogo) setLogoUrl(initialLogo);
    }, [initialName, initialWebsite, initialLogo]);

    const handleSave = async () => {
        setSaving(true);
        const res = await updateSettings({
            org_name: orgName,
            org_website: website,
            org_logo: logoUrl
        });

        if (res.success) {
            toast.success("Organization settings updated");
        } else {
            toast.error("Failed to update settings");
        }
        setSaving(false);
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            toast.error("File size must be less than 2MB");
            return;
        }

        setUploading(true);
        try {
            const supabase = createClient();
            const fileExt = file.name.split('.').pop();
            const fileName = `org-logo-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            setLogoUrl(data.publicUrl);
            toast.success("Logo uploaded successfully. Don't forget to save!");
        } catch (error: any) {
            console.error("Upload error:", error);
            toast.error("Failed to upload logo: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <Card className="rounded-xl border border-slate-100 shadow-sm bg-white overflow-hidden dark:bg-slate-900 dark:border-slate-800">
            <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Organization Info</h3>
                    <Button onClick={handleSave} disabled={saving} size="sm">
                        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save Changes
                    </Button>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Side: Inputs */}
                    <div className="flex-1 space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-900 dark:text-slate-200">Organization Name</label>
                            <Input
                                value={orgName}
                                onChange={(e) => setOrgName(e.target.value)}
                                className="bg-slate-50 border-transparent focus:bg-white focus:border-blue-600 transition-colors h-10 text-sm font-medium text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 dark:focus:border-blue-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-900 dark:text-slate-200">Default Website</label>
                            <Input
                                value={website}
                                onChange={(e) => setWebsite(e.target.value)}
                                className="bg-slate-50 border-transparent focus:bg-white focus:border-blue-600 transition-colors h-10 text-sm font-medium text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 dark:focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Right Side: Upload */}
                    <div className="w-full lg:w-[320px] flex-shrink-0">
                        <div className="bg-white border-2 border-slate-50 rounded-lg overflow-hidden flex flex-col items-center dark:bg-slate-950 dark:border-slate-800 relative group">
                            <div className="h-[120px] w-full flex items-center justify-center bg-white dark:bg-slate-900 overflow-hidden relative">
                                {logoUrl ? (
                                    <img
                                        src={logoUrl}
                                        alt="Org Logo"
                                        className="w-full h-full object-contain p-2"
                                    />
                                ) : (
                                    <span className="text-slate-400 text-sm font-medium">320 × 120</span>
                                )}
                            </div>

                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />

                            <Button
                                variant="ghost"
                                onClick={handleUploadClick}
                                disabled={uploading}
                                className="w-full bg-slate-50 hover:bg-slate-100 text-blue-600 font-bold h-10 rounded-none transition-colors dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-blue-400"
                            >
                                {uploading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4 mr-2" />
                                        Upload Logo
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
