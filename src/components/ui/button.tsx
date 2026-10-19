import type {ButtonHTMLAttributes} from "react"
import {cva, type VariantProps} from "class-variance-authority"
import {cn} from "@/lib/utils"

export const buttonVariants = cva(
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
    {
        variants: {
            variant: {
                primary: "bg-brand-600 text-on-brand hover:bg-brand-700",
                secondary: "bg-base-200/70 text-base-900 hover:bg-base-200 dark:bg-base-800 dark:text-base-100 dark:hover:bg-base-700",
                outline: "border border-base-300 bg-transparent hover:bg-base-100 dark:border-base-700 dark:hover:bg-base-800",
                ghost: "hover:bg-base-200/60 dark:hover:bg-base-800",
            },
            size: {
                sm: "h-8 px-3 pointer-coarse:h-10",
                md: "h-9 px-4 pointer-coarse:h-11",
                lg: "h-11 px-5 text-base pointer-coarse:h-12",
                icon: "size-9 pointer-coarse:size-11",
            },
        },
        defaultVariants: {
            variant: "primary",
            size: "md",
        },
    },
)

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>

export function Button({className, variant, size, type = "button", ...props}: ButtonProps) {
    return <button type={type} className={cn(buttonVariants({variant, size}), className)} {...props}/>
}
