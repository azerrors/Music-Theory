import type {ButtonHTMLAttributes} from "react"
import {cva, type VariantProps} from "class-variance-authority"
import {cn} from "@/lib/utils"

export const buttonVariants = cva(
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
    {
        variants: {
            variant: {
                primary: "bg-brand-600 text-white hover:bg-brand-700",
                secondary: "bg-stone-200/70 text-stone-900 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700",
                outline: "border border-stone-300 bg-transparent hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800",
                ghost: "hover:bg-stone-200/60 dark:hover:bg-stone-800",
            },
            size: {
                sm: "h-8 px-3",
                md: "h-9 px-4",
                icon: "size-9",
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
