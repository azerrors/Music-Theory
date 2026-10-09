import {Chord, Note} from "tonal"
import {STANDARD_TUNING} from "@/constants/tunings"
import {OPEN_SLASH_VOICINGS, SLASH_SHAPES} from "@/constants/voicings/slashVoicings"
import {chroma, isSamePitchClass, midiAt, mod12} from "@/lib/theory/notes"
import {getVoicings, placeShape} from "@/lib/theory/voicings"
import type {Fret, NoteName, Tuning, Voicing, VoicingShape} from "@/types/music"

/** Chord types the catalogue offers inversions for. */
export const SLASH_CHORD_TYPES = ["M", "m", "7", "maj7", "m7"]

const MAX_SLASH_VOICINGS = 6
/** Widest hand stretch allowed for a generated shape, in frets (lowest to highest fretted note). */
const MAX_SPAN = 3

/**
 * Which inversion the bass makes: 1 = third in the bass, 2 = fifth, 3 = seventh;
 * 0 when the bass is not a chord tone (Am/F#, D/C).
 */
export function inversionOf(root: NoteName, type: string, bass: NoteName): number {
    const notes = Chord.getChord(type, root).notes
    const index = notes.findIndex(note => isSamePitchClass(note, bass))
    return index > 0 && index <= 3 ? index : 0
}

/**
 * Bass notes that turn a chord into its inversions: the chord tones other than the root,
 * e.g. C → E (C/E) and G (C/G). Only inversions we can draw are listed.
 */
export function inversionBasses(root: NoteName, type: string): NoteName[] {
    return Chord.getChord(type, root).notes
        .slice(1, 4)
        .filter(bass => slashVoicings(root, type, bass).length > 0)
}

function fingersOnePerFret(frets: Fret[]): (number | null)[] {
    const fretted = frets.filter((fret): fret is number => fret !== null && fret > 0)
    const lowest = Math.min(...fretted)
    return frets.map(fret => (fret === null || fret === 0 ? null : Math.min(4, 1 + fret - lowest)))
}

/**
 * Puts `bass` under an existing chord shape of `root`: on a lower string, or replacing the
 * lowest one as long as the root still sounds. Returns null when it can't be done within a normal hand stretch.
 */
export function withBass(voicing: Voicing, root: NoteName, bass: NoteName, tuning: Tuning = STANDARD_TUNING): Voicing | null {
    const lowestString = voicing.frets.findIndex(fret => fret !== null)
    if (lowestString < 0) return null

    let best: {voicing: Voicing; score: number} | null = null

    for (let string = 0; string <= Math.min(lowestString, 2); string++) {
        const openString = tuning.strings[string] ?? "E2"
        const baseFret = mod12(chroma(bass) - chroma(openString))

        for (const bassFret of [baseFret, baseFret + 12]) {
            const frets = voicing.frets.map((fret, index) => (index < string ? null : index === string ? bassFret : fret))

            const fretted = frets.filter((fret): fret is number => fret !== null && fret > 0)
            if (fretted.length > 0 && Math.max(...fretted) - Math.min(...fretted) > MAX_SPAN) continue

            // The bass has to be the lowest pitch, not just the lowest string.
            const bassMidi = midiAt(openString, bassFret)
            const others = frets.flatMap((fret, index) => (fret === null || index === string ? [] : [midiAt(tuning.strings[index] ?? "E2", fret)]))
            if (others.some(midi => midi <= bassMidi)) continue
            if (!others.some(midi => mod12(midi) === chroma(root))) continue

            let barre = voicing.barre
            if (barre && string >= barre.fromString && string <= barre.toString) {
                // A string under the barre can't sound lower than the barre fret.
                if (bassFret < barre.fret) continue
                if (bassFret !== barre.fret) barre = {...barre, fromString: string + 1}
            }
            if (barre && (barre.fromString >= barre.toString || barre.fret !== Math.min(...fretted))) barre = undefined

            const shape = `slash${6 - string}` as VoicingShape
            const candidate: Voicing = {id: `gen-${frets.map(fret => fret ?? "x").join("-")}`, shape, frets, fingers: fingersOnePerFret(frets), barre}
            // Prefer keeping every chord tone (a lower string over replacing one), then the lower position.
            const score = (string === lowestString ? 100 : 0) + bassFret
            if (!best || score < best.score) best = {voicing: candidate, score}
        }
    }

    return best?.voicing ?? null
}

/**
 * Shapes for a slash chord: curated open ones first, then movable inversions,
 * then shapes built by adding the bass under the chord's regular voicings.
 */
export function slashVoicings(root: NoteName, type: string, bass: NoteName): Voicing[] {
    const open: Voicing[] = OPEN_SLASH_VOICINGS
        .filter(def => def.type === type && isSamePitchClass(def.root, root) && isSamePitchClass(def.bass, bass))
        .map((def, index) => ({id: `open-slash-${index}`, shape: "open", frets: def.frets, fingers: def.fingers, barre: def.barre}))

    const movable = SLASH_SHAPES
        .filter(template => template.type === type && chroma(Note.transpose(root, template.bassInterval)) === chroma(bass))
        .map(template => placeShape(template, bass))

    const generated = getVoicings(root, type).flatMap(voicing => withBass(voicing, root, bass) ?? [])

    const seen = new Set<string>()
    return [...open, ...movable, ...generated]
        .filter(voicing => {
            const key = voicing.frets.join()
            if (seen.has(key)) return false
            seen.add(key)
            return true
        })
        .slice(0, MAX_SLASH_VOICINGS)
}

