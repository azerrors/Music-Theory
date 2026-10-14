import {cn} from "@/lib/utils"

export interface KeyMarker {
    midi: number
    label: string
    isRoot?: boolean
    /** Played by the left hand — drawn in a different colour. */
    isLeftHand?: boolean
    /** A background note (e.g. a passing scale note): small grey dot, key not tinted. */
    subtle?: boolean
    /** Finger number (1 = thumb … 5 = little finger), written under the key like a fingering in sheet music. */
    finger?: number
    /** Overrides the dot colour, e.g. for notes outside the key. */
    fillClass?: string
}

interface PianoKeyboardProps {
    /** First and last MIDI note drawn; `from` should be a white key. */
    from: number
    to: number
    markers: KeyMarker[]
    onKeyClick?: (midi: number) => void
    /** Narrowest a white key may get before the keyboard scrolls; small previews go lower. */
    minKeyWidth?: number
    /** The C4, C5… labels under the keys. */
    showOctaves?: boolean
    ariaLabel?: string
    className?: string
}

const WHITE_WIDTH = 22
const WHITE_HEIGHT = 96
const BLACK_WIDTH = 13
const BLACK_HEIGHT = 60
const MARKER_RADIUS = 8.5
const OCTAVE_LABEL_HEIGHT = 14
/** Two staggered lines: black-key fingers on top, white-key fingers below, so neighbours never touch. */
const FINGER_ROW_HEIGHT = 26
const MIN_WHITE_KEY_PX = 16

const BLACK_PITCHES = new Set([1, 3, 6, 8, 10])
const isBlack = (midi: number) => BLACK_PITCHES.has(((midi % 12) + 12) % 12)
/** "C4" is middle C, matching scientific pitch notation. */
const octaveOf = (midi: number) => Math.floor(midi / 12) - 1

export function PianoKeyboard({from, to, markers, onKeyClick, minKeyWidth = MIN_WHITE_KEY_PX, showOctaves = true, ariaLabel, className}: PianoKeyboardProps) {
    const keys = Array.from({length: to - from + 1}, (_, index) => from + index)
    const whiteKeys = keys.filter(midi => !isBlack(midi))
    const markerOf = new Map(markers.map(marker => [marker.midi, marker]))

    // A black key straddles the line between the white key below it and the next one.
    const whiteIndex = new Map(whiteKeys.map((midi, index) => [midi, index]))
    const keyX = (midi: number) => isBlack(midi)
        ? (whiteIndex.get(midi - 1) ?? 0) * WHITE_WIDTH + WHITE_WIDTH - BLACK_WIDTH / 2
        : (whiteIndex.get(midi) ?? 0) * WHITE_WIDTH

    const width = whiteKeys.length * WHITE_WIDTH
    const fingered = markers.filter(marker => marker.finger !== undefined)
    const fingerRow = fingered.length > 0 ? FINGER_ROW_HEIGHT : 0
    const height = WHITE_HEIGHT + fingerRow + (showOctaves ? OCTAVE_LABEL_HEIGHT : 2)

    // Keys stay ivory in dark mode too, so the markers keep one colour in both themes.
    const markerFill = (marker: KeyMarker) => marker.fillClass ?? (marker.subtle
        ? "fill-stone-300"
        : marker.isLeftHand
        ? "fill-sky-600"
        : marker.isRoot ? "fill-brand-600" : "fill-stone-800")

    const renderKey = (midi: number) => {
        const black = isBlack(midi)
        const marker = markerOf.get(midi)
        const tinted = !!marker && !marker.subtle
        const x = keyX(midi)
        const keyWidth = black ? BLACK_WIDTH : WHITE_WIDTH
        const keyHeight = black ? BLACK_HEIGHT : WHITE_HEIGHT

        return (
            <g key={midi}>
                <rect
                    x={x + (black ? 0 : 0.5)}
                    y={0.5}
                    width={keyWidth - (black ? 0 : 1)}
                    height={keyHeight}
                    rx={black ? 2 : 3}
                    onClick={onKeyClick ? () => onKeyClick(midi) : undefined}
                    className={cn(
                        black
                            ? tinted ? "fill-stone-600 dark:fill-stone-500" : "fill-stone-900 dark:fill-stone-950"
                            : tinted ? "fill-brand-100 dark:fill-brand-200" : "fill-white dark:fill-stone-100",
                        "stroke-stone-400 dark:stroke-stone-600",
                        onKeyClick && (black ? "cursor-pointer hover:fill-stone-700" : "cursor-pointer hover:fill-stone-100 dark:hover:fill-stone-300"),
                    )}
                    strokeWidth={black ? 0.5 : 1}
                />
                {marker && (
                    <g className="pointer-events-none">
                        <circle
                            cx={x + keyWidth / 2}
                            cy={keyHeight - MARKER_RADIUS - (black ? 5 : 7)}
                            r={(black ? MARKER_RADIUS - 2 : MARKER_RADIUS) * (marker.subtle ? 0.75 : 1)}
                            className={markerFill(marker)}
                        />
                        <text
                            x={x + keyWidth / 2}
                            y={keyHeight - MARKER_RADIUS - (black ? 5 : 7)}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize={marker.label.length > 2 ? (black ? 5.5 : 6.5) : (black ? 7 : 8.5)}
                            fontWeight={600}
                            className={marker.subtle ? "fill-stone-700" : "fill-white"}
                        >
                            {marker.label}
                        </text>
                    </g>
                )}
            </g>
        )
    }

    return (
        // Below ~16 px a white key gets too thin to read or tap, so narrow screens scroll instead.
        <div className={cn("w-full overflow-x-auto", className)}>
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="h-auto w-full select-none"
                style={{minWidth: whiteKeys.length * minKeyWidth}}
                role={onKeyClick ? "group" : "img"}
                aria-label={ariaLabel}
            >
                {ariaLabel && <title>{ariaLabel}</title>}
                {/* Black keys are drawn last so they sit on top of the white ones. */}
                {whiteKeys.map(renderKey)}
                {keys.filter(isBlack).map(renderKey)}
                {/* Fingers sit right under their keys; the hand colour tells left from right. */}
                {fingered.map(marker => (
                    <text
                        key={`finger-${marker.midi}`}
                        x={keyX(marker.midi) + (isBlack(marker.midi) ? BLACK_WIDTH : WHITE_WIDTH) / 2}
                        y={WHITE_HEIGHT + (isBlack(marker.midi) ? 11 : FINGER_ROW_HEIGHT - 3)}
                        textAnchor="middle"
                        fontSize={11}
                        fontWeight={700}
                        className={marker.isLeftHand ? "fill-sky-600 dark:fill-sky-400" : "fill-stone-800 dark:fill-stone-100"}
                    >
                        {marker.finger}
                    </text>
                ))}
                {showOctaves && whiteKeys.filter(midi => midi % 12 === 0).map(midi => (
                    <text
                        key={`octave-${midi}`}
                        x={keyX(midi) + WHITE_WIDTH / 2}
                        y={WHITE_HEIGHT + fingerRow + OCTAVE_LABEL_HEIGHT - 3}
                        textAnchor="middle"
                        fontSize={8}
                        className={octaveOf(midi) === 4 ? "fill-stone-600 font-semibold dark:fill-stone-300" : "fill-stone-400"}
                    >
                        C{octaveOf(midi)}
                    </text>
                ))}
            </svg>
        </div>
    )
}
