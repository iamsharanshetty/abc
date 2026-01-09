
import { getProfile } from "@/lib/actions/agents";
import RealtimeSettings from "@/components/settings/RealtimeSettings";

export default async function SettingsPage() {
    const profile = await getProfile();

    return (
        <div className="space-y-8 pt-2 pb-10 max-w-5xl animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Organization Settings</h1>
                <p className="text-muted-foreground mt-1">Manage global settings for your organization and agents.</p>
            </div>

            <RealtimeSettings initialProfile={profile} />
        </div>
    );
}
