import {useEffect, useRef, useState, type ReactNode} from "react"
import {createPortal} from "react-dom"
import {X} from "lucide-react"
import {cn} from "@/lib/utils"

interface DrawerProps {
    open: boolean
    onClose: () => void
    title: string
    closeLabel: string
    /** Which edge it slides in from. */
    side?: "left" | "right"
    /** No frame or title bar of its own: the content is the panel (the phone sidebar). */
    bare?: boolean
    children: ReactNode
}

/**
 * A floating panel that slides in from the right over a dimmed page, inset from the window's
 * edges like the sidebar. Escape, the backdrop and the close button close it; focus moves into it
 * on open, stays inside while it is open, and goes back to where it was on close. It stays mounted
 * through its exit animation.
 */
export function Drawer({open, onClose, title, closeLabel, side = "right", bare = false, children}: DrawerProps) {
    const [mounted, setMounted] = useState(open)
    const panel = useRef<HTMLDivElement>(null)
    const returnFocus = useRef<HTMLElement | null>(null)

    // Mount on open; on close, unmount once the exit animation ends (see onAnimationEnd below).
    if (open && !mounted) setMounted(true)

    useEffect(() => {
        if (!open) return
        returnFocus.current = document.activeElement as HTMLElement | null
        panel.current?.focus()
        const overflow = document.body.style.overflow
        document.body.style.overflow = "hidden"

        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose()
            if (event.key !== "Tab" || !panel.current) return
            // Keep Tab inside the panel.
            const focusable = panel.current.querySelectorAll<HTMLElement>("button, a[href], input, [tabindex]:not([tabindex='-1'])")
            const first = focusable[0]
            const last = focusable[focusable.length - 1]
            if (!first || !last) return
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault()
                last.focus()
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault()
                first.focus()
            }
        }
        window.addEventListener("keydown", onKey)
        return () => {
            window.removeEventListener("keydown", onKey)
            document.body.style.overflow = overflow
            returnFocus.current?.focus()
        }
    }, [open, onClose])

    if (!mounted) return null

    return createPortal(
        <div className="fixed inset-0 z-50" data-state={open ? "open" : "closed"}>
            <div
                aria-hidden="true"
                onClick={onClose}
                className={cn("absolute inset-0 bg-base-950/40 backdrop-blur-[2px]", open ? "dr-fade-in" : "dr-fade-out")}
            />
            <div
                ref={panel}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                tabIndex={-1}
                onAnimationEnd={event => {
                    if (!open && event.target === event.currentTarget) setMounted(false)
                }}
                className={cn(
                    "absolute inset-y-2 flex flex-col outline-none sm:inset-y-3",
                    side === "right" ? "right-2 sm:right-3" : "left-2 sm:left-3",
                    !bare && "w-[min(26rem,calc(100vw-1rem))] overflow-hidden rounded-[18px] border border-base-200 bg-white shadow-[0_24px_64px_-24px_rgb(0_0_0/0.35)] dark:border-base-800 dark:bg-base-900 dark:shadow-[0_24px_64px_-24px_rgb(0_0_0/0.8)]",
                    side === "right" ? (open ? "dr-slide-in" : "dr-slide-out") : (open ? "dr-slide-in-left" : "dr-slide-out-left"),
                )}
            >
                {bare ? children : (
                    <>
                        <div className="flex h-[4.5rem] shrink-0 items-center justify-between border-b border-base-200 px-5 dark:border-base-800">
                            <h2 className="text-lg font-bold tracking-tight">{title}</h2>
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label={closeLabel}
                                className="group/close grid size-9 place-items-center border border-transparent text-base-500 transition-colors hover:border-dashed hover:border-base-300 hover:text-base-900 dark:hover:border-base-700 dark:hover:text-base-100"
                            >
                                <X className="size-4 transition-transform duration-300 group-hover/close:rotate-90" strokeWidth={1.5}/>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-5 py-6">{children}</div>
                    </>
                )}
            </div>
        </div>,
        document.body,
    )
}
