import {useLayoutEffect, useRef, type KeyboardEvent} from "react"
import {DEFAULT_FRET_COUNT, DOUBLE_INLAY_FRETS, INLAY_FRETS} from "@/constants/notes"
import {useSettings} from "@/hooks/useSettings"
import type {FretMarker} from "@/lib/theory/fretboard"
import {formatNote} from "@/lib/theory/notes"
import {cn} from "@/lib/utils"

interface FretboardProps {
    markers: FretMarker[]
    fretCount?: number
    /** Makes every position clickable — used by the chord finder. */
    onPositionClick?: (string: number, fret: number) => void
    ariaLabel: string
    className?: string
}

const FRET_WIDTH = 54
const OPEN_WIDTH = 40
const STRING_GAP = 28
const PADDING_X = 10
const TOP = 18
const BOTTOM = 30
const MARKER_RADIUS = 11.5

export function Fretboard({markers, fretCount = DEFAULT_FRET_COUNT, onPositionClick, ariaLabel, className}: FretboardProps) {
    const {tuning, leftHanded, labelMode, notation} = useSettings()
    const scrollRef = useRef<HTMLDivElement>(null)
    const stringCount = tuning.strings.length

    // On narrow screens the board scrolls; start at the nut, which is on the right for left-handers.
    useLayoutEffect(() => {
        const container = scrollRef.current
        if (container) container.scrollLeft = leftHanded ? container.scrollWidth : 0
    }, [leftHanded])

    const boardHeight = STRING_GAP * (stringCount - 1)
    const width = PADDING_X * 2 + OPEN_WIDTH + FRET_WIDTH * fretCount
    const height = TOP + boardHeight + BOTTOM
    const nutX = PADDING_X + OPEN_WIDTH

    const mirror = (x: number) => (leftHanded ? width - x : x)
    const wireX = (wire: number) => mirror(nutX + FRET_WIDTH * wire)
    const fretCenterX = (fret: number) => mirror(fret === 0 ? PADDING_X + OPEN_WIDTH / 2 : nutX + FRET_WIDTH * (fret - 0.5))
    // High e on top, like tablature.
    const stringY = (string: number) => TOP + STRING_GAP * (stringCount - 1 - string)
    const midY = TOP + boardHeight / 2

    const boardLeft = Math.min(wireX(0), wireX(fretCount))
    const label = (marker: FretMarker) =>
        marker.label ?? (labelMode === "degree" && marker.degree ? marker.degree : formatNote(marker.note, notation))

    const handleKey = (event: KeyboardEvent, string: number, fret: number) => {
        if (event.key !== "Enter" && event.key !== " ") return
        event.preventDefault()
        onPositionClick?.(string, fret)
    }

    return (
        <div ref={scrollRef} className={cn("overflow-x-auto rounded-xl border border-stone-200 bg-white p-2 dark:border-stone-800 dark:bg-stone-900", className)}>
            <svg viewBox={`0 0 ${width} ${height}`} className="h-auto min-w-[720px] w-full select-none" role="group" aria-label={ariaLabel}>
                <rect
                    x={boardLeft}
                    y={TOP - 8}
                    width={FRET_WIDTH * fretCount}
                    height={boardHeight + 16}
                    rx={3}
                    className="fill-wood dark:fill-wood-dark"
                />

                {INLAY_FRETS.filter(fret => fret <= fretCount).map(fret => (
                    <circle key={fret} cx={fretCenterX(fret)} cy={midY} r={5} className="fill-stone-400/50"/>
                ))}
                {DOUBLE_INLAY_FRETS.filter(fret => fret <= fretCount).map(fret => (
                    <g key={fret} className="fill-stone-400/50">
                        <circle cx={fretCenterX(fret)} cy={midY - STRING_GAP} r={5}/>
                        <circle cx={fretCenterX(fret)} cy={midY + STRING_GAP} r={5}/>
                    </g>
                ))}

                {Array.from({length: fretCount + 1}, (_, wire) => (
                    <line
                        key={wire}
                        x1={wireX(wire)}
                        x2={wireX(wire)}
                        y1={TOP - 8}
                        y2={TOP + boardHeight + 8}
                        className={wire === 0 ? "stroke-stone-700 dark:stroke-stone-300" : "stroke-fret"}
                        strokeWidth={wire === 0 ? 5 : 2}
                    />
                ))}

                {tuning.strings.map((_, string) => (
                    <line
                        key={string}
                        x1={mirror(PADDING_X)}
                        x2={wireX(fretCount)}
                        y1={stringY(string)}
                        y2={stringY(string)}
                        className="stroke-stone-500 dark:stroke-stone-400"
                        // Lower strings are drawn thicker, like real wound strings.
                        strokeWidth={0.8 + (stringCount - 1 - string) * 0.35}
                    />
                ))}

                {Array.from({length: fretCount}, (_, index) => index + 1).map(fret => (
                    <text
                        key={fret}
                        x={fretCenterX(fret)}
                        y={height - 8}
                        textAnchor="middle"
                        className={cn(
                            "text-[11px] tabular-nums",
                            INLAY_FRETS.includes(fret) || DOUBLE_INLAY_FRETS.includes(fret) ? "fill-stone-600 font-semibold dark:fill-stone-300" : "fill-stone-400",
                        )}
                    >
                        {fret}
                    </text>
                ))}

                {onPositionClick && tuning.strings.map((openString, string) =>
                    Array.from({length: fretCount + 1}, (_, fret) => (
                        <rect
                            key={`${string}-${fret}`}
                            x={fretCenterX(fret) - (fret === 0 ? OPEN_WIDTH : FRET_WIDTH) / 2}
                            y={stringY(string) - STRING_GAP / 2}
                            width={fret === 0 ? OPEN_WIDTH : FRET_WIDTH}
                            height={STRING_GAP}
                            role="button"
                            tabIndex={0}
                            aria-label={`${openString} · ${fret}`}
                            onClick={() => onPositionClick(string, fret)}
                            onKeyDown={event => handleKey(event, string, fret)}
                            className="cursor-pointer fill-transparent outline-none hover:fill-brand-500/15 focus-visible:fill-brand-500/25"
                        />
                    )),
                )}

                {markers.map(marker => (
                    <g key={`${marker.string}-${marker.fret}`} className="pointer-events-none">
                        <circle
                            cx={fretCenterX(marker.fret)}
                            cy={stringY(marker.string)}
                            r={marker.small ? MARKER_RADIUS * 0.72 : MARKER_RADIUS}
                            className={marker.fillClass ?? (marker.isRoot
                                ? "fill-brand-600"
                                : "fill-stone-800 dark:fill-stone-100")}
                        />
                        <text
                            x={fretCenterX(marker.fret)}
                            y={stringY(marker.string) + (marker.small ? 3 : 4)}
                            textAnchor="middle"
                            className={cn(
                                marker.small ? "text-[9px] font-medium" : "text-[11px] font-semibold",
                                marker.textClass ?? (marker.isRoot ? "fill-white" : "fill-white dark:fill-stone-900"),
                            )}
                        >
                            {label(marker)}
                        </text>
                    </g>
                ))}
            </svg>
        </div>
    )
}
