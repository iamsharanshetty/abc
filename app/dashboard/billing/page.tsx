
import { getProfile } from "@/lib/actions/agents";
import RealtimeBilling from "@/components/billing/RealtimeBilling";

export default async function BillingPage() {
    const profile = await getProfile();

    return (
        <div className="space-y-8 pt-2 pb-10 animate-in fade-in duration-500">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Billing & Plans</h1>
                <p className="text-muted-foreground">Manage your subscription, payment methods, and view invoices.</p>
            </div>

            <RealtimeBilling initialProfile={profile} />
        </div>
    );
}
