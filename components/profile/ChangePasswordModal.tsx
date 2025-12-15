"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Change Password">
            <div className="space-y-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-900">Current password</label>
                        <Input type="password" className="bg-white border-slate-200 h-10" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-900">New password</label>
                        <Input type="password" className="bg-white border-slate-200 h-10" />
                    </div>
                </div>

                <div className="flex justify-end pt-2 gap-4">
                    <button onClick={onClose} className="text-xs font-bold text-slate-900 hover:text-slate-700">
                        Cancel
                    </button>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 px-4 rounded-lg transition-colors">
                        Save Changes
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
