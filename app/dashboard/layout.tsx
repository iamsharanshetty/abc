import { Sidebar } from "@/components/Sidebar"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen flex-col md:flex-row">
            <aside className="w-full md:w-64 border-r bg-background">
                <Sidebar className="hidden md:block" />
            </aside>
            <main className="flex-1 p-6">
                {children}
            </main>
        </div>
    )
}
