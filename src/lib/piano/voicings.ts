import {Interval} from "tonal"
import type {ChordInfo} from "@/lib/theory/chords"
import {chroma, mod12} from "@/lib/theory/notes"
import type {NoteName} from "@/types/music"

/**
 * - close: all notes in one hand, as close together as possible (root position or an inversion)
 * - twoHands: root in the left hand, the colour notes in the right — how pianists usually play
 * - slash: the bass note in the left hand, the chord in the right (C/E)
 */
export type PianoVoicingKind = "close" | "twoHands" | "slash"

export interface PianoVoicing {
    id: string
    kind: PianoVoicingKind
    /** Close voicings only: 0 = root position, 1 = first inversion… */
    inversion?: number
    /** MIDI notes, low → high. Empty for one-hand voicings. */
    left: number[]
    right: number[]
}

const C4 = 60

/**
 * Where the root of a root-position chord sits: G3…F♯4, so every chord stays around middle C
 * and the keyboard drawing doesn't drift to the top for B or A♭ chords.
 */
export function rootMidi(root: NoteName): number {
    const pitch = mod12(chroma(root))
    return pitch <= 6 ? C4 + pitch : C4 - 12 + pitch
}

/** The first MIDI note above `floor` (exclusive) with the given pitch class. */
function nextAbove(floor: number, note: NoteName): number {
    return floor + 1 + mod12(chroma(note) - (floor + 1))
}

/** Pitch classes stacked upwards from `bottom`, each in the nearest octave above the previous one. */
function stack(notes: NoteName[], bottom: number): number[] {
    const result = [bottom]
    for (const note of notes.slice(1)) result.push(nextAbove(result[result.length - 1]!, note))
    return result
}

/** All pitch classes squeezed into the octave above `bottom`'s note — the tightest hand position. */
function closeAbove(notes: NoteName[], bottom: number): number[] {
    return [bottom, ...notes.slice(1).map(note => nextAbove(bottom, note))].sort((a, b) => a - b)
}

/** Simple chords fit inside an octave, so they can be turned upside down; 9ths and up cannot. */
export function inversionCount(chord: ChordInfo): number {
    const fitsInOctave = chord.intervals.every(interval => (Interval.get(interval).num ?? 99) < 8)
    return fitsInOctave && chord.notes.length <= 4 ? chord.notes.length - 1 : 0
}

/**
 * Root position or an inversion in one hand. Every inversion starts as close to the root
 * position's bass as it can, so all of them stay around middle C and neighbouring inversions
 * share most keys — the way a pianist voice-leads C → C/G → C/E without jumping octaves.
 */
export function closeVoicing(chord: ChordInfo, inversion = 0): number[] {
    const notes = [...chord.notes.slice(inversion), ...chord.notes.slice(0, inversion)]
    const root = rootMidi(chord.root)
    // Nearest key with the bass note's pitch class, from a fifth below to a fourth above the root.
    const bottom = root - 6 + mod12(chroma(notes[0]!) - (root - 6))
    return stack(notes, bottom)
}

const isSeventh = (interval: string) => Interval.get(interval).num === 7

/**
 * Left hand: the root an octave down (plus the 7th on big chords). Right hand: the rest, close.
 * On 9ths, 11ths and 13ths the right hand drops the root and 5th — the notes pianists leave out
 * first, since the bass already gives the root and the 5th adds no colour.
 */
export function twoHandVoicing(chord: ChordInfo): Pick<PianoVoicing, "left" | "right"> {
    const root = rootMidi(chord.root)
    const leftRoot = root - 12
    const tones = chord.notes.map((note, index) => ({note, interval: chord.intervals[index] ?? ""}))

    if (chord.notes.length <= 3) return {left: [leftRoot], right: stack(chord.notes, root)}

    if (chord.notes.length === 4) {
        const upper = tones.slice(1).map(tone => tone.note)
        return {left: [leftRoot], right: closeAbove(upper, nextAbove(root, upper[0]!))}
    }

    const seventh = tones.find(tone => isSeventh(tone.interval))
    const left = seventh ? [leftRoot, nextAbove(leftRoot, seventh.note)] : [leftRoot]
    const upper = tones
        .filter(tone => tone.interval !== "1P" && tone.interval !== "5P" && !isSeventh(tone.interval))
        .map(tone => tone.note)
    return {left, right: closeAbove(upper, nextAbove(root, upper[0]!))}
}

/** Slash chord: the bass note below, the plain chord in root position above it. */
export function slashVoicing(chord: ChordInfo): Pick<PianoVoicing, "left" | "right"> {
    const right = stack(chord.notes, rootMidi(chord.root))
    // Within the octave just below the right hand's lowest note.
    return {left: [nextAbove(right[0]! - 13, chord.bass ?? chord.root)], right}
}

/** Every way the catalogue shows a chord on the keys, the plainest first. */
export function pianoVoicings(chord: ChordInfo): PianoVoicing[] {
    if (chord.bass) {
        const voicings: PianoVoicing[] = [{id: "slash", kind: "slash", ...slashVoicing(chord)}]
        // When the bass is a chord tone, C/E is also just an inversion of C in one hand.
        const inversion = chord.notes.findIndex(note => chroma(note) === chroma(chord.bass!))
        if (inversion > 0 && inversion <= inversionCount(chord)) {
            voicings.push({id: `close-${inversion}`, kind: "close", inversion, left: [], right: closeVoicing(chord, inversion)})
        }
        return voicings
    }

    const close = Array.from({length: inversionCount(chord) + 1}, (_, inversion): PianoVoicing => ({
        id: `close-${inversion}`,
        kind: "close",
        inversion,
        left: [],
        right: closeVoicing(chord, inversion),
    }))
    return [...close, {id: "twoHands", kind: "twoHands", ...twoHandVoicing(chord)}]
}

/** Notes to play, low → high. */
export function voicingNotes(voicing: Pick<PianoVoicing, "left" | "right">): number[] {
    return [...voicing.left, ...voicing.right]
}

/**
 * A keyboard range that starts on a C and is at least `minOctaves` wide. Past that it stops at
 * the first E or B above the highest note — the end of a black-key group — instead of drawing a
 * whole extra octave for one or two notes.
 */
export function keyboardRange(midiNotes: number[], minOctaves = 2): {from: number; to: number} {
    if (midiNotes.length === 0) return {from: C4 - 12, to: C4 - 12 + minOctaves * 12 - 1}
    const from = Math.floor(Math.min(...midiNotes) / 12) * 12
    let to = Math.max(...midiNotes) + 1
    while (mod12(to) !== 4 && mod12(to) !== 11) to++
    return {from, to: Math.max(to, from + minOctaves * 12 - 1)}
}
