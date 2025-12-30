"use client";

import { ProfileInfoSection } from "@/components/profile/ProfileInfoSection";
import { PreferencesSection } from "@/components/profile/PreferencesSection";
import { Button } from "@/components/ui/Button";

export default function ProfilePage() {
    return (
        <div className="space-y-8 pt-2 pb-10 animate-in fade-in duration-500 max-w-4xl">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Profile & Preferences</h1>
                <p className="text-muted-foreground">Manage your personal account settings.</p>
            </div>

            <div className="bg-card rounded-xl border border-border/50 shadow-sm p-8">
                <ProfileInfoSection />

                <div className="h-px bg-border/50 my-10" />

                <PreferencesSection />

                <div className="h-px bg-border/50 my-10" />

                <div className="">
                    <Button variant="outline" className="border-red-500/20 text-red-600 hover:bg-red-500/10 hover:text-red-700 font-bold h-10 px-6 rounded-lg transition-colors">
                        Delete My Account
                    </Button>
                </div>
            </div>
        </div>
    );
}
