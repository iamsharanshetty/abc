"use client";

import { Card, CardContent } from "@/components/ui/Card";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Domain {
    id: string;
    domain: string;
    status: "Active";
    addedOn: string;
}

const DOMAINS: Domain[] = [
    { id: "1", domain: "acmeinc.com", status: "Active", addedOn: "Dec1 2026" },
    { id: "2", domain: "acmeinc.com", status: "Active", addedOn: "Dec1 2026" },
    { id: "3", domain: "acmeinc.com", status: "Active", addedOn: "Dec1 2026" },
];

export function AllowedDomainsCard() {
    return (
        <Card className="rounded-xl border border-slate-100 shadow-sm bg-white overflow-hidden dark:bg-slate-900 dark:border-slate-800">
            <CardContent className="p-8">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-6">Allowed Domain</h3>

                <div className="w-full">
                    <table className="w-full">
                        <thead>
                            <tr>
                                <th className="text-left text-xs font-bold text-slate-900 dark:text-slate-200 pb-4 w-[40%]">Domain</th>
                                <th className="text-left text-xs font-bold text-slate-900 dark:text-slate-200 pb-4 w-[30%]">Status</th>
                                <th className="text-right text-xs font-bold text-slate-900 dark:text-slate-200 pb-4 w-[30%]">Added On</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {DOMAINS.map((item) => (
                                <tr key={item.id}>
                                    <td className="py-3 text-xs font-medium text-slate-600 dark:text-slate-300">{item.domain}</td>
                                    <td className="py-3">
                                        <span className="bg-[#e6f4ea] text-[#137333] px-2 py-1 rounded-md text-[10px] font-bold dark:bg-green-500/10 dark:text-green-500">
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400">{item.addedOn}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="pt-4 mt-2">
                        <Link href="#" className="text-xs font-bold text-blue-600 hover:underline dark:text-blue-400">
                            + Add Domain
                        </Link>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
