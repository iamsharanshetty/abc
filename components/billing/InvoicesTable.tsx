"use client";

import { Button } from "@/components/ui/Button";
import { Download, FileText } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Invoice {
    id: string;
    invoiceId: string;
    date: string;
    status: "Paid" | "Pending";
    amount: string;
    plan: string;
}

const INVOICES: Invoice[] = [
    {
        id: "1",
        invoiceId: "Invoice #012 - Dec 2026",
        date: "Dec1 2026",
        status: "Paid",
        amount: "$0.00",
        plan: "Pro Plan",
    },
    {
        id: "2",
        invoiceId: "Invoice #012 - Dec 2026",
        date: "Dec1 2026",
        status: "Paid",
        amount: "$0.00",
        plan: "Pro Plan",
    },
    {
        id: "3",
        invoiceId: "Invoice #012 - Dec 2026",
        date: "Dec1 2026",
        status: "Paid",
        amount: "$0.00",
        plan: "Pro Plan",
    },
];

export function InvoicesTable() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">Invoices</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Access all your previous invoices</p>
                </div>
                <Button variant="outline" size="sm" className="h-9 gap-2 text-xs font-bold text-slate-600 border-slate-200 dark:text-slate-300 dark:border-slate-700 dark:bg-slate-800">
                    <Download className="h-3.5 w-3.5" />
                    Download All
                </Button>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
                <table className="w-full">
                    <thead className="bg-[#fafafa] dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                        <tr>
                            <th className="text-left py-4 px-6 text-xs font-bold text-slate-900 dark:text-slate-200 w-[35%]">Invoice</th>
                            <th className="text-left py-4 px-6 text-xs font-bold text-slate-900 dark:text-slate-200 w-[15%]">Date</th>
                            <th className="text-left py-4 px-6 text-xs font-bold text-slate-900 dark:text-slate-200 w-[15%]">Status</th>
                            <th className="text-left py-4 px-6 text-xs font-bold text-slate-900 dark:text-slate-200 w-[15%]">Amount</th>
                            <th className="text-left py-4 px-6 text-xs font-bold text-slate-900 dark:text-slate-200 w-[15%]">Plan</th>
                            <th className="text-right py-4 px-6 text-xs font-bold text-slate-900 dark:text-slate-200 w-[5%]"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {INVOICES.map((invoice) => (
                            <tr key={invoice.id} className="border-b border-slate-50 last:border-none hover:bg-slate-50/50 transition-colors dark:border-slate-800 dark:hover:bg-slate-800">
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-red-50 p-1.5 rounded-md dark:bg-red-500/10">
                                            <FileText className="h-3.5 w-3.5 text-red-500" />
                                        </div>
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{invoice.invoiceId}</span>
                                    </div>
                                </td>
                                <td className="py-4 px-6 text-xs font-bold text-slate-500">{invoice.date}</td>
                                <td className="py-4 px-6">
                                    <span className="bg-green-50 text-green-600 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide dark:bg-green-500/10 dark:text-green-500">
                                        {invoice.status}
                                    </span>
                                </td>
                                <td className="py-4 px-6 text-xs font-bold text-slate-500">{invoice.amount}</td>
                                <td className="py-4 px-6 text-xs font-bold text-slate-500">{invoice.plan}</td>
                                <td className="py-4 px-6 text-right">
                                    <Link href="#" className="text-xs font-bold text-blue-600 hover:underline dark:text-blue-400">
                                        Download
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
