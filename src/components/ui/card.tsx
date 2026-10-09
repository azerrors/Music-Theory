import type {HTMLAttributes} from "react"
import {cn} from "@/lib/utils"

export function Card({className, ...props}: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900", className)}
            {...props}
        />
    )
}

export function CardTitle({className, ...props}: HTMLAttributes<HTMLHeadingElement>) {
    return <h3 className={cn("text-base font-semibold tracking-tight", className)} {...props}/>
}

export function CardDescription({className, ...props}: HTMLAttributes<HTMLParagraphElement>) {
    return <p className={cn("text-sm text-stone-600 dark:text-stone-400", className)} {...props}/>
}
