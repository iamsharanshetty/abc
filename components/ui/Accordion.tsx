import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

const Accordion = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("w-full", className)} {...props} />
))
Accordion.displayName = "Accordion"

const AccordionItem = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("border-b", className)} {...props} />
))
AccordionItem.displayName = "AccordionItem"

interface AccordionTriggerProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isOpen?: boolean
}

const AccordionTrigger = React.forwardRef<
    HTMLButtonElement,
    AccordionTriggerProps
>(({ className, children, isOpen, ...props }, ref) => (
    <div className="flex">
        <button
            ref={ref}
            className={cn(
                "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
                className
            )}
            data-state={isOpen ? "open" : "closed"}
            {...props}
        >
            {children}
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
        </button>
    </div>
))
AccordionTrigger.displayName = "AccordionTrigger"

interface AccordionContentProps
    extends React.HTMLAttributes<HTMLDivElement> {
    isOpen?: boolean
}

const AccordionContent = React.forwardRef<
    HTMLDivElement,
    AccordionContentProps
>(({ className, children, isOpen, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
            isOpen ? "block" : "hidden",
            className
        )}
        data-state={isOpen ? "open" : "closed"}
        {...props}
    >
        <div className="pb-4 pt-0">{children}</div>
    </div>
))
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
