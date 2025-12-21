export function Comparison() {
    const items = [
        { name: 'WebRep', score: 92, color: 'bg-blue-600' },
        { name: 'Traditional Chatbots', score: 54, color: 'bg-slate-400' },
        { name: 'AI Widgets', score: 49, color: 'bg-slate-300' },
        { name: 'Generic Support AI', score: 40, color: 'bg-slate-200' },
    ];

    return (
        <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-6">
                            WebRep vs Other AI Solutions: <br />
                            <span className="text-blue-600">The Conversion Advantage</span>
                        </h2>
                        <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                            WebRep leads because it is trained for one purpose: turning visitors into customers.
                            While others focus on generic support or basic scripts, we focus on understanding user intent and driving action.
                        </p>
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center mt-1">✓</div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white">Context Aware</h4>
                                    <p className="text-sm text-slate-500">Understands your full site context</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center mt-1">✓</div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white">Zero Setup</h4>
                                    <p className="text-sm text-slate-500">Just enter your URL and go</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700">
                        <h3 className="text-lg font-semibold mb-8 text-slate-900 dark:text-white">Performance Score (G2 Equivalent)</h3>
                        <div className="space-y-6">
                            {items.map((item) => (
                                <div key={item.name}>
                                    <div className="flex justify-between text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                                        <span>{item.name}</span>
                                        <span>{item.score}</span>
                                    </div>
                                    <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${item.color} rounded-full transition-all duration-1000 ease-out`}
                                            style={{ width: `${item.score}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

