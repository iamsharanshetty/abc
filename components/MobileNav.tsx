"use client"

import * as React from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/Sheet"
import { Sidebar } from "@/components/Sidebar"

export function MobileNav() {
    const [open, setOpen] = React.useState(false)

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="mr-2" suppressHydrationWarning>
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Open menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
                <Sidebar className="h-full" onLinkClick={() => setOpen(false)} />
            </SheetContent>
        </Sheet>
    )
}
