import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { CreditCard, Plus, Trash2, Loader2 } from "lucide-react";
import { AddPaymentMethodModal } from "@/components/billing/AddPaymentMethodModal";
import { removePaymentMethod } from "@/lib/actions/agents";
import { toast } from "sonner"; // Or however we handle toasts, but I will stick to console/local state feedback if sonner not available globally

export function PaymentMethodCard({ isPro, cardLast4 }: { isPro?: boolean; cardLast4?: string }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);

    const handleRemoveCard = async () => {
        if (!confirm("Are you sure you want to remove your payment method? This will downgrade you to the free plan.")) return;

        setIsRemoving(true);
        try {
            await removePaymentMethod();
            // toast.success("Payment method removed");
        } catch (error) {
            console.error(error);
            // toast.error("Failed to remove payment method");
        } finally {
            setIsRemoving(false);
        }
    };

    if (!isPro) {
        return (
            <>
                <Card className="rounded-xl border border-slate-100 shadow-sm bg-white h-full dark:bg-slate-900 dark:border-slate-800">
                    <CardContent className="p-6 flex flex-col justify-between h-full items-center text-center">
                        <div className="flex flex-col items-center pt-4">
                            <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center mb-3 dark:bg-slate-800">
                                <CreditCard className="h-5 w-5 text-slate-400" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">No Payment Method</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Add a card to upgrade to Pro</p>
                        </div>

                        <div className="w-full pt-6">
                            <Button
                                variant="outline"
                                className="w-full border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400 transition-colors dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                onClick={() => setIsModalOpen(true)}
                            >
                                <Plus className="h-3.5 w-3.5 mr-2" /> Add Payment Method
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                <AddPaymentMethodModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
            </>
        );
    }

    return (
        <Card className="rounded-xl border border-slate-100 shadow-sm bg-white h-full dark:bg-slate-900 dark:border-slate-800">
            <CardContent className="p-6 flex flex-col justify-between h-full">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-6">Payment Method</h3>
                    <div className="flex items-center justify-between mb-6">
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Current Default</p>
                    </div>

                    <div className="border border-slate-200 rounded-md w-14 h-9 flex items-center justify-center mb-4 bg-white">
                        {/* Mock Visa Logo Style */}
                        <span className="text-blue-800 font-extrabold italic text-sm">VISA</span>
                    </div>

                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                        Visa ****** {cardLast4 || '4242'}
                    </div>
                    <div className="text-xs text-slate-400 font-medium">
                        Expires 08/27
                    </div>
                </div>

                <div className="flex justify-end mt-4">
                    <Button
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-9 px-4 rounded-lg transition-colors"
                        onClick={handleRemoveCard}
                        disabled={isRemoving}
                    >
                        {isRemoving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Trash2 className="h-4 w-4 mr-2" /> Remove</>}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
