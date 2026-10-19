import {cn} from "@/lib/utils"

interface SwitchProps {
    checked: boolean
    onChange: (checked: boolean) => void
    id?: string
    "aria-describedby"?: string
    "aria-label"?: string
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
                // A larger invisible hit area than the 24px-tall track, for fingertips.
                "after:absolute after:-inset-x-1 after:-inset-y-2.5 after:content-['']",
                checked ? "bg-brand-600" : "bg-base-300 dark:bg-base-700",
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
