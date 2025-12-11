import { Navbar } from "@/components/Navbar"
import { UrlInputForm } from "@/components/UrlInputForm"

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4 bg-muted/20">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
              WebRep
            </h1>
            <p className="text-muted-foreground text-lg">
              Instant website reputation analysis.
            </p>
          </div>
          <UrlInputForm />
        </div>
      </main>
    </div>
  )
}
