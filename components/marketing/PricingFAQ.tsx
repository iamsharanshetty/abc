"use client";

import { motion } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { useState } from 'react';

function FAQItem({ question, answer }: { question: string, answer: string }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-slate-200 dark:border-slate-800">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-6 flex items-start justify-between gap-4 text-left focus:outline-none"
            >
                <span className="text-lg font-semibold text-slate-900 dark:text-white">{question}</span>
                <span className="mt-1 text-slate-400 shrink-0">
                    {isOpen ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </span>
            </button>
            <motion.div
                initial={false}
                animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
            >
                <p className="pb-6 text-slate-600 dark:text-slate-300 leading-relaxed">
                    {answer}
                </p>
            </motion.div>
        </div>
    );
}

export function PricingFAQ() {
    const faqs = [
        {
            question: "What determines the right plan for me?",
            answer: "Choose based on your traffic volume, how important lead qualification is, and whether you need multi-site or agency features."
        },
        {
            question: "Do I need to redesign my website?",
            answer: "No. WebRep installs with one script and works on top of your existing site."
        },
        {
            question: "Is WebRep a chatbot?",
            answer: "WebRep is an AI website representative trained on your business content, designed to guide visitors and drive conversions, not just answer basic questions."
        },
        {
            question: "How fast can we go live?",
            answer: "Most sites can be live the same day once content is trained and the script is installed."
        },
        {
            question: "Can I control what WebRep says?",
            answer: "Yes. You can set tone, boundaries, FAQs, and conversion goals."
        }
    ];

    return (
        <section className="py-24 bg-slate-50 dark:bg-slate-950">
            <div className="container mx-auto px-4 max-w-3xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Frequently Asked Questions</h2>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-800">
                    {faqs.map((faq, idx) => (
                        <FAQItem key={idx} question={faq.question} answer={faq.answer} />
                    ))}
                </div>
            </div>
        </section>
    );
}
