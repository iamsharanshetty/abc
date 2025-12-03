import { Sidebar } from "@/components/Sidebar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/Sheet"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/Button"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen flex-col md:flex-row">
            {/* Mobile Header */}
            <div className="md:hidden flex items-center p-4 border-b bg-background">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="mr-2">
                            <Menu className="h-6 w-6" />
                            <span className="sr-only">Open menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-64">
                        <Sidebar className="h-full" />
                    </SheetContent>
                </Sheet>
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
