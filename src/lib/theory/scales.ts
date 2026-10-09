import {Interval, Key, Note, Scale} from "tonal"
import {findScale} from "@/constants/scales"
import {formatChordSymbol, intervalToDegree} from "@/lib/theory/chords"
import type {NoteName, ScaleDef} from "@/types/music"

export interface ScaleInfo {
    root: NoteName
    def: ScaleDef
    notes: NoteName[]
    intervals: string[]
    degrees: string[]
}

export interface DiatonicChord {
    /** Roman numeral with quality casing, e.g. "ii", "♭VII", "vii°". */
    roman: string
    /** Raw tonal symbols, e.g. "Dm" and "Dm7" — parse them for links. */
    triadSymbol: string
    seventhSymbol: string
    triad: string
    seventh: string
}

export function getScaleInfo(root: NoteName, id: string): ScaleInfo | null {
    const def = findScale(id)
    if (!def) return null

    const scale = Scale.get(`${root} ${def.name}`)
    if (scale.empty) return null

    return {
        root,
        def,
        notes: scale.notes,
        intervals: scale.intervals,
        degrees: scale.intervals.map(intervalToDegree),
    }
}

/** One ascending octave starting at `octave`, closing on the upper root. */
export function scaleMidi(scale: ScaleInfo, octave = 3): number[] {
    const start = Note.midi(`${scale.root}${octave}`)
    if (start === null) return []
    const steps = scale.intervals.map(interval => start + (Interval.semitones(interval) ?? 0))
    return [...steps, start + 12]
}

function romanFor(grade: string, triad: string): string {
    const accidental = grade.match(/^[b#]*/)?.[0] ?? ""
    const numeral = grade.slice(accidental.length)
    const symbol = accidental.replaceAll("b", "♭").replaceAll("#", "♯")

    if (triad.endsWith("dim")) return `${symbol}${numeral.toLowerCase()}°`
    if (/m$/.test(triad)) return symbol + numeral.toLowerCase()
    return symbol + numeral
}

/** Chords built on each degree — only meaningful for major and natural minor. */
export function getDiatonicChords(root: NoteName, id: string): DiatonicChord[] | null {
    const key = id === "major" || id === "ionian"
        ? Key.majorKey(root)
        : id === "minor" || id === "aeolian"
            ? Key.minorKey(root).natural
            : null
    if (!key) return null

    return key.grades.map((grade, index) => {
        const triadSymbol = key.triads[index] ?? ""
        const seventhSymbol = key.chords[index] ?? ""
        return {
            roman: romanFor(grade, triadSymbol),
            triadSymbol,
            seventhSymbol,
            triad: formatChordSymbol(triadSymbol),
            seventh: formatChordSymbol(seventhSymbol),
        }
    })
}
