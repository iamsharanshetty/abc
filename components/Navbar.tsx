"use client"

import * as React from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { ThemeToggle } from "@/components/ThemeToggle"
import { createClient } from "@/lib/supabase/client"
import { UserNav } from "@/components/dashboard/UserNav"

export function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false)
    const [scrolled, setScrolled] = React.useState(false)
    const [user, setUser] = React.useState<any>(null)
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20)
        }
        window.addEventListener("scroll", handleScroll)

        const checkUser = async () => {
            try {
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    setUser({
                        email: user.email,
                        full_name: user.user_metadata?.full_name,
                        avatar_url: user.user_metadata?.avatar_url
                    })
                }
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        checkUser()

        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    return (
        <>
            <motion.header
                className={cn(
                    "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
                    scrolled ? "py-4" : "py-6"
                )}
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="container mx-auto px-4">
                    <nav className={cn(
                        "rounded-full border transition-all duration-300 flex items-center justify-between px-6 py-3",
                        scrolled
                            ? "bg-background/80 backdrop-blur-md border-border shadow-sm support-[backdrop-filter]:bg-background/60"
                            : "bg-transparent border-transparent"
                    )}>
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300">
                                W
                            </div>
                            <span className="font-bold text-lg tracking-tight select-none">WebRep</span>
                        </Link>

                        {/* Desktop Nav */}
                        <div className="hidden md:flex items-center gap-8">
                            {['Features', 'Pricing', 'About'].map((item) => (
                                <Link
                                    key={item}
                                    href={`/${item.toLowerCase()}`}
                                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
                                >
                                    {item}
                                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-foreground transition-all duration-300 group-hover:w-full opacity-0 group-hover:opacity-100" />
                                </Link>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="hidden md:flex items-center gap-4">
                            <ThemeToggle />
                            <div className="w-px h-4 bg-border" />
                            {loading ? (
                                <div className="h-9 w-20 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-md" />
                            ) : user ? (
                                <div className="flex items-center gap-4">
                                    <Link href="/dashboard">
                                        <Button variant="ghost" size="sm" className="font-medium">
                                            Dashboard
                                        </Button>
                                    </Link>
                                    <UserNav user={user} />
                                </div>
                            ) : (
                                <>
                                    <Link href="/login">
                                        <Button variant="ghost" size="sm" className="font-medium">
                                            Log in
                                        </Button>
                                    </Link>
                                    <Link href="/login">
                                        <Button size="sm" className="rounded-full px-6 bg-foreground text-background hover:bg-foreground/90 font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5">
                                            Start Free
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Mobile Toggle */}
                        <button
                            className="md:hidden p-2 text-foreground"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X /> : <Menu />}
                        </button>
                    </nav>
                </div>
            </motion.header>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-0 z-40 bg-background pt-24 px-4 md:hidden"
                    >
                        <nav className="flex flex-col gap-4 text-lg font-medium">
                            {['Features', 'Pricing', 'About'].map((item) => (
                                <Link
                                    key={item}
                                    href={`/${item.toLowerCase()}`}
                                    onClick={() => setIsMenuOpen(false)}
                                    className="p-4 border-b border-border/50"
                                >
                                    {item}
                                </Link>
                            ))}
                            <div className="flex flex-col gap-4 mt-8">
                                <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                                    <Button className="w-full justify-center" size="lg">
                                        Start Free Trial
                                    </Button>
                                </Link>
                                <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                                    <Button variant="outline" className="w-full justify-center" size="lg">
                                        Log in
                                    </Button>
                                </Link>
                            </div>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
