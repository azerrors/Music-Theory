import type {HTMLAttributes} from "react"
import {cva, type VariantProps} from "class-variance-authority"
import {cn} from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex min-w-8 items-center justify-center rounded-md px-2 py-0.5 text-sm font-medium tabular-nums",
    {
        variants: {
            variant: {
                root: "bg-brand-600 text-white",
                default: "bg-stone-200/80 text-stone-800 dark:bg-stone-800 dark:text-stone-200",
                outline: "border border-stone-300 text-stone-700 dark:border-stone-700 dark:text-stone-300",
            },
        },
        defaultVariants: {variant: "default"},
    },
)

type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>

export function Badge({className, variant, ...props}: BadgeProps) {
    return <span className={cn(badgeVariants({variant}), className)} {...props}/>
}
