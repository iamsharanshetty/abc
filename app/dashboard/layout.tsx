import { Sidebar } from "@/components/Sidebar"
import { MobileNav } from "@/components/MobileNav"
import { ChevronDown, User } from "lucide-react"
import { ThemeToggle } from "@/components/ThemeToggle"
import { DynamicPageTitle } from "@/components/DynamicPageTitle"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Sidebar */}
            <aside className="hidden md:block w-72 fixed inset-y-0 z-50">
                <Sidebar className="h-full w-full shadow-lg shadow-slate-200/50" />
            </aside>

            {/* Main Content */}
            <div className="flex-1 md:ml-72 flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
                {/* Header */}
                <header className="sticky top-0 z-40 bg-white dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-8 py-4 flex items-center justify-between transition-colors">
                    <div className="md:hidden flex items-center gap-4">
                        <MobileNav />
                        <span className="font-bold text-lg dark:text-white">WEBREP</span>
                    </div>

                    {/* Left side of header (Page Title) */}
                    {/* Left side of header (Page Title) */}
                    <div className="hidden md:block">
                        {/* We can use a client component or just hardcode for now if we want to be quick, but a dynamic title is better */}
                        <DynamicPageTitle />
                    </div>

                    {/* Right side: User & Company */}
                    <div className="flex items-center gap-4 ml-auto">
                        <ThemeToggle />

                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Acme Inc.</span>
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                        </div>

                        {/* Profile Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <div className="h-9 w-9 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center border border-slate-100 dark:border-slate-700 overflow-hidden cursor-pointer hover:ring-2 hover:ring-slate-100 dark:hover:ring-slate-700 transition-all">
                                    <img
                                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=John"
                                        alt="User"
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[240px] p-2">
                                <DropdownMenuItem className="p-0 focus:bg-transparent mb-2">
                                    <div className="flex items-center gap-3 px-2 py-2 w-full">
                                        <div className="h-10 w-10 rounded-full border border-slate-100 overflow-hidden">
                                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=John" alt="User" className="h-full w-full object-cover" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">John Doe</span>
                                            <span className="text-xs text-slate-500">john@company.com</span>
                                        </div>
                                    </div>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="py-2.5 px-3 text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
                                    <a href="/dashboard/profile" className="w-full">Profile & Preferences</a>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="py-2.5 px-3 text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
                                    <a href="/dashboard/settings" className="w-full">Organization Setting</a>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="py-2.5 px-3 text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer">
                                    <a href="/dashboard/billing" className="w-full">Billing</a>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="py-2.5 px-3 text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-50">
                                    Sign Out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                <main className="flex-1 p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
