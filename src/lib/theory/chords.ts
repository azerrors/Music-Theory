import {Chord, Interval, Note} from "tonal"
import {findChordType} from "@/constants/chordTypes"
import {formatNote} from "@/lib/theory/notes"
import type {ChordTypeDef, Notation, NoteName} from "@/types/music"

export interface ChordInfo {
    root: NoteName
    type: ChordTypeDef
    /** Display name, e.g. "F#m7". */
    name: string
    notes: NoteName[]
    /** Tonal interval names, e.g. ["1P", "3m", "5P"]. */
    intervals: string[]
    /** Scale-degree formula, e.g. ["1", "♭3", "5"]. */
    degrees: string[]
    /** Slash chords only: the bass note and its degree from the root, e.g. "E" and "3" in C/E. */
    bass?: NoteName
    bassDegree?: string
}

/** "3m" → "♭3", "5A" → "♯5", "7d" → "♭♭7", "11P" → "11". */
export function intervalToDegree(interval: string): string {
    const parsed = Interval.get(interval)
    if (parsed.empty) return interval
    const accidental = parsed.alt > 0 ? "♯".repeat(parsed.alt) : "♭".repeat(-parsed.alt)
    return accidental + parsed.num
}

/** `bass` makes a slash chord (C/E); a bass equal to the root is ignored. */
export function getChordInfo(root: NoteName, symbol: string, bass?: NoteName | null): ChordInfo | null {
    const type = findChordType(symbol)
    if (!type) return null

    const chord = Chord.getChord(symbol, root)
    if (chord.empty) return null

    const slashBass = bass && Note.chroma(bass) !== Note.chroma(root) ? bass : undefined

    return {
        root,
        type,
        name: root + type.suffix + (slashBass ? `/${slashBass}` : ""),
        notes: chord.notes,
        intervals: chord.intervals,
        degrees: chord.intervals.map(intervalToDegree),
        bass: slashBass,
        bassDegree: slashBass ? intervalToDegree(Interval.distance(root, slashBass)) : undefined,
    }
}

/** Splits "F#m7" into its root and catalogue type; null for chords we don't list. */
export function parseChordSymbol(symbol: string): {root: NoteName; type: ChordTypeDef} | null {
    const chord = Chord.get(symbol)
    if (chord.empty || !chord.tonic) return null
    const type = chord.aliases.map(findChordType).find(Boolean)
    return type ? {root: chord.tonic, type} : null
}

/** Formats a tonal chord symbol for display: "EM" → "E", "Am7/G" stays as is. */
export function formatChordSymbol(symbol: string): string {
    const chord = Chord.get(symbol)
    if (chord.empty || !chord.tonic) return symbol

    const known = chord.aliases.map(findChordType).find(Boolean)
    const suffix = known ? known.suffix : (chord.aliases[0] ?? "")
    const bass = chord.bass && chord.bass !== chord.tonic ? `/${chord.bass}` : ""
    return chord.tonic + suffix + bass
}

/** Names the chord formed by `notes`, bass note first. */
export function detectChords(notes: NoteName[]): string[] {
    if (notes.length < 2) return []
    return Chord.detect(notes).map(formatChordSymbol)
}

/** Display name in the chosen notation: "F♯m7", "Do/Mi". */
export function formatChordName(chord: Pick<ChordInfo, "root" | "type" | "bass">, notation: Notation = "letter"): string {
    const bass = chord.bass ? `/${formatNote(chord.bass, notation)}` : ""
    return formatNote(chord.root, notation) + chord.type.suffix + bass
}
