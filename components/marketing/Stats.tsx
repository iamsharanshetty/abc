export function Stats() {
    return (
        <section className="py-24 relative overflow-hidden">
            {/* Background gradient blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] -z-10" />

            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                        The Top Performing AI Agent for Website Conversions
                    </h2>
                    <p className="text-lg text-slate-600 dark:text-slate-300">
                        Real results from businesses using WebRep.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Stat 1 */}
                    <div className="relative p-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl text-center overflow-hidden group">
                        <div className="absolute inset-0 bg-blue-600/5 group-hover:bg-blue-600/10 transition-colors" />
                        <div className="relative">
                            <div className="text-6xl font-black text-blue-600 dark:text-blue-400 mb-2">
                                42%
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">
                                Conversion Improvement
                            </h3>
                            <p className="text-slate-600 dark:text-slate-300">
                                WebRep users see an average lift of up to 42 percent in conversions after adding an AI Website Representative that guides visitors in real time.
                            </p>
                        </div>
                    </div>

                    {/* Stat 2 */}
                    <div className="relative p-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl text-center overflow-hidden group">
                        <div className="absolute inset-0 bg-emerald-600/5 group-hover:bg-emerald-600/10 transition-colors" />
                        <div className="relative">
                            <div className="text-6xl font-black text-emerald-600 dark:text-emerald-400 mb-2">
                                99.4%
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">
                                Accuracy Rate
                            </h3>
                            <p className="text-slate-600 dark:text-slate-300">
                                WebRep delivers highly accurate, context-aware responses powered directly by your website’s content, making it one of the most reliable AI website agents available.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

