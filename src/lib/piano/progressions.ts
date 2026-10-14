import type {ChordInfo} from "@/lib/theory/chords"
import {chroma, mod12} from "@/lib/theory/notes"
import {closeVoicing} from "@/lib/piano/voicings"
import type {NoteName} from "@/types/music"

/**
 * - smooth: the right hand picks whichever inversion is closest to the previous chord
 * - root: every chord in root position, so the hand jumps — useful to hear the difference
 */
export type VoicingStyle = "smooth" | "root"

export const VOICING_STYLES: VoicingStyle[] = ["smooth", "root"]

export interface HandsVoicing {
    left: number[]
    right: number[]
}

/** Where the right hand comfortably plays chords: F3 up to A5. */
const RIGHT_LOW = 53
const RIGHT_HIGH = 81
/** Bass notes stay between E2 and E♭3, below the right hand and still clear. */
const BASS_LOW = 40
/** The right hand's resting place, around E4: ties are broken towards it. */
const RIGHT_CENTER = 64

/** Notes the right hand takes: big chords leave the root to the bass, the chord keeps its colour. */
function rightHandNotes(chord: ChordInfo): NoteName[] {
    return chord.notes.length >= 5 ? chord.notes.slice(1) : chord.notes
}

function stack(notes: NoteName[], bottom: number): number[] {
    const result = [bottom]
    for (const note of notes.slice(1)) {
        const previous = result[result.length - 1]!
        result.push(previous + 1 + mod12(chroma(note) - (previous + 1)))
    }
    return result
}

/** Every close position of the chord (all inversions, every octave) that fits the right hand's range. */
export function rightHandCandidates(chord: ChordInfo): number[][] {
    const notes = rightHandNotes(chord)
    return notes.flatMap((_, inversion) => {
        const rotated = [...notes.slice(inversion), ...notes.slice(0, inversion)]
        const first = RIGHT_LOW + mod12(chroma(rotated[0]!) - RIGHT_LOW)
        const candidates: number[][] = []
        for (let bottom = first; bottom <= RIGHT_HIGH; bottom += 12) {
            const voicing = stack(rotated, bottom)
            if (voicing[voicing.length - 1]! <= RIGHT_HIGH) candidates.push(voicing)
        }
        return candidates
    })
}

/** How far the hand moves: note by note when the counts match, else each new note to its nearest old one. */
export function movement(from: number[], to: number[]): number {
    if (from.length === to.length) return to.reduce((sum, note, index) => sum + Math.abs(note - from[index]!), 0)
    return to.reduce((sum, note) => sum + Math.min(...from.map(old => Math.abs(note - old))), 0)
}

const centreDistance = (voicing: number[]) => Math.abs(voicing.reduce((sum, note) => sum + note, 0) / voicing.length - RIGHT_CENTER)

/** The bass note in the left hand: the slash bass if there is one, otherwise the root. */
export function bassMidi(chord: ChordInfo): number {
    return BASS_LOW + mod12(chroma(chord.bass ?? chord.root) - BASS_LOW)
}

/**
 * Voices a whole progression. The first chord starts in root position; with "smooth" each next
 * chord takes the inversion that moves the right hand least — common notes stay put, the rest
 * step to the nearest key. That is voice leading, and it is why pianists rarely play everything
 * in root position.
 */
export function voiceProgression(chords: ChordInfo[], style: VoicingStyle): HandsVoicing[] {
    const result: HandsVoicing[] = []
    for (const chord of chords) {
        const previous = result[result.length - 1]?.right
        let right: number[]
        if (style === "root" || !previous) {
            right = closeVoicing({...chord, notes: rightHandNotes(chord)})
        } else {
            const ranked = rightHandCandidates(chord)
                .map(voicing => ({voicing, cost: movement(previous, voicing), centre: centreDistance(voicing)}))
                .sort((a, b) => a.cost - b.cost || a.centre - b.centre)
            right = ranked[0]?.voicing ?? closeVoicing(chord)
        }
        result.push({left: [bassMidi(chord)], right})
    }
    return result
}

/** Right-hand keys held over from the previous chord — the notes the hand doesn't have to move. */
export function commonTones(previous: number[] | undefined, next: number[]): number[] {
    return previous ? next.filter(note => previous.includes(note)) : []
}

export type SoloRole = "chordRoot" | "chordTone" | "outside" | "scale"

/** Each key from `from` to `to` that belongs to the scale or the chord, tagged by how safe it is to land on. */
export function soloKeys(scaleNotes: NoteName[], chord: ChordInfo, from: number, to: number): {midi: number; role: SoloRole; note: NoteName; degree?: string}[] {
    const scale = new Set(scaleNotes.map(chroma))
    const rootChroma = chroma(chord.root)
    const keys: {midi: number; role: SoloRole; note: NoteName; degree?: string}[] = []
    for (let midi = from; midi <= to; midi++) {
        const pitch = mod12(midi)
        const chordIndex = chord.notes.findIndex(note => chroma(note) === pitch)
        if (chordIndex >= 0) {
            const role: SoloRole = pitch === rootChroma ? "chordRoot" : scale.has(pitch) ? "chordTone" : "outside"
            keys.push({midi, role, note: chord.notes[chordIndex]!, degree: chord.degrees[chordIndex]})
        } else if (scale.has(pitch)) {
            keys.push({midi, role: "scale", note: scaleNotes.find(note => chroma(note) === pitch)!})
        }
    }
    return keys
}
