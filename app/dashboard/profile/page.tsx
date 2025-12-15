"use client";

import { ProfileInfoSection } from "@/components/profile/ProfileInfoSection";
import { PreferencesSection } from "@/components/profile/PreferencesSection";
import { Button } from "@/components/ui/Button";

export default function ProfilePage() {
    return (
        <div className="space-y-6 pt-2 pb-10">
            <h1 className="text-3xl font-bold text-blue-950 dark:text-white">Profile & Preferences</h1>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm p-8">
                <ProfileInfoSection />

                <div className="h-px bg-slate-100 dark:bg-slate-800 my-10" />

                <PreferencesSection />

                <div className="h-px bg-slate-100 dark:bg-slate-800 my-10" />

                <div className="">
                    <Button variant="outline" className="border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 font-bold h-10 px-6 rounded-lg transition-colors">
                        Delete My Account
                    </Button>
                </div>
            </div>
        </div>
    );
}
