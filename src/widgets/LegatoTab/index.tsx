import type {LegatoGroup} from "@/lib/practice/legato"
import {cn} from "@/lib/utils"

interface LegatoTabProps {
    groups: LegatoGroup[]
    stringCount: number
    /** String names, low to high; shown before the first group. */
    stringNames: string[]
    selected: number
    onSelect: (index: number) => void
    label: string
}

const TECHNIQUE_MARK = {pick: "", hammer: "H", pull: "P"} as const

/**
 * Tablature, one bar per hand placement: hammer-ons and pull-offs marked above, fingers below,
 * the high string on top. Bars wrap like lines of a page; clicking one selects it.
 */
export function LegatoTab({groups, stringCount, stringNames, selected, onSelect, label}: LegatoTabProps) {
    const highToLow = Array.from({length: stringCount}, (_, index) => stringCount - 1 - index)

    const cell = "grid h-5 w-7 place-items-center"
    const line = "h-px flex-1 bg-base-300 dark:bg-base-700"

    return (
        <div role="group" aria-label={label} className="flex flex-wrap gap-y-4 font-mono text-xs">
            <div aria-hidden="true" className="pr-1 text-base-400">
                <div className="h-5"/>
                {highToLow.map(string => <div key={string} className="flex h-5 items-center">{stringNames[string]}</div>)}
            </div>
            {groups.map((group, index) => (
                <button
                    key={index}
                    type="button"
                    onClick={() => onSelect(index)}
                    aria-pressed={index === selected}
                    aria-label={`${index + 1}`}
                    className={cn(
                        "rounded-md border-l-2 px-1 transition-colors",
                        index === selected
                            ? "border-l-brand-600 bg-brand-50 dark:bg-brand-950/60"
                            : "border-l-base-300 hover:bg-base-100 dark:border-l-base-700 dark:hover:bg-base-800/60",
                    )}
                >
                    <div className="flex text-[10px] font-semibold text-brand-700 dark:text-brand-300">
                        {group.map((note, at) => <span key={at} className={cell}>{TECHNIQUE_MARK[note.technique]}</span>)}
                    </div>
                    {highToLow.map(string => (
                        <div key={string} className="flex">
                            {/* The string line breaks around each fret number, so it reads on any background. */}
                            {group.map((note, at) => (
                                <span key={at} className="flex h-5 w-7 items-center">
                                    <span className={line}/>
                                    {note.string === string && (
                                        <>
                                            <span className="px-0.5 font-semibold text-base-900 tabular-nums dark:text-base-100">{note.fret}</span>
                                            <span className={line}/>
                                        </>
                                    )}
                                </span>
                            ))}
                        </div>
                    ))}
                    <div className="flex">
                        {group.map((note, at) => (
                            <span key={at} className={cn(cell, note.finger >= 3 ? "font-bold text-brand-700 dark:text-brand-300" : "text-base-500")}>{note.finger}</span>
                        ))}
                    </div>
                </button>
            ))}
        </div>
    )
}
