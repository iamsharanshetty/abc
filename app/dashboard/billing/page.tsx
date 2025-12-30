"use client";

import { CurrentPlanCard } from "@/components/billing/CurrentPlanCard";
import { UsageSummaryCard } from "@/components/billing/UsageSummaryCard";
import { PaymentMethodCard } from "@/components/billing/PaymentMethodCard";
import { InvoicesTable } from "@/components/billing/InvoicesTable";

export default function BillingPage() {
    return (
        <div className="space-y-8 pt-2 pb-10 animate-in fade-in duration-500">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Billing & Plans</h1>
                <p className="text-muted-foreground">Manage your subscription, payment methods, and view invoices.</p>
            </div>

            {/* Current Plan Card */}
            <CurrentPlanCard />

            {/* Split Row: Usage & Payment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <UsageSummaryCard />
                <PaymentMethodCard />
            </div>

            {/* Invoices Section */}
            <InvoicesTable />
        </div>
    );
}
