"use client";

import { Check, X } from "lucide-react";

export function Comparison() {
    return (
        <section className="py-24 bg-secondary/30">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6 tracking-tight">
                        Why WebRep Wins
                    </h2>
                    <p className="text-xl text-muted-foreground">
                        Stop settling for dumb chatbots. Upgrade to an intelligent agent.
                    </p>
                </div>

                <div className="max-w-5xl mx-auto bg-card rounded-3xl border border-border shadow-2xl overflow-hidden">
                    <div className="grid grid-cols-3 bg-secondary/50 p-6 text-sm font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                        <div className="col-span-1">Feature</div>
                        <div className="col-span-1 text-center text-foreground font-bold">WebRep</div>
                        <div className="col-span-1 text-center">Standard Chatbots</div>
                    </div>

                    {[
                        { feature: "Understanding", webrep: "Full Context Awareness", other: "Keywords Only" },
                        { feature: "Setup Actions", webrep: "Automatic Scraping", other: "Manual Data Entry" },
                        { feature: "Goal Alignment", webrep: "Sales & Conversion", other: "Support Tickets" },
                        { feature: "Tone Matching", webrep: "Custom Brand Voice", other: "Robotic / Generic" },
                        { feature: "Integrations", webrep: "1-Click Connect", other: "Complex API Setup" },
                        { feature: "Pricing", webrep: "Performance Based", other: "Per Seat / Monthly" }
                    ].map((row, i) => (
                        <div key={i} className="grid grid-cols-3 p-6 border-b border-border hover:bg-secondary/20 transition-colors items-center">
                            <div className="col-span-1 font-medium text-foreground">{row.feature}</div>
                            <div className="col-span-1 text-center font-bold text-blue-600 flex justify-center items-center gap-2">
                                <span className="bg-blue-100 dark:bg-blue-900/30 p-1 rounded-full"><Check className="w-4 h-4" /></span>
                                {row.webrep}
                            </div>
                            <div className="col-span-1 text-center text-muted-foreground flex justify-center items-center gap-2 opacity-70">
                                <span className="bg-slate-100 dark:bg-slate-800 p-1 rounded-full"><X className="w-4 h-4" /></span>
                                {row.other}
                            </div>
                        </div>
                    ))}

                    <div className="p-8 text-center bg-secondary/10">
                        <p className="text-muted-foreground italic">"The difference in quality was noticeable immediately."</p>
                    </div>
                </div>
            </div>
        </section>
    );
}

