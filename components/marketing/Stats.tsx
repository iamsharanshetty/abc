"use client";

import { motion } from 'framer-motion';

export function Stats() {
    return (
        <section className="py-24 bg-background relative overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-8 items-center max-w-5xl mx-auto">
                    {/* Stat 1 */}
                    <div className="text-center md:text-left group cursor-default">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="text-8xl md:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-violet-600 mb-2"
                        >
                            42%
                        </motion.div>
                        <h3 className="text-2xl font-bold text-foreground tracking-tight mb-2">
                            Increase in Conversion Rate
                        </h3>
                        <p className="text-muted-foreground text-lg leading-relaxed max-w-sm mx-auto md:mx-0">
                            Businesses using WebRep see a significant lift in visitor engagement and lead capture within the first 30 days.
                        </p>
                    </div>

                    {/* Stat 2 */}
                    <div className="text-center md:text-left md:pl-12 border-l-0 md:border-l border-border/50 group cursor-default">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="text-8xl md:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-emerald-500 to-teal-500 mb-2"
                        >
                            99.9%
                        </motion.div>
                        <h3 className="text-2xl font-bold text-foreground tracking-tight mb-2">
                            Response Accuracy
                        </h3>
                        <p className="text-muted-foreground text-lg leading-relaxed max-w-sm mx-auto md:mx-0">
                            Powered by your content, WebRep delivers precise, context-aware answers without hallucinations.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}

