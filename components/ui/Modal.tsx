import * as React from "react"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    children: React.ReactNode
    footer?: React.ReactNode
    className?: string
}

export function Modal({
    isOpen,
    onClose,
    title,
    children,
    footer,
    className,
}: ModalProps) {
    const overlayRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose()
            }
        }

        if (isOpen) {
            document.addEventListener("keydown", handleEscape)
            document.body.style.overflow = "hidden"
        }

        return () => {
            document.removeEventListener("keydown", handleEscape)
            document.body.style.overflow = "unset"
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === overlayRef.current) {
            onClose()
        }
    }

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleOverlayClick}
        >
            <div
                className={cn(
                    "relative z-50 w-full max-w-lg gap-4 border bg-background p-6 shadow-lg duration-200 animate-in fade-in zoom-in-95 sm:rounded-lg",
                    className
                )}
            >
                <div className="flex flex-col space-y-1.5 text-center sm:text-left">
                    {title && (
                        <h2 className="text-lg font-semibold leading-none tracking-tight">
                            {title}
                        </h2>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                        onClick={onClose}
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </Button>
                </div>
                <div className="py-4">{children}</div>
                {footer && (
                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    )
}
