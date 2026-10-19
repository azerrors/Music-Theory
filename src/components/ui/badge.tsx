import type {HTMLAttributes} from "react"
import {cva, type VariantProps} from "class-variance-authority"
import {cn} from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex min-w-8 items-center justify-center rounded-md px-2 py-0.5 text-sm font-medium tabular-nums",
    {
        variants: {
            variant: {
                root: "bg-brand-600 text-on-brand",
                default: "bg-base-200/80 text-base-800 dark:bg-base-800 dark:text-base-200",
                outline: "border border-base-300 text-base-700 dark:border-base-700 dark:text-base-300",
            },
        },
        defaultVariants: {variant: "default"},
    },
)

type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>

export function Badge({className, variant, ...props}: BadgeProps) {
    return <span className={cn(badgeVariants({variant}), className)} {...props}/>
}
