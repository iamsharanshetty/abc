"use client";

import { motion } from "framer-motion";
import { Search, Database, Sliders, Code, MessageSquare, CheckCircle2 } from "lucide-react";

export function HowItWorks() {
    const steps = [
        {
            icon: <Search className="w-5 h-5" />,
            title: "Analysis",
            headline: "We Read Your Entire Website",
            description: "Just provide your URL. WebRep automatically scans every page, product, and blog post to build a deep understanding of your business.",
            color: "bg-blue-600"
        },
        {
            icon: <Database className="w-5 h-5" />,
            title: "Knowledge",
            headline: "Constructing the Brain",
            description: "Using advanced LLMs, we structure your data into a knowledge graph that connects customer intent with your specific solutions.",
            color: "bg-violet-600"
        },
        {
            icon: <Sliders className="w-5 h-5" />,
            title: "Calibration",
            headline: "Align With Your Brand",
            description: "Define your tone of voice, escalation rules, and specific goals—like 'Book a Demo' or 'Collect Email'.",
            color: "bg-pink-600"
        },
        {
            icon: <Code className="w-5 h-5" />,
            title: "Deploy",
            headline: "Go Live in Minutes",
            description: "Copy a single line of code to your site header. WebRep works instantly on WordPress, Shopify, Webflow, and custom stacks.",
            color: "bg-amber-500"
        },
        {
            icon: <MessageSquare className="w-5 h-5" />,
            title: "Results",
            headline: "Watch Revenue Grow",
            description: "WebRep immediately starts capturing leads, handling objections, and booking meetings—operating 24/7 as your best sales rep.",
            color: "bg-emerald-500"
        }
    ];

    return (
        <section className="py-32 bg-secondary/20 relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -right-1/4 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 -left-1/4 w-[800px] h-[800px] bg-purple-500/5 rounded-full blur-3xl" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-24">
                    <h2 className="text-sm font-semibold text-primary tracking-widest uppercase mb-4">
                        Process
                    </h2>
                    <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 tracking-tight">
                        From URL to <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">Active Agent</span> in Minutes.
                    </h2>
                    <p className="text-xl text-muted-foreground">
                        No complex setup. No training data required. <br /> WebRep builds itself from what you've already created.
                    </p>
                </div>

                <div className="relative max-w-5xl mx-auto">
                    {/* Vertical Line */}
                    <div className="absolute left-[28px] md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/0 via-blue-500/50 to-blue-500/0 md:-ml-px" />

                    <div className="space-y-16">
                        {steps.map((step, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                                className={`flex flex-col md:flex-row gap-8 items-start relative ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
                            >
                                {/* Center Icon */}
                                <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 w-14 h-14 rounded-full border-4 border-background bg-card flex items-center justify-center shadow-lg z-10 group">
                                    <div className={`w-10 h-10 rounded-full ${step.color} flex items-center justify-center text-white shadow-inner transform group-hover:scale-110 transition-transform duration-300`}>
                                        {step.icon}
                                    </div>
                                </div>

                                {/* Content Card */}
                                <div className={`flex-1 pl-20 md:pl-0 ${idx % 2 === 0 ? 'md:pr-16 text-left md:text-right' : 'md:pl-16 text-left'}`}>
                                    <div className="space-y-3">
                                        <div className={`flex items-center gap-3 ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground border border-border/50`}>
                                                Step 0{idx + 1}
                                            </span>
                                            <h3 className="text-lg font-bold text-primary uppercase tracking-wide">
                                                {step.title}
                                            </h3>
                                        </div>

                                        <h4 className="text-2xl font-bold text-foreground">
                                            {step.headline}
                                        </h4>
                                        <p className="text-muted-foreground text-lg leading-relaxed">
                                            {step.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Empty Space for Alignment */}
                                <div className="flex-1 hidden md:block" />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
