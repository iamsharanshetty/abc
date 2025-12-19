import { Navbar } from "@/components/Navbar"
import { Pricing } from "@/components/marketing/Pricing"
import { PricingAddons } from "@/components/marketing/PricingAddons"
import { PricingFAQ } from "@/components/marketing/PricingFAQ"
import Link from 'next/link'

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors selection:bg-blue-500/30">
            <Navbar />
            <main className="flex-1">
                <Pricing />
                <PricingAddons />
                <PricingFAQ />

                {/* Final CTA Strip */}
                <section className="py-24 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                    <div className="container mx-auto px-4 text-center">
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
                            Start converting more visitors without rebuilding your website
                        </h2>
                        <p className="text-xl text-slate-600 dark:text-slate-300 mb-12 max-w-2xl mx-auto">
                            If your website gets traffic but leads are inconsistent, WebRep adds the missing conversion layer.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/onboarding"
                                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-all shadow-lg shadow-blue-500/25"
                            >
                                Start Free Trial
                            </Link>
                            <Link
                                href="/demo"
                                className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg font-semibold text-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
                            >
                                Request a Demo
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="bg-slate-50 dark:bg-slate-950 py-12 border-t border-slate-200 dark:border-slate-800">
                <div className="container mx-auto px-4 text-center text-slate-500 dark:text-slate-400">
                    <p>© {new Date().getFullYear()} WebRep. All rights reserved.</p>
                </div>
            </footer>
        </div>
    )
}
