import {chroma, mod12, pitchAt} from "@/lib/theory/notes"
import type {KeyMode} from "@/lib/theory/progressions"
import type {NoteName, StringIndex, Tuning} from "@/types/music"

export type SoloScaleKind = "pentatonic" | "full"

export const SOLO_SCALE_KINDS: SoloScaleKind[] = ["pentatonic", "full"]

/**
 * - chordRoot / chordTone: notes of the chord sounding right now — the safest notes to land on
 * - outside: a chord tone that isn't in the scale (G♯ of E7 in A minor); play it over this chord only
 * - scale: the rest of the scale, fine to pass through
 */
export type SoloRole = "chordRoot" | "chordTone" | "outside" | "scale"

export interface SoloPosition {
    string: StringIndex
    fret: number
    note: NoteName
    role: SoloRole
    /** Degree within the chord ("1", "♭3", "5", "♭7") for chord tones. */
    degree?: string
}

/** The scale to solo with: the key's pentatonic is the safe start, the full scale has more colours. */
export function soloScaleId(mode: KeyMode, kind: SoloScaleKind): string {
    if (kind === "pentatonic") return mode === "major" ? "majorPentatonic" : "minorPentatonic"
    return mode
}

/** Every fretboard position of the scale and of the current chord, tagged by how "safe" it is. */
export function soloPositions(
    tuning: Tuning,
    fretCount: number,
    scaleNotes: NoteName[],
    chordNotes: NoteName[],
    chordDegrees: string[],
): SoloPosition[] {
    const scale = new Set(scaleNotes.map(chroma))
    const chordRoot = chordNotes[0] === undefined ? -1 : chroma(chordNotes[0])

    return tuning.strings.flatMap((openString, string) => {
        const positions: SoloPosition[] = []
        const openChroma = chroma(openString)
        for (let fret = 0; fret <= fretCount; fret++) {
            const pitchChroma = mod12(openChroma + fret)
            const chordIndex = chordNotes.findIndex(note => chroma(note) === pitchChroma)

            if (chordIndex >= 0) {
                const role: SoloRole = pitchChroma === chordRoot ? "chordRoot" : scale.has(pitchChroma) ? "chordTone" : "outside"
                positions.push({string, fret, note: chordNotes[chordIndex]!, role, degree: chordDegrees[chordIndex]})
            } else if (scale.has(pitchChroma)) {
                const spelled = scaleNotes.find(note => chroma(note) === pitchChroma) ?? pitchAt(openString, fret)
                positions.push({string, fret, note: spelled, role: "scale"})
            }
        }
        return positions
    })
}
