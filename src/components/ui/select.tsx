import type {SelectHTMLAttributes} from "react"
import {ChevronDown} from "lucide-react"
import {cn} from "@/lib/utils"

/** Native select styled to match the rest of the UI — accessible and mobile-friendly for free. */
export function Select({className, children, ...props}: SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <div className={cn("relative inline-flex", className)}>
            <select
                className="h-9 w-full appearance-none pointer-coarse:h-11 rounded-lg border border-stone-300 bg-white pr-9 pl-3 text-sm font-medium hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900"
                {...props}
            >
                {children}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-stone-500"/>
        </div>
    )
}
