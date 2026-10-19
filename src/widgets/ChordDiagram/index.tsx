import {useSettings} from "@/hooks/useSettings"
import {chroma, formatNote} from "@/lib/theory/notes"
import {voicingFretRange, voicingPitches} from "@/lib/theory/voicings"
import {cn} from "@/lib/utils"
import type {NoteName, Voicing} from "@/types/music"

interface ChordDiagramProps {
    voicing: Voicing
    root: NoteName
    /** The chord's spelled notes, so "A#" on the neck shows as "Bb" in a Bb chord. */
    chordNotes: NoteName[]
    title?: string
    className?: string
}

const STRING_COUNT = 6
const STRING_GAP = 18
const FRET_GAP = 24
const LEFT = 34
const TOP = 30
const DOT_RADIUS = 7.5

export function ChordDiagram({voicing, root, chordNotes, title, className}: ChordDiagramProps) {
    const {leftHanded, notation} = useSettings()
    const {baseFret, span} = voicingFretRange(voicing)
    const pitches = voicingPitches(voicing)
    const rootChroma = chroma(root)

    const gridWidth = STRING_GAP * (STRING_COUNT - 1)
    const gridHeight = FRET_GAP * span
    const width = LEFT * 2 + gridWidth
    const height = TOP + gridHeight + 26

    const stringX = (string: number) => LEFT + STRING_GAP * (leftHanded ? STRING_COUNT - 1 - string : string)
    const fretY = (fret: number) => TOP + FRET_GAP * (fret - baseFret + 0.5)
    const noteLabel = (pitch: string) => {
        const spelled = chordNotes.find(note => chroma(note) === chroma(pitch)) ?? pitch.replace(/\d+$/, "")
        return formatNote(spelled, notation)
    }

    const barre = voicing.barre
    const barreXs = barre ? [stringX(barre.fromString), stringX(barre.toString)] : []
    const isUnderBarre = (string: number, fret: number | null) =>
        !!barre && fret === barre.fret && string >= barre.fromString && string <= barre.toString

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            className={cn("w-full max-w-44 select-none", className)}
            role="img"
            aria-label={title}
        >
            {title && <title>{title}</title>}

            {/* Fret lines; a thick nut when the diagram starts at the first fret. */}
            {Array.from({length: span + 1}, (_, index) => (
                <line
                    key={index}
                    x1={LEFT}
                    x2={LEFT + gridWidth}
                    y1={TOP + FRET_GAP * index}
                    y2={TOP + FRET_GAP * index}
                    className="stroke-base-400 dark:stroke-base-600"
                    strokeWidth={index === 0 && baseFret === 1 ? 4 : 1}
                />
            ))}
            {Array.from({length: STRING_COUNT}, (_, string) => (
                <line
                    key={string}
                    x1={stringX(string)}
                    x2={stringX(string)}
                    y1={TOP}
                    y2={TOP + gridHeight}
                    className="stroke-base-500 dark:stroke-base-400"
                    strokeWidth={1.1}
                />
            ))}

            {baseFret > 1 && (
                <text
                    x={leftHanded ? LEFT + gridWidth + DOT_RADIUS + 3 : LEFT - DOT_RADIUS - 3}
                    y={fretY(baseFret) + 4}
                    textAnchor={leftHanded ? "start" : "end"}
                    className="fill-base-500 text-[10px] font-medium"
                >
                    {baseFret}fr
                </text>
            )}

            {barre && (
                <g>
                    <rect
                        x={Math.min(...barreXs) - DOT_RADIUS}
                        y={fretY(barre.fret) - DOT_RADIUS}
                        width={Math.abs(barreXs[1]! - barreXs[0]!) + DOT_RADIUS * 2}
                        height={DOT_RADIUS * 2}
                        rx={DOT_RADIUS}
                        className="fill-brand-100 stroke-brand-400 dark:fill-brand-900 dark:stroke-brand-500"
                    />
                    <text
                        x={(barreXs[0]! + barreXs[1]!) / 2}
                        y={fretY(barre.fret) + 3.5}
                        textAnchor="middle"
                        className="fill-brand-900 text-[10px] font-semibold dark:fill-brand-100"
                    >
                        1
                    </text>
                </g>
            )}

            {voicing.frets.map((fret, string) => {
                const x = stringX(string)
                const pitch = pitches[string]

                if (fret === null) {
                    return (
                        <text key={string} x={x} y={TOP - 10} textAnchor="middle" className="fill-base-500 text-[11px]">
                            ×
                        </text>
                    )
                }

                const isRoot = !!pitch && chroma(pitch) === rootChroma

                if (fret === 0) {
                    return (
                        <circle
                            key={string}
                            cx={x}
                            cy={TOP - 13}
                            r={4}
                            fill="none"
                            strokeWidth={1.4}
                            className={isRoot ? "stroke-brand-600" : "stroke-base-500"}
                        />
                    )
                }

                // A root inside the barre is still marked, so the root is always visible.
                if (isUnderBarre(string, fret) && !isRoot) return null

                return (
                    <g key={string}>
                        <circle
                            cx={x}
                            cy={fretY(fret)}
                            r={DOT_RADIUS}
                            className={isRoot ? "fill-brand-600" : "fill-brand-100 stroke-brand-400 dark:fill-brand-900 dark:stroke-brand-500"}
                        />
                        <text
                            x={x}
                            y={fretY(fret) + 3.5}
                            textAnchor="middle"
                            className={cn("text-[10px] font-semibold", isRoot ? "fill-on-brand" : "fill-brand-900 dark:fill-brand-100")}
                        >
                            {voicing.fingers[string] ?? ""}
                        </text>
                    </g>
                )
            })}

            {/* Note names under each sounding string. */}
            {pitches.map((pitch, string) =>
                pitch ? (
                    <text
                        key={string}
                        x={stringX(string)}
                        y={TOP + gridHeight + 16}
                        textAnchor="middle"
                        className={cn(
                            "text-[10px] font-medium",
                            chroma(pitch) === rootChroma ? "fill-brand-700 dark:fill-brand-400" : "fill-base-500",
                        )}
                    >
                        {noteLabel(pitch)}
                    </text>
                ) : null,
            )}
        </svg>
    )
}
