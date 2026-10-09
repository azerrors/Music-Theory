import {Key} from "tonal"
import {chroma, mod12} from "@/lib/theory/notes"
import type {KeyMode} from "@/lib/theory/progressions"
import type {NoteName} from "@/types/music"

/** Major keys clockwise from the top: each step is a fifth up and one more sharp (or one flat fewer). */
export const CIRCLE_MAJORS: NoteName[] = ["C", "G", "D", "A", "E", "B", "F#", "Db", "Ab", "Eb", "Bb", "F"]

/** Relative minors, on the inner ring under their major: same notes, tonic a minor third lower. */
export const CIRCLE_MINORS: NoteName[] = CIRCLE_MAJORS.map(major => Key.majorKey(major).minorRelative)

/** The bottom of the circle can be spelled either way: F♯ = G♭ (6♯ or 6♭), D♯m = E♭m. */
export const ENHARMONIC_LABELS: Record<number, {major: NoteName; minor: NoteName}> = {
    6: {major: "Gb", minor: "Eb"},
}

const SHARP_ORDER = ["F#", "C#", "G#", "D#", "A#", "E#", "B#"]
const FLAT_ORDER = ["Bb", "Eb", "Ab", "Db", "Gb", "Cb", "Fb"]

/** Position on the circle; a minor key sits under its relative major. */
export function circleIndex(tonic: NoteName, mode: KeyMode): number {
    const ring = mode === "major" ? CIRCLE_MAJORS : CIRCLE_MINORS
    return ring.findIndex(note => chroma(note) === chroma(tonic))
}

export interface KeySignature {
    count: number
    type: "sharp" | "flat" | "none"
    /** The altered notes in the order they are written: F♯ C♯ G♯… or B♭ E♭ A♭… */
    accidentals: NoteName[]
}

export function keySignature(tonic: NoteName, mode: KeyMode): KeySignature {
    const signature = mode === "major" ? Key.majorKey(tonic).keySignature : Key.minorKey(tonic).keySignature
    const count = signature.length
    if (count === 0) return {count, type: "none", accidentals: []}
    const type = signature.startsWith("#") ? "sharp" : "flat"
    return {count, type, accidentals: (type === "sharp" ? SHARP_ORDER : FLAT_ORDER).slice(0, count)}
}

export interface CircleHighlight {
    ring: "major" | "minor"
    index: number
    /** Function of that chord in the selected key: "I", "IV", "vi"… */
    roman: string
}

/**
 * The six chords of a key sit side by side on the circle: the key, its two neighbours
 * (a fifth either way) and the three relative minors underneath.
 */
export function keyFamily(tonic: NoteName, mode: KeyMode): CircleHighlight[] {
    const index = circleIndex(tonic, mode)
    if (index < 0) return []
    const left = mod12(index - 1)
    const right = mod12(index + 1)

    if (mode === "major") {
        return [
            {ring: "major", index, roman: "I"},
            {ring: "major", index: left, roman: "IV"},
            {ring: "major", index: right, roman: "V"},
            {ring: "minor", index, roman: "vi"},
            {ring: "minor", index: left, roman: "ii"},
            {ring: "minor", index: right, roman: "iii"},
        ]
    }
    return [
        {ring: "minor", index, roman: "i"},
        {ring: "minor", index: left, roman: "iv"},
        {ring: "minor", index: right, roman: "v"},
        {ring: "major", index, roman: "♭III"},
        {ring: "major", index: left, roman: "♭VI"},
        {ring: "major", index: right, roman: "♭VII"},
    ]
}
