"use client";
import Link from 'next/link';
import { ArrowRight, ChevronRight, Play } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export function Hero() {
    const targetRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ["start start", "end start"]
    });

    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9]);
    const y = useTransform(scrollYProgress, [0, 0.5], [0, 50]);

    return (
        <section ref={targetRef} className="relative min-h-[120vh] flex flex-col items-center pt-32 md:pt-48 overflow-hidden bg-background">
            {/* Ambient Background Glow */}
            <div className="absolute top-[-10%] left-[50%] -translate-x-[50%] w-[1000px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full opacity-50 dark:opacity-20 pointer-events-none" />
            <div className="absolute top-[20%] left-[20%] w-[600px] h-[600px] bg-violet-600/10 blur-[100px] rounded-full opacity-30 dark:opacity-10 pointer-events-none" />

            <motion.div
                style={{ opacity, scale, y }}
                className="container mx-auto px-4 flex flex-col items-center text-center z-10"
            >
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Link href="/new-features" className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-border backdrop-blur-sm text-xs font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors mb-8">
                        <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                        New: Voice Agents for Enterprise
                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                    </Link>
                </motion.div>

                {/* Main Heading */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tighter text-foreground mb-6 max-w-5xl mx-auto leading-[1.1]"
                >
                    Your Website, Now an <br className="hidden md:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-violet-600 pb-2">
                        Intelligent Agent.
                    </span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
                >
                    WebRep transforms your static content into an active sales representative.
                    Capture leads, answer questions, and drive revenue 24/7 with human-like AI.
                </motion.p>

                {/* Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-col sm:flex-row items-center gap-4 mb-20"
                >
                    <Link
                        href="/login"
                        className="h-12 px-8 rounded-full bg-foreground text-background font-medium flex items-center gap-2 hover:bg-foreground/90 hover:scale-105 transition-all shadow-xl shadow-blue-500/10"
                    >
                        Start Free Trial
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                        href="/demo"
                        className="h-12 px-8 rounded-full bg-secondary/50 border border-border backdrop-blur-sm text-foreground font-medium flex items-center gap-2 hover:bg-secondary/80 transition-all"
                    >
                        <Play className="w-4 h-4 fill-current" />
                        Watch Demo
                    </Link>
                </motion.div>

                {/* 3D Dashboard Mockup Placeholder */}
                <motion.div
                    initial={{ opacity: 0, y: 100, rotateX: 20 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    transition={{ delay: 0.6, duration: 1, type: "spring" }}
                    className="w-full max-w-6xl relative perspective-1000 group"
                >
                    {/* Glass Overlay/Glow behind image */}
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent blur-3xl -z-10 opacity-50" />

                    <div className="relative rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-xl shadow-2xl overflow-hidden aspect-[16/9] group-hover:scale-[1.01] transition-transform duration-700 ease-out">
                        {/* Mock UI Structure */}
                        <div className="absolute top-0 w-full h-12 border-b border-white/5 bg-white/5 flex items-center px-4 gap-2">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                <div className="w-3 h-3 rounded-full bg-green-500/50" />
                            </div>
                            <div className="mx-auto w-1/3 h-6 bg-white/5 rounded-full flex items-center justify-center text-[10px] text-white/30 font-mono">
                                webrep.ai/dashboard
                            </div>
                        </div>

                        {/* Content Area Placeholder */}
                        <div className="absolute inset-x-0 bottom-0 top-12 flex">
                            {/* Sidebar Mock */}
                            <div className="w-64 border-r border-white/5 bg-white/5 hidden md:flex flex-col p-4 gap-4">
                                <div className="w-full h-8 bg-white/10 rounded-lg animate-pulse" />
                                <div className="w-3/4 h-4 bg-white/5 rounded-lg" />
                                <div className="w-1/2 h-4 bg-white/5 rounded-lg" />
                            </div>
                            {/* Main Content Mock */}
                            <div className="flex-1 p-8 grid grid-cols-3 gap-6">
                                <div className="col-span-2 h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl border border-white/5 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="text-4xl font-bold text-white/20 mb-2">84%</div>
                                        <div className="text-sm text-white/30">Conversion Rate</div>
                                    </div>
                                </div>
                                <div className="col-span-1 h-64 bg-white/5 rounded-xl border border-white/5" />
                                <div className="col-span-3 h-32 bg-white/5 rounded-xl border border-white/5" />
                            </div>
                        </div>

                        {/* AI Chat Interaction Overlay */}
                        <div className="absolute bottom-8 right-8 w-80 bg-slate-900/90 border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-md">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">AI</div>
                                <div className="text-xs text-slate-300">
                                    <div className="font-bold text-white">WebRep Agent</div>
                                    <div>Online</div>
                                </div>
                            </div>
                            <div className="space-y-3 text-xs">
                                <div className="bg-white/5 p-2 rounded-lg rounded-tl-none text-slate-300">
                                    How can I help increase your sales today?
                                </div>
                                <div className="bg-blue-600/20 text-blue-200 p-2 rounded-lg rounded-tr-none ml-auto max-w-[80%]">
                                    Show me the latest leads.
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Fade alignment */}
            <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-background to-transparent z-20" />
        </section>
    );
}
