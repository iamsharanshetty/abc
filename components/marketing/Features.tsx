"use client";

import {
    Brain,
    Zap,
    Compass,
    MousePointerClick,
    MessageCircleQuestion,
    Fingerprint,
    Code,
    BarChart3,
    Infinity
} from 'lucide-react';
import { motion } from 'framer-motion';

export function Features() {
    const features = [
        {
            icon: <Brain className="w-6 h-6" />,
            title: 'Learns Your Entire Website Automatically',
            description: 'WebRep reads and interprets your website content including service pages, product descriptions, pricing, FAQs, blogs, and support information.',
            tagline: 'Precision through context',
            color: 'bg-blue-500',
        },
        {
            icon: <Zap className="w-6 h-6" />,
            title: 'Responds Instantly With High-Quality Information',
            description: 'Eliminates lag and uncertainty by providing clear, accurate responses the moment visitors ask questions. It understands intent and delivers actionable explanations.',
            tagline: 'Zero latency trust',
            color: 'bg-amber-500',
        },
        {
            icon: <Compass className="w-6 h-6" />,
            title: 'Guides Visitors Through Your Website With Purpose',
            description: 'Instead of leaving visitors to navigate alone, WebRep directs them toward the most relevant pages or actions based on their interests.',
            tagline: 'Personalized navigation',
            color: 'bg-emerald-500',
        },
        {
            icon: <MousePointerClick className="w-6 h-6" />,
            title: 'Converts Conversations Into Actions',
            description: 'More than a chatbot, WebRep is engineered to drive decisions. It can book consultations, collect leads, surface pricing, and route visitors.',
            tagline: 'Active sales engine',
            color: 'bg-purple-500',
        },
        {
            icon: <MessageCircleQuestion className="w-6 h-6" />,
            title: 'Handles Objections and Clarifies Complex Topics',
            description: 'Explains pricing, justifies value, differentiates your offerings, and resolves common objections in real time with clarity and confidence.',
            tagline: 'Overcome hesitation',
            color: 'bg-rose-500',
        },
        {
            icon: <Fingerprint className="w-6 h-6" />,
            title: 'Maintains Your Brand Voice and Standards',
            description: 'Mirrors your brand’s tone—whether professional, friendly, or authoritative. It follows your communication guidelines perfectly.',
            tagline: 'Consistent identity',
            color: 'bg-indigo-500',
        },
        {
            icon: <Code className="w-6 h-6" />,
            title: 'Deploys Instantly With One Script',
            description: 'Activated on any website by placing a lightweight script. Supports WordPress, Webflow, Shopify, Squarespace, and custom builds.',
            tagline: 'No-code integration',
            color: 'bg-slate-500',
        },
        {
            icon: <BarChart3 className="w-6 h-6" />,
            title: 'Delivers Actionable Visitor Insights',
            description: 'Collects and analyzes real visitor questions, confusion points, and high-intent signals to help you refine messaging and optimize scale.',
            tagline: 'Data-driven growth',
            color: 'bg-cyan-500',
        },
        {
            icon: <Infinity className="w-6 h-6" />,
            title: 'Operates Continuously and at Scale',
            description: 'Provides consistent, reliable interactions 24/7, handling unlimited visitor inquiries simultaneously with no drop in quality.',
            tagline: 'Always-on performance',
            color: 'bg-pink-500',
        },
    ];

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    return (
        <section className="py-24 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 leading-tight"
                    >
                        A Modern AI Website Representative Built to <span className="text-blue-600 dark:text-blue-400">Clarify</span>, <span className="text-purple-600 dark:text-purple-400">Guide</span>, and <span className="text-pink-600 dark:text-pink-400">Convert</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-lg md:text-xl text-slate-600 dark:text-slate-300"
                    >
                        WebRep isn't just support software. It's an autonomous agent that learns your business and actively drives revenue.
                    </motion.p>
                </div>

                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-100px" }}
                >
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            variants={item}
                            className="group p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 relative overflow-hidden"
                        >
                            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity`}>
                                <div className={`w-24 h-24 rounded-full blur-2xl ${feature.color}`} />
                            </div>

                            <div
                                className={`w-12 h-12 rounded-lg ${feature.color} text-white flex items-center justify-center mb-6 shadow-lg transform group-hover:scale-110 transition-transform relative z-10`}
                            >
                                {feature.icon}
                            </div>

                            <div className="relative z-10">
                                <span className={`text-xs font-bold uppercase tracking-wider mb-2 block ${feature.color.replace('bg-', 'text-')}`}>
                                    {feature.tagline}
                                </span>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {feature.title}
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                                    {feature.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
