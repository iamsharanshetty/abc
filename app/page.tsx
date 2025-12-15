import { Navbar } from "@/components/Navbar"
import { UrlInputForm } from "@/components/UrlInputForm"

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center p-4 -mt-16">
        <div className="w-full max-w-4xl space-y-10 text-center">
          <div className="space-y-4">
            {/* Badge/Tag */}
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-medium mb-4">
              WEBREP V0.1
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Create AI Agents form <br className="hidden md:block" />
              <span className="text-blue-600 dark:text-blue-500">Your Website</span> Content
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-light">
              We analyze your website structure and content to build <br className="hidden md:block" />
              intelligent, context-aware AI agents in seconds.
            </p>
          </div>

          <UrlInputForm />

        </div>
      </main>
    </div>
  )
}
