"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Settings, Save } from "lucide-react";
import { updateAgentSettings } from "@/lib/actions/agents";
import { useRouter } from "next/navigation";

interface AgentSettingsModalProps {
    agent: any;
    isOpen: boolean;
    onClose: () => void;
}

export function AgentSettingsModal({ agent, isOpen, onClose }: AgentSettingsModalProps) {
    const router = useRouter();
    const settings = agent.settings || {};

    // Local state for form fields
    const [name, setName] = useState(agent.name);
    const [description, setDescription] = useState(settings.description || "");
    const [tone, setTone] = useState(settings.tone || "");
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Note: Update logic needs to handle name update separately if "settings" column doesn't include it. 
            // In a real app we'd update top-level columns too. 
            // For now, let's assume we update settings. 
            // If name is top-level, we'd need a separate action or update the action to handle both.
            // Let's stick to updating 'settings' for now as per `updateAgentSettings` implementation.

            const result = await updateAgentSettings(agent.id, {
                description,
                tone
                // name update would require logic change in action, let's keep it simple or assume action handles it if updated.
                // Re-reading `updateAgentSettings`: it ONLY updates `settings` column.
                // So updating Name won't work with that action alone. 
                // We'll skip name update for this iteration or update the action.
                // Let's implement Description and Tone updates.
            });

            if (result.success) {
                router.refresh();
                onClose();
            } else {
                alert("Failed to update settings");
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
            title="Agent Settings"
            className="sm:max-w-lg"
        >
            <form onSubmit={handleSave} className="space-y-4 py-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Name</label>
                    <input
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                        value={name}
                        disabled // Disabled name update for now as per action limitation
                        title="Name updates coming soon"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe what this agent does..."
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Tone / Instructions</label>
                    <textarea
                        className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={tone}
                        onChange={(e) => setTone(e.target.value)}
                        placeholder="E.g. Be professional, concise, and helpful."
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" type="button" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        <Save className="w-4 h-4 mr-2" />
                        {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

// Wrapper component to manage modal state
export function AgentSettingsButton({ agent }: { agent: any }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
                <Settings className="w-4 h-4 mr-2" /> Settings
            </Button>
            <AgentSettingsModal
                agent={agent}
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            />
        </>
    );
}
