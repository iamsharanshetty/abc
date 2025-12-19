import Link from 'next/link';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export function CallToAction() {
    return (
        <section className="py-24 bg-blue-600 dark:bg-blue-700 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

            <div className="container mx-auto px-4 relative z-10 text-center">
                <h2 className="text-4xl md:text-5xl font-bold mb-8">
                    Your Website Is Silent. <br />
                    <span className="text-blue-100">WebRep Makes It Speak.</span>
                </h2>
                <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
                    Resolve visitor confusion and drive conversions for a fraction of the cost of hiring a sales team.
                </p>

                <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-12">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-blue-200" />
                        <span>Works on any platform</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-blue-200" />
                        <span>No migration required</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-blue-200" />
                        <span>No maintenance</span>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/onboarding"
                        className="px-8 py-4 bg-white text-blue-600 rounded-lg font-bold text-lg hover:bg-blue-50 transition-colors shadow-lg flex items-center justify-center gap-2"
                    >
                        Start Free Trial
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                    <Link
                        href="/demo-embed"
                        className="px-8 py-4 bg-blue-700 border border-blue-500 text-white rounded-lg font-bold text-lg hover:bg-blue-800 transition-colors flex items-center justify-center"
                    >
                        Learn More
                    </Link>
                </div>
            </div>
        </section>
    );
}
