"use client"

import * as React from "react"
import Link from "next/link"
import { Menu } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"

export function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false)

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background">
            <div className="container flex h-16 items-center justify-between px-4 md:px-6">
                <div className="flex gap-6 md:gap-10">
                    <Link href="/" className="flex items-center space-x-2">
                        <span className="inline-block font-bold">WebRep</span>
                    </Link>
                    <nav className="hidden gap-6 md:flex">
                        <Link
                            href="#"
                            className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                        >
                            Features
                        </Link>
                        <Link
                            href="#"
                            className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                        >
                            Pricing
                        </Link>
                        <Link
                            href="#"
                            className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                        >
                            About
                        </Link>
                    </nav>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="hidden md:flex md:items-center md:space-x-4">
                        <Button variant="ghost" size="sm">
                            Log in
                        </Button>
                        <Button size="sm">Sign up</Button>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Toggle menu</span>
                    </Button>
                </div>
            </div>
            {isMenuOpen && (
                <div className="container md:hidden">
                    <nav className="flex flex-col space-y-4 px-4 py-4">
                        <Link
                            href="#"
                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                        >
                            Features
                        </Link>
                        <Link
                            href="#"
                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                        >
                            Pricing
                        </Link>
                        <Link
                            href="#"
                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                        >
                            About
                        </Link>
                        <div className="flex flex-col space-y-2 pt-4">
                            <Button variant="ghost" size="sm" className="w-full justify-start">
                                Log in
                            </Button>
                            <Button size="sm" className="w-full justify-start">
                                Sign up
                            </Button>
                        </div>
                    </nav>
                </div>
            )}
        </header>
    )
}
