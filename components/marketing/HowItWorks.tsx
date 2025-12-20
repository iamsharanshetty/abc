"use client";

import { motion } from "framer-motion";
import { Search, Database, Sliders, Code, MessageSquare, ArrowDown } from "lucide-react";

export function HowItWorks() {
    const steps = [
        {
            icon: <Search className="w-6 h-6" />,
            title: "WebRep Analyzes Your Website",
            description: "You provide your website URL. WebRep automatically scans your site, extracting structured information from service pages, pricing pages, product details, FAQs, blogs, and more.",
            details: ["Content indexing", "Semantic understanding", "Intent mapping", "Terminology extraction"],
            color: "bg-blue-500"
        },
        {
            icon: <Database className="w-6 h-6" />,
            title: "WebRep Builds Its Knowledge Base",
            description: "Using AI-driven content modeling, WebRep organizes your extracted information into a logical reasoning framework. It understands relationships between topics, terminology, services, and customer questions.",
            details: ["Knowledge clustering", "Topic relationships", "Page-to-answer linking", "Precision tuning"],
            color: "bg-purple-500"
        },
        {
            icon: <Sliders className="w-6 h-6" />,
            title: "Configure Tone, Behavior, and Business Goals",
            description: "In your WebRep dashboard, you define how the AI should behave: Communication tone, Escalation boundaries, Lead qualification rules, Booking preferences, Sales vs. support intent.",
            details: ["Brand-specific phrasing", "Escalation boundaries", "Goal definition"],
            color: "bg-pink-500"
        },
        {
            icon: <Code className="w-6 h-6" />,
            title: "Install One Line of Code",
            description: "You or your developer place a single script into your website. The WebRep widget appears instantly across your site, ready to engage visitors.",
            details: ["Instant deployment", "Universal compatibility", "No performance impact"],
            color: "bg-amber-500"
        },
        {
            icon: <MessageSquare className="w-6 h-6" />,
            title: "WebRep Begins Engaging and Converting Visitors",
            description: "Once active, WebRep answers questions, guides decisions, handles objections, books calls, captures leads, directs traffic strategically, and provides insights.",
            details: ["Automated engagement", "Lead capture", "Real-time objections handling"],
            color: "bg-emerald-500"
        }
    ];

    return (
        <section className="py-24 bg-slate-50 dark:bg-slate-950">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6"
                    >
                        How WebRep Works <span className="text-blue-600 dark:text-blue-400">Behind the Scenes</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-lg md:text-xl text-slate-600 dark:text-slate-300"
                    >
                        Setup is effortless. The capabilities are profound.
                    </motion.p>
                </div>

                <div className="relative max-w-4xl mx-auto">
                    {/* Connecting Line */}
                    <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-emerald-500 opacity-20 hidden md:block" />

                    <div className="space-y-12 md:space-y-24 relative">
                        {steps.map((step, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.6, delay: idx * 0.1 }}
                                className={`flex flex-col md:flex-row gap-8 items-center ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
                            >
                                {/* Content Side */}
                                <div className="flex-1 w-full text-left">
                                    <div className={`p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none hover:border-blue-500/30 transition-colors`}>
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${step.color} text-white text-sm font-bold`}>
                                                {idx + 1}
                                            </span>
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                                {step.title}
                                            </h3>
                                        </div>
                                        <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                                            {step.description}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {step.details.map((detail, i) => (
                                                <span key={i} className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium">
                                                    {detail}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Center Icon (Desktop) */}
                                <div className="relative z-10 hidden md:flex items-center justify-center w-16 h-16 rounded-full bg-white dark:bg-slate-900 border-4 border-slate-50 dark:border-slate-950 shadow-xl">
                                    <div className={`w-12 h-12 rounded-full ${step.color} text-white flex items-center justify-center`}>
                                        {step.icon}
                                    </div>
                                </div>

                                {/* Placeholder for opposite side to balance layout (Desktop) */}
                                <div className="flex-1 hidden md:block" />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
