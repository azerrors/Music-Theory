import {cn} from "@/lib/utils"

interface SwitchProps {
    checked: boolean
    onChange: (checked: boolean) => void
    id?: string
    "aria-describedby"?: string
}

export function Switch({checked, onChange, ...props}: SwitchProps) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={cn(
                "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
                checked ? "bg-brand-600" : "bg-stone-300 dark:bg-stone-700",
            )}
            {...props}
        >
            <span
                className={cn(
                    "inline-block size-5 rounded-full bg-white shadow transition-transform",
                    checked ? "translate-x-5.5" : "translate-x-0.5",
                )}
            />
        </button>
    )
}
