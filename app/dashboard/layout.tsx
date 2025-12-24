import { Sidebar } from "@/components/Sidebar"
import { MobileNav } from "@/components/MobileNav"
import { ChevronDown } from "lucide-react"
import { ThemeToggle } from "@/components/ThemeToggle"
import { DynamicPageTitle } from "@/components/DynamicPageTitle"
import { UserNav } from "@/components/dashboard/UserNav"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user: supabaseUser } } = await supabase.auth.getUser()

    const cookieStore = await cookies()
    const isDev = cookieStore.get('dev-auth')?.value === 'true'

    const user = supabaseUser || (isDev ? {
        email: 'arjun@gmail.com',
        user_metadata: {
            full_name: 'Arjun',
            avatar_url: null
        }
    } : null)

    // Check onboarding status for real users
    if (supabaseUser) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('domain_occupation')
            .eq('id', supabaseUser.id)
            .single() as { data: { domain_occupation: string | null } | null, error: any }

        if (!profile || !profile.domain_occupation) {
            redirect('/onboarding')
        }
    }

    return (
        <div className="flex min-h-screen bg-background">
            {/* Sidebar */}
            <aside className="hidden md:block w-72 fixed inset-y-0 z-50">
                <Sidebar className="h-full w-full" />
            </aside>

            {/* Main Content */}
            <div className="flex-1 md:ml-72 flex flex-col min-h-screen bg-background transition-colors">
                {/* Header */}
                <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50 px-8 py-4 flex items-center justify-between transition-colors">
                    <div className="md:hidden flex items-center gap-4">
                        <MobileNav />
                        <span className="font-bold text-lg dark:text-white">WEBREP</span>
                    </div>

                    {/* Left side of header (Page Title) */}
                    <div className="hidden md:block">
                        <DynamicPageTitle />
                    </div>

                    {/* Right side: User & Company */}
                    <div className="flex items-center gap-4 ml-auto">
                        <ThemeToggle />

                        <div className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border/50 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
                            <span className="text-sm font-medium text-foreground">Acme Inc.</span>
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </div>

                        {/* Profile Dropdown */}
                        <UserNav user={{
                            email: user?.email,
                            full_name: user?.user_metadata?.full_name,
                            avatar_url: user?.user_metadata?.avatar_url
                        }} />
                    </div>
                </header>

                <main className="flex-1 p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
