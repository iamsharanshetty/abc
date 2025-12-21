"use client";

import { motion } from 'framer-motion';
import { Search, Users } from 'lucide-react';

export function PricingAddons() {
    return (
        <section className="py-20 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Add-ons</h2>
                    <p className="text-slate-600 dark:text-slate-400">Included in your free trial. Add or remove anytime.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Advanced Conversion Insights */}
                    <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-6 items-start">
                        <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <Search className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Advanced Conversion Insights</h3>
                            <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm leading-relaxed">
                                Deeper visibility into visitor behavior, intent patterns, and conversion blockers.
                                Understand what visitors ask, where they hesitate, and what drives decisions across your website.
                            </p>
                            <div className="mb-4">
                                <span className="text-2xl font-bold text-slate-900 dark:text-white">$99</span>
                                <span className="text-slate-500 dark:text-slate-400 text-sm"> / mo</span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                                Includes advanced analytics, conversation insights, and exportable reports
                            </p>
                            <button className="text-blue-600 dark:text-blue-400 font-semibold text-sm hover:underline">Learn more</button>
                        </div>
                    </div>

                    {/* Team Copilot */}
                    <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-6 items-start">
                        <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Team Copilot</h3>
                            <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm leading-relaxed">
                                Assist your team with AI-generated summaries, suggested responses, and conversation insights.
                                Designed to help sales and marketing teams act faster using real visitor data.
                            </p>
                            <div className="mb-4">
                                <span className="text-2xl font-bold text-slate-900 dark:text-white">$29</span>
                                <span className="text-slate-500 dark:text-slate-400 text-sm"> per user / mo, billed annually</span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                                Unlimited usage
                            </p>
                            <button className="text-blue-600 dark:text-blue-400 font-semibold text-sm hover:underline">Learn more</button>
                        </div>
                    </div>
                </div>

                {/* Calculators & Early Access */}
                <div className="max-w-4xl mx-auto mt-16 grid gap-8">
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                            <h4 className="font-bold text-slate-900 dark:text-white mb-2">Find the right WebRep plan for your website</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Estimate the best WebRep plan based on your website traffic, visitor behavior, and conversion goals.</p>
                            <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-lg text-sm font-bold">Calculate plan</button>
                        </div>
                        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                            <h4 className="font-bold text-slate-900 dark:text-white mb-2">See the impact WebRep could have on your business</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Estimate how much time, effort, and lost conversions WebRep could help you recover.</p>
                            <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-lg text-sm font-bold">Calculate impact</button>
                        </div>
                    </div>

                    <div className="p-8 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <h4 className="text-xl font-bold mb-2">Early-stage startups get exclusive WebRep access</h4>
                            <p className="text-blue-100 max-w-xl">Launch your website with an AI representative built to guide visitors, explain your offer, and drive conversions from day one.</p>
                        </div>
                        <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-blue-50 transition-colors whitespace-nowrap">Apply now</button>
                    </div>
                </div>
            </div>
        </section>
    );
}
