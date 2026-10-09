import {chroma, mod12} from "@/lib/theory/notes"
import type {NoteName, StringIndex, Tuning} from "@/types/music"

/** A chord or scale tone, paired with its scale degree ("1", "♭3", …). */
export interface Tone {
    note: NoteName
    degree: string
}

export interface FretMarker {
    string: StringIndex
    fret: number
    note: NoteName
    degree?: string
    isRoot: boolean
    /** Overrides the note/degree text, e.g. an interval name. */
    label?: string
    /** Tailwind classes for the dot and its text, replacing the root/default colours. */
    fillClass?: string
    textClass?: string
    /** A smaller, quieter dot for background notes (the scale under a solo map). */
    small?: boolean
}

/**
 * Every position on the neck (open string through `fretCount`) whose pitch
 * belongs to `tones`. Notes are spelled as the tones spell them.
 */
export function markersForTones(tuning: Tuning, fretCount: number, tones: Tone[]): FretMarker[] {
    const byChroma = new Map(tones.map(tone => [chroma(tone.note), tone]))
    const rootChroma = tones[0] ? chroma(tones[0].note) : -1
    const markers: FretMarker[] = []

    tuning.strings.forEach((openString, string) => {
        const openChroma = chroma(openString)
        for (let fret = 0; fret <= fretCount; fret++) {
            const pitchChroma = mod12(openChroma + fret)
            const tone = byChroma.get(pitchChroma)
            if (!tone) continue
            markers.push({string, fret, note: tone.note, degree: tone.degree, isRoot: pitchChroma === rootChroma})
        }
    })

    return markers
}

export function zipTones(notes: NoteName[], degrees: string[]): Tone[] {
    return notes.map((note, index) => ({note, degree: degrees[index] ?? ""}))
}
