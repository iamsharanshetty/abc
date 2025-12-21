"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function Pricing() {
    const [isAnnual, setIsAnnual] = useState(true);

    const plans = [
        {
            name: "Starter",
            description: "Solo founders & small sites",
            price: isAnnual ? "39" : "49",
            period: "/ month",
            billingNote: isAnnual ? "billed annually" : "billed monthly",
            features: [
                "1 website",
                "Up to 2,000 AI Conversations / month",
                "Training: Core pages",
                "Lead Capture & Booking",
                "Basic Objection Handling",
                "Basic Analytics",
                "Basic Brand Tone",
                "1 Team User",
                "Email support"
            ],
            cta: "Start Free Trial",
            popular: false
        },
        {
            name: "Growth",
            description: "Growing businesses",
            price: isAnnual ? "119" : "149",
            period: "/ month",
            billingNote: isAnnual ? "billed annually" : "billed monthly",
            features: [
                "1 website",
                "Up to 8,000 AI Conversations / month",
                "Training: Full website",
                "Lead Capture & Booking",
                "Advanced Objection Handling",
                "Advanced Analytics",
                "Full Brand Tone Control",
                "Up to 3 Team Users",
                "Priority support"
            ],
            cta: "Start Free Trial",
            popular: true
        },
        {
            name: "Scale",
            description: "Agencies & high-traffic sites",
            price: isAnnual ? "319" : "399",
            period: "/ month",
            billingNote: isAnnual ? "billed annually" : "billed monthly",
            features: [
                "Up to 5 websites",
                "Up to 30,000 AI Conversations / month",
                "Training: Full site + assets",
                "Lead Capture & Booking",
                "Advanced + Custom Logic",
                "Advanced + Export Analytics",
                "Full Brand Tone Control",
                "Unlimited Users",
                "Dedicated onboarding"
            ],
            cta: "Request a Demo",
            popular: false
        },
        {
            name: "WebRep for Existing Websites",
            description: "Businesses with an existing stack",
            price: isAnnual ? "79" : "99",
            period: "/ month",
            billingNote: isAnnual ? "billed annually" : "billed monthly",
            features: [
                "1 website",
                "Usage-based AI Conversations",
                "Training: Full website",
                "Lead Capture & Booking",
                "Advanced Objection Handling",
                "Basic Analytics",
                "Full Brand Tone Control",
                "Up to 3 Team Users",
                "Priority support"
            ],
            cta: "Learn More",
            popular: false
        }
    ];

    return (
        <section className="py-24 bg-slate-50 dark:bg-slate-950">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
                        Turn Your Website Into an AI Sales Representative with Simple, Predictable Pricing
                    </h2>

                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center gap-4 mt-8">
                        <span className={`text-sm font-medium ${!isAnnual ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>Monthly</span>
                        <button
                            onClick={() => setIsAnnual(!isAnnual)}
                            className="relative w-14 h-8 bg-blue-600 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <span className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full transition-transform transform ${isAnnual ? 'translate-x-6' : ''}`} />
                        </button>
                        <span className={`text-sm font-medium ${isAnnual ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                            Annual <span className="text-blue-600 font-bold ml-1">(Save 20%)</span>
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                    {plans.map((plan, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: idx * 0.1 }}
                            className={`relative p-8 rounded-2xl bg-white dark:bg-slate-900 border ${plan.popular ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 dark:border-slate-800'} flex flex-col`}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{plan.name}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 min-h-[40px]">{plan.description}</p>
                            </div>

                            <div className="mb-6">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold text-slate-900 dark:text-white">${plan.price}</span>
                                    <span className="text-slate-500 dark:text-slate-400">{plan.period}</span>
                                </div>
                                <div className="text-xs text-slate-400 mt-1">{plan.billingNote}</div>
                            </div>

                            <div className="flex-1 mb-8">
                                <ul className="space-y-3">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                                            <Check className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <Button
                                variant={plan.popular ? "default" : "outline"}
                                className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                            >
                                {plan.cta}
                            </Button>
                        </motion.div>
                    ))}
                </div>

                {/* Performance Assurance */}
                <div className="mt-20 text-center max-w-3xl mx-auto">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">WebRep Performance Assurance</h3>
                    <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                        All plans include unlimited AI-powered website conversations, real-time visitor guidance, lead capture, booking flows, and on-site actions. <br />
                        No seat limits. No per-agent pricing. No setup or maintenance fees. <br />
                        Scale conversations and conversions as your traffic grows. Pay only for the plan that fits your website.
                    </p>
                    <div className="flex items-center justify-center gap-8 text-blue-600 dark:text-blue-400 font-semibold cursor-pointer">
                        <span className="hover:underline">View all features</span>
                        <span className="hover:underline">View pricing details</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
