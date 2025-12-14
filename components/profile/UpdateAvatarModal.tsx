"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface UpdateAvatarModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function UpdateAvatarModal({ isOpen, onClose }: UpdateAvatarModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Update Avatar">
            <div className="flex flex-col items-center justify-center space-y-6 py-4">
                <div className="h-32 w-32 rounded-full border-4 border-slate-100 overflow-hidden relative">
                    <img
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=John"
                        alt="Profile"
                        className="h-full w-full object-cover"
                    />
                </div>

                <Button variant="outline" className="border-slate-200 text-slate-900 font-bold h-10 px-6 rounded-lg hover:bg-slate-50 transition-colors">
                    Upload
                </Button>

                <div className="flex w-full items-center justify-between pt-4 border-t border-slate-50">
                    <button onClick={onClose} className="text-sm font-bold text-slate-900 hover:underline">
                        Remove
                    </button>
                    <button onClick={onClose} className="text-sm font-bold text-blue-600 hover:underline">
                        Cancel
                    </button>
                </div>
            </div>
        </Modal>
    );
}
