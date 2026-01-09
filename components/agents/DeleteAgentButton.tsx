"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Trash2 } from "lucide-react";
import { deleteAgent } from "@/lib/actions/agents";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";

export function DeleteAgentButton({ agentId, agentName }: { agentId: string, agentName: string }) {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        setIsDeleting(true);
        const result = await deleteAgent(agentId);

        if (result.success) {
            router.push("/dashboard");
            router.refresh();
        } else {
            alert("Failed to delete agent. Please try again.");
            setIsDeleting(false);
            setIsConfirmOpen(false);
        }
    };

    return (
        <>
            <Button
                variant="destructive"
                className="w-full"
                onClick={() => setIsConfirmOpen(true)}
            >
                Delete Agent
            </Button>

            <Modal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                title="Delete Agent"
                className="sm:max-w-md"
            >
                <div className="space-y-4 py-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Are you sure you want to delete <strong>{agentName}</strong>? This action cannot be undone.
                        All history and analytics for this agent will be permanently removed.
                    </p>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isDeleting ? "Deleting..." : "Confirm Delete"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
