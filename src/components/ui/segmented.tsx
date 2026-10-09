import {cn} from "@/lib/utils"

export interface SegmentedOption<T extends string> {
    value: T
    label: string
}

interface SegmentedProps<T extends string> {
    value: T
    options: SegmentedOption<T>[]
    onChange: (value: T) => void
    label: string
    className?: string
}

/** A row of mutually exclusive toggle buttons (a radio group that looks like tabs). */
export function Segmented<T extends string>({value, options, onChange, label, className}: SegmentedProps<T>) {
    return (
        <div role="radiogroup" aria-label={label} className={cn("flex flex-wrap gap-1.5", className)}>
            {options.map(option => {
                const isActive = option.value === value
                return (
                    <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={isActive}
                        onClick={() => onChange(option.value)}
                        className={cn(
                            "h-9 min-w-10 rounded-lg border px-3 text-sm font-medium transition-colors",
                            isActive
                                ? "border-brand-600 bg-brand-600 text-white"
                                : "border-stone-300 bg-white text-stone-700 hover:border-stone-400 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800",
                        )}
                    >
                        {option.label}
                    </button>
                )
            })}
        </div>
    )
}
