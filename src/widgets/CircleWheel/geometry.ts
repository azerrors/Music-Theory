import {CIRCLE_MAJORS, CIRCLE_MINORS, ENHARMONIC_LABELS} from "@/lib/theory/circle"
import {formatNote} from "@/lib/theory/notes"
import type {KeyMode} from "@/lib/theory/progressions"
import type {Notation} from "@/types/music"

/** The circle's drawing: majors on the outer ring, relative minors inside, a hub in the middle. */
export const SIZE = 420
export const CENTER = SIZE / 2
export const OUTER = 200
export const MIDDLE = 140
export const INNER = 92

export function polar(radius: number, angle: number): [number, number] {
    return [CENTER + radius * Math.cos(angle), CENTER + radius * Math.sin(angle)]
}

/** Angle of position `index` (0 at the top, clockwise). */
export const slotAngle = (index: number) => (index / 12) * Math.PI * 2 - Math.PI / 2

/** An annular slice for position `index` (0 at the top, clockwise) between two radii. */
export function slicePath(index: number, inner: number, outer: number): string {
    const start = ((index - 0.5) / 12) * Math.PI * 2 - Math.PI / 2
    const end = ((index + 0.5) / 12) * Math.PI * 2 - Math.PI / 2
    const [x1, y1] = polar(outer, start)
    const [x2, y2] = polar(outer, end)
    const [x3, y3] = polar(inner, end)
    const [x4, y4] = polar(inner, start)
    return `M${x1} ${y1} A${outer} ${outer} 0 0 1 ${x2} ${y2} L${x3} ${y3} A${inner} ${inner} 0 0 0 ${x4} ${y4}Z`
}

/** The key's name on its slice; the bottom slice shows both spellings (F♯/G♭). */
export function ringLabel(ring: KeyMode, index: number, notation: Notation): string {
    const note = (ring === "major" ? CIRCLE_MAJORS : CIRCLE_MINORS)[index] ?? "C"
    const alt = ENHARMONIC_LABELS[index]?.[ring]
    const suffix = ring === "minor" ? "m" : ""
    const main = formatNote(note, notation) + suffix
    return alt ? `${main}/${formatNote(alt, notation)}${suffix}` : main
}
