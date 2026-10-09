import {Note} from "tonal"
import {SOLFEGE} from "@/constants/notes"
import type {Notation, NoteName, PitchName} from "@/types/music"

export function chroma(note: NoteName | PitchName): number {
    return Note.chroma(note) ?? -1
}

export function isSamePitchClass(a: NoteName, b: NoteName): boolean {
    return chroma(a) === chroma(b)
}

export function mod12(value: number): number {
    return ((value % 12) + 12) % 12
}

/** Pitch produced by `openString` stopped at `fret`, e.g. ("E2", 3) → "G2". */
export function pitchAt(openString: PitchName, fret: number): PitchName {
    const midi = Note.midi(openString)
    if (midi === null) return ""
    return Note.fromMidiSharps(midi + fret)
}

export function midiAt(openString: PitchName, fret: number): number {
    return (Note.midi(openString) ?? 0) + fret
}

/**
 * Spells a chromatic pitch the way the surrounding chord/scale spells it, so a
 * Bb major scale shows "Bb" rather than the fretboard's raw "A#".
 */
export function spellInContext(pitchChroma: number, context: NoteName[]): NoteName | undefined {
    return context.find(note => chroma(note) === pitchChroma)
}

function formatAccidentals(acc: string): string {
    return acc.replaceAll("#", "♯").replaceAll("b", "♭")
}

/** Display form of a pitch class: "F#" → "F♯" or "Fa♯" depending on notation. */
export function formatNote(note: NoteName, notation: Notation = "letter"): string {
    const parsed = Note.get(note)
    if (parsed.empty) return note
    const letter = notation === "solfege" ? (SOLFEGE[parsed.letter] ?? parsed.letter) : parsed.letter
    return letter + formatAccidentals(parsed.acc)
}

/** URL-safe root: "#" is reserved in URLs, so "C#" travels as "Cs". */
export function rootToSlug(root: NoteName): string {
    return root.replaceAll("#", "s")
}

export function slugToRoot(slug: string): NoteName | null {
    const root = slug.charAt(0).toUpperCase() + slug.slice(1).replaceAll("s", "#")
    return Note.get(root).empty ? null : Note.pitchClass(root)
}
