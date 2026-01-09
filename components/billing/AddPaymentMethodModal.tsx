"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { CreditCard, Loader2, Lock } from "lucide-react";
import { addPaymentMethod } from "@/lib/actions/agents";

interface AddPaymentMethodModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AddPaymentMethodModal({ isOpen, onClose }: AddPaymentMethodModalProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const form = e.target as HTMLFormElement;
        const cardNumberInput = form.elements.namedItem('card-number') as HTMLInputElement;
        const cardNumber = cardNumberInput.value;
        const last4 = cardNumber.replace(/\s/g, '').slice(-4) || '4242';

        try {
            const result = await addPaymentMethod("tok_mock_visa", last4);
            if (result.success) {
                onClose();
            } else {
                console.error(result.error);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Add Payment Method"
        >
            <div className="mb-4 text-sm text-muted-foreground">
                Enter your card details to upgrade to the Pro plan.
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="card-number">Card Number</Label>
                    <div className="relative">
                        <CreditCard className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input id="card-number" placeholder="4242 4242 4242 4242" className="pl-9" required />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="expiry">Expiry</Label>
                        <Input id="expiry" placeholder="MM/YY" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="cvc">CVC</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input id="cvc" placeholder="123" className="pl-9" required />
                        </div>
                    </div>
                </div>

                <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-md flex items-center gap-2 dark:bg-slate-800 dark:text-slate-400">
                    <Lock className="h-3 w-3" />
                    Secured by Stripe (Test Mode)
                </div>

                <div className="flex justify-end gap-3 mt-4">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? "Adding..." : "Add Card & Upgrade"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
