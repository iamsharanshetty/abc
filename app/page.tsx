import { Navbar } from "@/components/Navbar"
import { Hero } from "@/components/marketing/Hero"
import { Features } from "@/components/marketing/Features"
import { HowItWorks } from "@/components/marketing/HowItWorks"
import { Stats } from "@/components/marketing/Stats"
import { Comparison } from "@/components/marketing/Comparison"
import { Testimonials } from "@/components/marketing/Testimonials"
import { CallToAction } from "@/components/marketing/CallToAction"

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors selection:bg-blue-500/30">
      <Navbar />
      <main className="flex-1 -mt-16">
        <Hero />
        <Features />
        <HowItWorks />
        <Stats />
        <Comparison />
        <Testimonials />
        <CallToAction />
      </main>

      <footer className="bg-slate-50 dark:bg-slate-950 py-12 border-t border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 text-center text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} WebRep. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
