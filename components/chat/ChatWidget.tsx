'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect } from 'react';
import { Send, X, MessageCircle, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatWidgetProps {
    agentId?: string;
    websiteUrl?: string;
    primaryColor?: string;
    title?: string;
}

export function ChatWidget({ agentId, websiteUrl, primaryColor = '#2563eb', title = 'WebRep AI' }: ChatWidgetProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Using simple local state to ensure input works regardless of hook quirks
    const [localInput, setLocalInput] = useState('');

    const chatHelpers = useChat({
        api: '/api/chat',
        body: {
            agentId,
            websiteUrl
        },
        onError: (err: any) => {
            console.error("Chat error:", err);
        }
    });

    const { messages, append, isLoading, error, reload } = chatHelpers;

    useEffect(() => {
        console.log("useChat Debug:", Object.keys(chatHelpers));
    }, []);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!localInput.trim() || isLoading) return;

        const content = localInput;
        setLocalInput(''); // Clear immediately

        try {
            if (typeof append === 'function') {
                await append({
                    role: 'user',
                    content: content
                });
            } else {
                console.error("Chat 'append' function is missing", chatHelpers);
                // Fallback or alert
                alert("Chat didn't initialize correctly. Please reload.");
            }
        } catch (e) {
            console.error("Failed to send message", e);
        }
    };

    const bgPrimary = { backgroundColor: primaryColor };

    return (
        <div className={cn("fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans", !isOpen && "pointer-events-none")}>

            {/* Chat Window */}
            <div
                className={cn(
                    "bg-white dark:bg-slate-900 shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 ease-in-out origin-bottom-right mb-4 border border-slate-200 dark:border-slate-800 pointer-events-auto",
                    isOpen ? "w-[380px] h-[600px] opacity-100 scale-100" : "w-[380px] h-0 opacity-0 scale-95"
                )}
            >
                {/* Header */}
                <div className="p-4 flex items-center justify-between text-white" style={bgPrimary}>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                            <MessageCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">{title}</h3>
                            <div className="flex items-center gap-1 opacity-80">
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                <span className="text-xs">Online</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                        <ChevronDown className="w-5 h-5" />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="h-[460px] overflow-y-auto p-4 bg-slate-50 dark:bg-slate-950/50 space-y-4 scroll-smooth">
                    {messages.length === 0 && (
                        <div className="text-center text-slate-500 mt-10">
                            <p className="mb-2">👋 Hi! How can I help you today?</p>
                            <p className="text-xs opacity-70">Ask me anything about {title}.</p>
                        </div>
                    )}

                    {messages.map((m: any) => (
                        <div key={m.id} className={cn("flex w-full", m.role === 'user' ? "justify-end" : "justify-start")}>
                            <div
                                className={cn(
                                    "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                                    m.role === 'user'
                                        ? "text-white rounded-br-none"
                                        : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-none"
                                )}
                                style={m.role === 'user' ? bgPrimary : {}}
                            >
                                {m.content}
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex w-full justify-start">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm border border-slate-200 dark:border-slate-700 flex gap-1">
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center justify-center gap-2 text-red-500 text-xs mt-2">
                            <span>Something went wrong.</span>
                            <button onClick={() => reload()} className="underline hover:text-red-600">Retry</button>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 h-[84px]">
                    <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
                        <input
                            className="flex-1 bg-slate-100 dark:bg-slate-800 p-3 rounded-full text-sm outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white transition-all pl-4"
                            value={localInput}
                            onChange={(e) => setLocalInput(e.target.value)}
                            placeholder="Type a message..."
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !localInput.trim()}
                            className="p-3 rounded-full text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all transform active:scale-95"
                            style={bgPrimary}
                        >
                            <Send className="w-4 h-4 ml-0.5" />
                        </button>
                    </form>
                </div>
            </div>

            {/* Floating Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all duration-300 pointer-events-auto"
                style={bgPrimary}
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-7 h-7" />}
            </button>
        </div>
    );
}
