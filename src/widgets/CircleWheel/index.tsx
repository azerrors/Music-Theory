import type {KeyboardEvent, ReactNode} from "react"
import type {CircleSlot, Ring} from "@/lib/practice/questions"
import {cn} from "@/lib/utils"
import {CENTER, INNER, MIDDLE, OUTER, polar, SIZE, slicePath, slotAngle} from "./geometry"

/** How a slice is marked: the right answer, a wrong pick, or the key the question starts from. */
export type SlotTone = "right" | "wrong" | "from"

interface CircleWheelProps {
    /** A slice's name, or null to leave it blank (the "names hidden" level). */
    labelOf: (slot: CircleSlot) => string | null
    toneOf: (slot: CircleSlot) => SlotTone | undefined
    onPick?: (slot: CircleSlot) => void
    /** What the hub shows, e.g. "?" or the answer's key signature. */
    center?: ReactNode
    ariaLabel: string
    className?: string
}

const RINGS: Ring[] = ["major", "minor"]

/** The circle of fifths as an answer pad: every slice can be picked and coloured. */
export function CircleWheel({labelOf, toneOf, onPick, center, ariaLabel, className}: CircleWheelProps) {
    const onKey = (event: KeyboardEvent, slot: CircleSlot) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            onPick?.(slot)
        }
    }

    return (
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className={cn("mx-auto w-full max-w-md select-none", className)} role="group" aria-label={ariaLabel}>
            {RINGS.map(ring => Array.from({length: 12}, (_, index) => {
                const slot = {ring, index}
                const tone = toneOf(slot)
                const label = labelOf(slot)
                const [inner, outer] = ring === "major" ? [MIDDLE, OUTER] : [INNER, MIDDLE]
                const [x, y] = polar((inner + outer) / 2, slotAngle(index))
                return (
                    <g
                        key={`${ring}-${index}`}
                        role={onPick ? "button" : undefined}
                        tabIndex={onPick ? 0 : undefined}
                        aria-label={label ?? `${ring} ${index + 1}`}
                        onClick={() => onPick?.(slot)}
                        onKeyDown={event => onKey(event, slot)}
                        className={cn("outline-none [&:focus-visible>path]:stroke-brand-500 [&:focus-visible>path]:stroke-[3]", onPick && "cursor-pointer")}
                    >
                        <path
                            d={slicePath(index, inner, outer)}
                            strokeWidth={2}
                            className={cn(
                                "stroke-white transition-colors duration-300 dark:stroke-base-950",
                                tone === "right" ? "fill-emerald-600"
                                    : tone === "wrong" ? "fill-rose-600"
                                    : tone === "from" ? "fill-brand-100 dark:fill-brand-950"
                                    : ring === "major"
                                        ? cn("fill-base-100 dark:fill-base-800", onPick && "hover:fill-base-200 dark:hover:fill-base-700")
                                        : cn("fill-base-200 dark:fill-base-900", onPick && "hover:fill-base-300 dark:hover:fill-base-800"),
                            )}
                        />
                        {tone === "from" && <path d={slicePath(index, inner + 3, outer - 3)} fill="none" strokeWidth={1.5} strokeDasharray="4 3" className="pointer-events-none stroke-brand-600"/>}
                        {label && (
                            <text
                                x={x}
                                y={y + 4}
                                textAnchor="middle"
                                className={cn(
                                    "pointer-events-none font-semibold",
                                    label.length > 5 ? "text-[10px]" : ring === "major" ? "text-[15px]" : "text-[12px]",
                                    tone === "right" || tone === "wrong" ? "fill-white" : tone === "from" ? "fill-brand-700 dark:fill-brand-300" : "fill-base-800 dark:fill-base-100",
                                )}
                            >
                                {label}
                            </text>
                        )}
                    </g>
                )
            }))}
            <circle cx={CENTER} cy={CENTER} r={INNER - 4} className="fill-white dark:fill-base-900"/>
            <text x={CENTER} y={CENTER + 8} textAnchor="middle" className="fill-base-900 text-[24px] font-bold dark:fill-base-100">{center}</text>
        </svg>
    )
}
