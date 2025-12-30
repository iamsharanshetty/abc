"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { UpdateAvatarModal } from "@/components/profile/UpdateAvatarModal";
import { ChangePasswordModal } from "@/components/profile/ChangePasswordModal";
import { Loader2, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/Select";

interface ProfileData {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    domain_occupation: string | null;
    onboarding_answers: { question_id: string; answer: string }[] | null;
}

export function ProfileInfoSection() {
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<ProfileData | null>(null);

    const supabase = createClient();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                setUser(user);

                if (user) {
                    const { data } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .single();
                    setProfile(data as ProfileData);
                }
            } catch (error) {
                console.error("Error fetching profile", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleSave = async () => {
        if (!user || !profile) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: profile.full_name,
                    domain_occupation: profile.domain_occupation,
                    onboarding_answers: profile.onboarding_answers
                })
                .eq('id', user.id);

            if (error) throw error;
            toast.success("Profile updated successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    // Helper to update specific onboarding answer
    const updateOnboardingAnswer = (questionId: string, newValue: string) => {
        if (!profile) return;
        const currentAnswers = profile.onboarding_answers || [];
        const exists = currentAnswers.find(a => a.question_id === questionId);

        let newAnswers;
        if (exists) {
            newAnswers = currentAnswers.map(a =>
                a.question_id === questionId ? { ...a, answer: newValue } : a
            );
        } else {
            newAnswers = [...currentAnswers, { question_id: questionId, answer: newValue }];
        }
        setProfile({ ...profile, onboarding_answers: newAnswers });
    };

    const getAnswer = (qid: string) => {
        return profile?.onboarding_answers?.find(a => a.question_id === qid)?.answer || '';
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div>;
    }

    return (
        <>
            <div className="flex flex-col md:flex-row gap-8">
                {/* Left Side: Photo & Actions */}
                <div className="w-full md:w-[240px] flex-shrink-0">
                    <h3 className="text-sm font-bold text-foreground mb-6">Profile Info</h3>

                    <div className="flex flex-col items-start">
                        <div className="h-32 w-32 rounded-full border-4 border-border overflow-hidden mb-6 relative">
                            {/* Placeholder/Avatar */}
                            <img
                                src={profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.full_name || user?.email}`}
                                alt="Profile"
                                className="h-full w-full object-cover"
                            />
                        </div>

                        <Button
                            variant="outline"
                            className="w-[100px] border-border text-foreground font-bold h-9 bg-card hover:bg-secondary mb-3 rounded-lg text-xs"
                            onClick={() => setIsAvatarModalOpen(true)}
                        >
                            Change
                        </Button>

                        <div className="space-y-4 mt-6">
                            <h3 className="text-sm font-bold text-foreground">Login & Security</h3>
                            <button
                                className="text-xs font-bold text-blue-600 hover:underline dark:text-blue-400"
                                onClick={() => setIsPasswordModalOpen(true)}
                            >
                                Change Password
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="flex-1 max-w-2xl space-y-8">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Basic Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-foreground">Full Name</label>
                                <Input
                                    value={profile?.full_name || ''}
                                    onChange={(e) => setProfile(prev => prev ? { ...prev, full_name: e.target.value } : null)}
                                    className="bg-background border-border"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-foreground">Email</label>
                                <Input
                                    value={user?.email || ''}
                                    disabled
                                    className="bg-muted/50 border-border text-muted-foreground"
                                />
                            </div>
                        </div>

                        <div className="space-y-2 max-w-[calc(50%-12px)]">
                            <label className="text-xs font-bold text-foreground">Role / Occupation</label>
                            <Input
                                value={profile?.domain_occupation || ''}
                                onChange={(e) => setProfile(prev => prev ? { ...prev, domain_occupation: e.target.value } : null)}
                                className="bg-background border-border"
                            />
                        </div>
                    </div>

                    {/* Onboarding Answers Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Onboarding Details</h4>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-foreground">Main Goal</label>
                                <Input
                                    value={getAnswer('goal')}
                                    onChange={(e) => updateOnboardingAnswer('goal', e.target.value)}
                                    placeholder="Not answered"
                                    className="bg-background border-border"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-foreground">Project Idea / Reason</label>
                                <Input
                                    value={getAnswer('reason')}
                                    onChange={(e) => updateOnboardingAnswer('reason', e.target.value)}
                                    placeholder="Not answered"
                                    className="bg-background border-border"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-foreground">Specific Requirements</label>
                                <Textarea
                                    value={getAnswer('requirements')}
                                    onChange={(e) => updateOnboardingAnswer('requirements', e.target.value)}
                                    placeholder="Not answered"
                                    className="bg-background border-border min-h-[100px]"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                        </Button>
                    </div>
                </div>
            </div>

            <UpdateAvatarModal isOpen={isAvatarModalOpen} onClose={() => setIsAvatarModalOpen(false)} />
            <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
        </>
    );
}
