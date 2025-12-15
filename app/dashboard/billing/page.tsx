"use client";

import { CurrentPlanCard } from "@/components/billing/CurrentPlanCard";
import { UsageSummaryCard } from "@/components/billing/UsageSummaryCard";
import { PaymentMethodCard } from "@/components/billing/PaymentMethodCard";
import { InvoicesTable } from "@/components/billing/InvoicesTable";

export default function BillingPage() {
    return (
        <div className="space-y-8 pt-2 pb-10">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Current Plan</h1>

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
