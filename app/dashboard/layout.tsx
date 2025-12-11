import { Sidebar } from "@/components/Sidebar"
import { MobileNav } from "@/components/MobileNav"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen flex-col md:flex-row">
            {/* Mobile Header */}
            <div className="md:hidden flex items-center p-4 border-b bg-background">
                <MobileNav />
                <span className="font-semibold text-lg">Alenta Dashboard</span>
            </div>

            <aside className="hidden md:block w-full md:w-64 border-r bg-background">
                <Sidebar className="h-full" />
            </aside>
            <main className="flex-1 p-6">
                {children}
            </main>
        </div>
    )
}
