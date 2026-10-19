import {useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode} from "react"
import {Check, ChevronDown} from "lucide-react"
import {cn} from "@/lib/utils"

export interface SelectOption {
    value: string
    label: string
}

export interface SelectGroup {
    label: string
    options: SelectOption[]
}

interface SelectProps {
    value: string
    onChange: (value: string) => void
    /** Accessible name; there is no visible label inside the control. */
    label: string
    options?: SelectOption[]
    groups?: SelectGroup[]
    /** Which edge the list lines up with. */
    align?: "start" | "end"
    /** Replaces the selected option's label inside the button (e.g. a short code). */
    renderValue?: (option: SelectOption | undefined) => ReactNode
    className?: string
    buttonClassName?: string
}

/**
 * A listbox select: a button that opens a floating panel of options, grouped when given groups.
 * Keyboard: arrows, Home/End and typing a letter move the highlight; Enter or Space picks;
 * Escape or Tab closes. The open list draws in from the button.
 */
export function Select({value, onChange, label, options, groups, align = "start", renderValue, className, buttonClassName}: SelectProps) {
    const id = useId()
    const [open, setOpen] = useState(false)
    const [highlight, setHighlight] = useState(0)
    const root = useRef<HTMLDivElement>(null)
    const list = useRef<HTMLUListElement>(null)
    const button = useRef<HTMLButtonElement>(null)

    const sections = useMemo<SelectGroup[]>(() => groups ?? [{label: "", options: options ?? []}], [groups, options])
    const flat = useMemo(() => sections.flatMap(section => section.options), [sections])
    // Where each section starts in the flat list, so every option knows its keyboard index.
    const offsets = useMemo(() => sections.map((_, at) => sections.slice(0, at).reduce((sum, section) => sum + section.options.length, 0)), [sections])
    const selectedIndex = flat.findIndex(option => option.value === value)
    const selected = flat[selectedIndex]

    const openList = () => {
        setHighlight(Math.max(selectedIndex, 0))
        setOpen(true)
    }
    const close = (focusButton = true) => {
        setOpen(false)
        if (focusButton) button.current?.focus()
    }
    const pick = (index: number) => {
        const option = flat[index]
        if (option) onChange(option.value)
        close()
    }

    // Close on a click outside.
    useEffect(() => {
        if (!open) return
        const onPointer = (event: PointerEvent) => {
            if (!root.current?.contains(event.target as Node)) setOpen(false)
        }
        window.addEventListener("pointerdown", onPointer)
        return () => window.removeEventListener("pointerdown", onPointer)
    }, [open])

    // Keep the highlighted option in view and focus the list while it is open.
    useEffect(() => {
        if (!open) return
        list.current?.focus()
        list.current?.querySelector(`[data-index="${highlight}"]`)?.scrollIntoView({block: "nearest"})
    }, [open, highlight])

    const onButtonKey = (event: KeyboardEvent) => {
        if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
            event.preventDefault()
            openList()
        }
    }

    const onListKey = (event: KeyboardEvent) => {
        const last = flat.length - 1
        const moves: Record<string, () => number> = {
            ArrowDown: () => Math.min(highlight + 1, last),
            ArrowUp: () => Math.max(highlight - 1, 0),
            Home: () => 0,
            End: () => last,
        }
        if (moves[event.key]) {
            event.preventDefault()
            setHighlight(moves[event.key]!())
        } else if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            pick(highlight)
        } else if (event.key === "Escape") {
            event.preventDefault()
            close()
        } else if (event.key === "Tab") {
            close(false)
        } else if (event.key.length === 1) {
            // Typeahead: jump to the next option starting with that letter.
            const letter = event.key.toLocaleLowerCase()
            const order = [...flat.keys()].map(offset => (highlight + 1 + offset) % flat.length)
            const match = order.find(index => flat[index]!.label.toLocaleLowerCase().startsWith(letter))
            if (match !== undefined) setHighlight(match)
        }
    }

    return (
        <div ref={root} className={cn("relative inline-flex", className)}>
            <button
                ref={button}
                type="button"
                role="combobox"
                aria-label={label}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={`${id}-list`}
                onClick={() => (open ? close() : openList())}
                onKeyDown={onButtonKey}
                className={cn(
                    "flex h-9 w-full items-center justify-between gap-2 rounded-lg border bg-white pr-2.5 pl-3 text-sm font-medium transition-colors pointer-coarse:h-11",
                    "border-base-300 hover:border-base-400 dark:border-base-700 dark:bg-base-900 dark:hover:border-base-600",
                    open && "border-brand-600 dark:border-brand-600",
                    buttonClassName,
                )}
            >
                <span className="truncate">{renderValue ? renderValue(selected) : selected?.label}</span>
                <ChevronDown className={cn("size-4 shrink-0 text-base-500 transition-transform duration-300", open && "rotate-180 text-brand-600")}/>
            </button>

            {open && (
                <ul
                    ref={list}
                    id={`${id}-list`}
                    role="listbox"
                    tabIndex={-1}
                    aria-label={label}
                    aria-activedescendant={`${id}-${highlight}`}
                    onKeyDown={onListKey}
                    className={cn(
                        "sel-enter absolute top-full z-50 mt-1.5 max-h-72 min-w-full overflow-y-auto rounded-xl border p-1.5 outline-none",
                        "border-base-200 bg-white shadow-[0_12px_32px_-12px_rgb(0_0_0/0.25)] dark:border-base-800 dark:bg-base-900 dark:shadow-[0_12px_32px_-12px_rgb(0_0_0/0.7)]",
                        align === "end" ? "right-0 origin-top-right" : "left-0 origin-top-left",
                    )}
                >
                    {sections.map((section, sectionIndex) => (
                        <li key={section.label || "options"} role="presentation">
                            {section.label && (
                                <p className="flex items-center gap-2 px-2.5 pt-2 pb-1 text-xs font-medium whitespace-nowrap text-base-500">
                                    <span aria-hidden="true" className="size-1 rounded-full bg-brand-600 opacity-70"/>
                                    {section.label}
                                </p>
                            )}
                            <ul role="group" aria-label={section.label || undefined}>
                                {section.options.map((option, at) => {
                                    const optionIndex = offsets[sectionIndex]! + at
                                    const isSelected = option.value === value
                                    const isHighlighted = optionIndex === highlight
                                    return (
                                        <li
                                            key={option.value}
                                            id={`${id}-${optionIndex}`}
                                            data-index={optionIndex}
                                            role="option"
                                            aria-selected={isSelected}
                                            onPointerEnter={() => setHighlight(optionIndex)}
                                            onClick={() => pick(optionIndex)}
                                            className={cn(
                                                "relative flex cursor-pointer items-center justify-between gap-6 rounded-md border px-2.5 py-2 text-sm whitespace-nowrap transition-colors duration-100",
                                                isHighlighted ? "border-dashed border-base-300 bg-base-100 dark:border-base-700 dark:bg-base-800/70" : "border-transparent",
                                                isSelected ? "font-medium text-brand-700 dark:text-brand-300" : "text-base-700 dark:text-base-300",
                                            )}
                                        >
                                            {option.label}
                                            <Check className={cn("size-4 shrink-0 text-brand-600 transition-opacity", isSelected ? "opacity-100" : "opacity-0")}/>
                                        </li>
                                    )
                                })}
                            </ul>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
