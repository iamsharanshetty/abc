'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Loader2, CheckCircle2, ArrowRight, Layout, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// import { ingestWebsite } from '@/lib/actions/ingest'; // Assuming existing action or we simulate

export default function AgentSetupPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [url, setUrl] = useState('');
    const [persona, setPersona] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Step 1: Welcome & URL
    const handleUrlSubmit = async () => {
        if (!url) return;
        setLoading(true);
        // Simulate ingest process
        await new Promise(r => setTimeout(r, 2000));
        setLoading(false);
        setStep(2);
    };

    // Step 2: Persona
    const handlePersonaSelect = (p: string) => {
        setPersona(p);
    };

    const handlePersonaSubmit = async () => {
        if (!persona) return;
        setLoading(true);
        // Create agent with context (Simulated)
        // await createAgent({ name: 'My Agent', url, role: persona });
        await new Promise(r => setTimeout(r, 1500));
        setLoading(false);
        setStep(3);
    };

    // Step 3: Completion
    const handleFinish = () => {
        router.push('/dashboard');
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
            {/* Logo */}
            <div className="mb-8 font-bold text-2xl flex items-center gap-2">
                <div className="w-0 h-0 border-l-[10px] border-l-transparent border-b-[16px] border-b-blue-600 border-r-[10px] border-r-transparent mb-1"></div>
                WEBREP
            </div>

            <div className="w-full max-w-2xl">
                {/* Progress Steps */}
                <div className="flex items-center justify-center mb-12 gap-4">
                    {[1, 2, 3].map(s => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= s ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                                }`}>
                                {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                            </div>
                            {s < 3 && <div className={`w-12 h-1 rounded-full ${step > s ? 'bg-blue-600' : 'bg-slate-200'}`} />}
                        </div>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {/* STEP 1: Website URL */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <Card className="border-0 shadow-xl">
                                <CardHeader className="text-center">
                                    <CardTitle className="text-2xl">Let's train your AI Agent</CardTitle>
                                    <CardDescription>Enter your website URL. We'll analyze your content to build your custom knowledge base.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex gap-4">
                                        <Input
                                            placeholder="https://example.com"
                                            className="h-12 text-lg"
                                            value={url}
                                            onChange={e => setUrl(e.target.value)}
                                        />
                                    </div>
                                    <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                                        <p>💡 Tip: For best results, use your home page. We'll crawl linked pages automatically.</p>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-end">
                                    <Button size="lg" onClick={handleUrlSubmit} disabled={loading || !url}>
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                                        Analyze Website
                                    </Button>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    )}

                    {/* STEP 2: Persona */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <Card className="border-0 shadow-xl">
                                <CardHeader className="text-center">
                                    <CardTitle className="text-2xl">Choose your Agent's Persona</CardTitle>
                                    <CardDescription>How should your AI representative interact with visitors?</CardDescription>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div
                                        onClick={() => handlePersonaSelect('support')}
                                        className={`cursor-pointer border-2 rounded-xl p-6 hover:border-blue-500 transition-all ${persona === 'support' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-100 dark:border-slate-800'}`}
                                    >
                                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-4">
                                            <MessageSquare className="w-6 h-6" />
                                        </div>
                                        <h3 className="font-bold text-lg mb-2">Support Hero</h3>
                                        <p className="text-slate-500 text-sm">Focuses on answering FAQs, troubleshooting, and providing helpful information.</p>
                                    </div>

                                    <div
                                        onClick={() => handlePersonaSelect('sales')}
                                        className={`cursor-pointer border-2 rounded-xl p-6 hover:border-blue-500 transition-all ${persona === 'sales' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-100 dark:border-slate-800'}`}
                                    >
                                        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-4">
                                            <Layout className="w-6 h-6" />
                                        </div>
                                        <h3 className="font-bold text-lg mb-2">Sales Expert</h3>
                                        <p className="text-slate-500 text-sm">Focuses on value proposition, handling objections, and driving conversions.</p>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-between">
                                    <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                                    <Button size="lg" onClick={handlePersonaSubmit} disabled={loading || !persona}>
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                                        Create Agent
                                    </Button>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    )}

                    {/* STEP 3: Success */}
                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <Card className="border-0 shadow-xl text-center p-8">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                                </div>
                                <h2 className="text-3xl font-bold mb-4">Your Agent is Ready!</h2>
                                <p className="text-slate-500 mb-8 max-w-md mx-auto">
                                    We've created your agent based on <strong>{url}</strong> with a <strong>{persona}</strong> persona.
                                </p>

                                <div className="bg-slate-900 text-slate-300 p-4 rounded-lg text-left text-sm font-mono mb-8 overflow-x-auto">
                                    <code>{`<script src="https://webrep.ai/embed.js" data-agent-id="AGENT_123"></script>`}</code>
                                </div>

                                <Button size="lg" className="w-full" onClick={handleFinish}>
                                    Go to Dashboard
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
