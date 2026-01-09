"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { MessageSquare, Code, Check, Copy } from "lucide-react";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { Modal } from "@/components/ui/Modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface AgentTestWrapperProps {
    agent: any;
}

export function AgentTestWrapper({ agent }: AgentTestWrapperProps) {
    const [isInternalChatOpen, setIsInternalChatOpen] = useState(false);
    const [isIntegrationOpen, setIsIntegrationOpen] = useState(false);

    // Embed Code Generation - safe for SSR
    const [origin, setOrigin] = useState("https://webrep.ai");

    // Set origin on mount
    useState(() => {
        if (typeof window !== 'undefined') {
            setOrigin(window.location.origin);
        }
    });

    const embedCode = `<!-- WebRep AI Agent Embed -->
<script 
  src="${origin}/widget.js"
  data-agent-id="${agent.id}"
  data-primary-color="#2563eb"
  defer
></script>`;

    const [copied, setCopied] = useState(false);
    const copyToClipboard = () => {
        navigator.clipboard.writeText(embedCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            <div className="flex gap-2">
                {/* Integration Modal Trigger */}
                <Button variant="outline" size="sm" onClick={() => setIsIntegrationOpen(true)}>
                    <Code className="w-4 h-4 mr-2" /> Integration
                </Button>

                <Modal
                    isOpen={isIntegrationOpen}
                    onClose={() => setIsIntegrationOpen(false)}
                    title="Integrate Agent"
                    className="sm:max-w-2xl"
                >
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium">Embed Code</h3>
                            <div className="relative">
                                <pre className="p-4 rounded-lg bg-slate-950 text-slate-50 overflow-x-auto text-sm font-mono border border-slate-800">
                                    <code>{embedCode}</code>
                                </pre>
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    className="absolute top-2 right-2 h-8 w-8 bg-slate-800 hover:bg-slate-700 text-slate-300"
                                    onClick={copyToClipboard}
                                >
                                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Paste this code just before the closing <code>&lt;/body&gt;</code> tag of your website.
                            </p>
                        </div>

                        <Card className="bg-slate-50 dark:bg-slate-900 border-dashed">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Testing Instructions</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm space-y-2 text-muted-foreground">
                                <p>1. Copy the code above.</p>
                                <p>2. Paste it into your website's HTML.</p>
                                <p>3. Reload your website - the chat widget will appear in the bottom right corner.</p>
                            </CardContent>
                        </Card>
                    </div>
                </Modal>

                {/* Test Agent Button */}
                <Button
                    size="sm"
                    className="bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                    onClick={() => setIsInternalChatOpen(!isInternalChatOpen)}
                >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {isInternalChatOpen ? 'Close Test' : 'Test Agent'}
                </Button>
            </div>

            {/* The Actual Widget (Controlled) */}
            <div className={cn("fixed bottom-6 right-6 z-50 transition-all duration-300", isInternalChatOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none")}>
                <ChatWidget
                    agentId={agent.id}
                    title={agent.name}
                    primaryColor="#2563eb"
                    isOpen={isInternalChatOpen}
                    onOpenChange={setIsInternalChatOpen}
                />
            </div>
        </>
    );
}
