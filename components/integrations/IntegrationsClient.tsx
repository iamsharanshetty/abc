"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { updateAgentSettings } from '@/lib/actions/agents';
import { Loader2 } from 'lucide-react';

interface Agent {
    id: string;
    name: string;
    settings: any;
}

export default function IntegrationsClient({ initialAgents }: { initialAgents: Agent[] }) {
    const [agents, setAgents] = useState<Agent[]>(initialAgents);
    const [selectedAgentId, setSelectedAgentId] = useState<string>('');
    const [webhookUrl, setWebhookUrl] = useState('');
    const [sendLeads, setSendLeads] = useState(false);
    const [saving, setSaving] = useState(false);
    const [kbUrl, setKbUrl] = useState('');
    const [isIngesting, setIsIngesting] = useState(false);
    const [ingestStatus, setIngestStatus] = useState<{ type: 'success' | 'error' | 'info', message: string, jobId?: string } | null>(null);

    useEffect(() => {
        if (agents && agents.length > 0) {
            const first = agents[0];
            setSelectedAgentId(first.id);
            setWebhookUrl(first.settings?.webhookUrl || '');
            setSendLeads(first.settings?.sendLeads || false);
            setKbUrl(first.settings?.url || '');
        }
    }, [agents]);

    const handleAgentChange = (value: string) => {
        const agent = agents.find(a => a.id === value);
        if (agent) {
            setSelectedAgentId(value);
            setWebhookUrl(agent.settings?.webhookUrl || '');
            setSendLeads(agent.settings?.sendLeads || false);
            setKbUrl(agent.settings?.url || '');
            setIngestStatus(null);
        }
    };

    const handleIngest = async () => {
        if (!kbUrl || !selectedAgentId) return; // Ensure agent is selected
        setIsIngesting(true);
        setIngestStatus({ type: 'info', message: 'Starting ingestion...' });

        try {
            // 1. Start Ingestion Job
            const response = await fetch('/api/v2/ingest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: kbUrl,
                    maxPages: 50,
                    forceRefresh: true
                })
            });

            const data = await response.json();

            if (response.ok) {
                // 2. Sync Agent Settings with this URL
                // This ensures the Chat API searches the correct knowledge base
                const syncResult = await updateAgentSettings(selectedAgentId, {
                    url: kbUrl
                });

                if (syncResult.success) {
                    // Update local agent state to reflect change
                    const updatedAgents = agents.map(a =>
                        a.id === selectedAgentId
                            ? { ...a, settings: { ...a.settings, url: kbUrl } }
                            : a
                    );
                    setAgents(updatedAgents);
                } else {
                    console.warn("Failed to sync agent URL settings", syncResult.error);
                }

                setIngestStatus({
                    type: 'success',
                    message: 'Ingestion started! Agent settings updated to use this knowledge base.',
                    jobId: data.data?.jobId
                });
            } else {
                setIngestStatus({
                    type: 'error',
                    message: data.error || 'Failed to start ingestion'
                });
            }
        } catch (error) {
            console.error('Ingestion error:', error);
            setIngestStatus({ type: 'error', message: 'An unexpected error occurred' });
        } finally {
            setIsIngesting(false);
        }
    };

    const handleSave = async () => {
        if (!selectedAgentId) return;
        setSaving(true);
        try {
            const result = await updateAgentSettings(selectedAgentId, {
                webhookUrl,
                sendLeads
            });

            if (result.success) {
                // Update local state is tricky without deep copy or re-fetch, but for now we trust the inputs
                const updatedAgents = agents.map(a =>
                    a.id === selectedAgentId
                        ? { ...a, settings: { ...a.settings, webhookUrl, sendLeads } }
                        : a
                );
                setAgents(updatedAgents);
                alert("Settings saved successfully");
            } else {
                alert("Failed to save settings");
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred");
        } finally {
            setSaving(false);
        }
    };

    if (agents.length === 0) {
        return (
            <div className="p-8">
                <h1 className="text-2xl font-bold mb-4 dark:text-white">Integrations</h1>
                <p className="text-slate-500">You need to create an agent first.</p>
                <Button className="mt-4" onClick={() => window.location.href = '/dashboard/create'}>Create Agent</Button>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto animate-in fade-in duration-500">
            <h1 className="text-3xl font-bold mb-2 dark:text-white">Integrations</h1>
            <p className="text-slate-500 mb-8">Connect your AI agent with your existing tools and workflows.</p>

            <div className="space-y-6">

                {/* Agent Selector */}
                {agents.length > 1 && (
                    <div className="max-w-md">
                        <Label>Select Agent</Label>
                        <Select value={selectedAgentId} onValueChange={handleAgentChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select an agent" />
                            </SelectTrigger>
                            <SelectContent>
                                {agents.map(a => (
                                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Knowledge Base Ingestion */}
                <Card>
                    <CardHeader>
                        <CardTitle>Knowledge Base</CardTitle>
                        <CardDescription>
                            Train your agent on your website content. This allows the AI to answer questions based on your specific data.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="kb-url">Website URL</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="kb-url"
                                    placeholder="https://example.com"
                                    value={kbUrl}
                                    onChange={(e) => setKbUrl(e.target.value)}
                                />
                            </div>
                            <p className="text-sm text-slate-500">
                                Enter the starting URL to scrape. We will recursively visit links within the same domain.
                            </p>
                        </div>

                        {ingestStatus && (
                            <div className={`text-sm p-3 rounded-md ${ingestStatus.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                ingestStatus.type === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                }`}>
                                {ingestStatus.message}
                                {ingestStatus.jobId && (
                                    <span className="block mt-1 text-xs opacity-80">Job ID: {ingestStatus.jobId}</span>
                                )}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                        <Button onClick={handleIngest} disabled={isIngesting || !kbUrl}>
                            {isIngesting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Ingesting...
                                </>
                            ) : (
                                "Start Ingestion"
                            )}
                        </Button>
                    </CardFooter>
                </Card>

                {/* Webhook Configuration */}
                <Card>
                    <CardHeader>
                        <CardTitle>Webhook Configuration</CardTitle>
                        <CardDescription>
                            Receive real-time updates when your agent captures a lead or completes a conversation.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="webhook-url">Webhook URL</Label>
                            <Input
                                id="webhook-url"
                                placeholder="https://api.yourcrm.com/webhook"
                                value={webhookUrl}
                                onChange={(e) => setWebhookUrl(e.target.value)}
                            />
                            <p className="text-sm text-slate-500">
                                We'll send a POST request with the conversation and lead data to this URL.
                            </p>
                        </div>

                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label className="text-base">Send New Leads</Label>
                                <p className="text-sm text-slate-500">
                                    Automatically forward lead information to your CRM via webhook.
                                </p>
                            </div>
                            <Switch
                                checked={sendLeads}
                                onCheckedChange={setSendLeads}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                        <Button onClick={handleSave} disabled={saving}>
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Save Changes
                        </Button>
                    </CardFooter>
                </Card>

            </div>
        </div>
    );
}
