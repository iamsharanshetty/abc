'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { getAgents, updateAgentSettings } from '@/lib/actions/agents';
import { Loader2 } from 'lucide-react';

export default function IntegrationsPage() {
    const [agents, setAgents] = useState<any[]>([]);
    const [selectedAgentId, setSelectedAgentId] = useState<string>('');
    const [webhookUrl, setWebhookUrl] = useState('');
    const [sendLeads, setSendLeads] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchAgents = async () => {
            const data = await getAgents();
            setAgents(data);
            if (data && data.length > 0) {
                const first = data[0];
                setSelectedAgentId(first.id);
                setWebhookUrl((first.settings as any)?.webhookUrl || '');
                setSendLeads((first.settings as any)?.sendLeads || false);
            }
            setLoading(false);
        };
        fetchAgents();
    }, []);

    const handleAgentChange = (value: string) => {
        const agent = agents.find(a => a.id === value);
        if (agent) {
            setSelectedAgentId(value);
            setWebhookUrl((agent.settings as any)?.webhookUrl || '');
            setSendLeads((agent.settings as any)?.sendLeads || false);
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
                // Update local state
                const updatedAgents = agents.map(a =>
                    a.id === selectedAgentId
                        ? { ...a, settings: { ...a.settings, webhookUrl, sendLeads } }
                        : a
                );
                setAgents(updatedAgents);
                // Simple alert if toast not available, but usually toast is better
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

    if (loading) {
        return <div className="p-8 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    }

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
        <div className="p-8 max-w-4xl mx-auto">
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
