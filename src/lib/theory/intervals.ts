import {midiAt, pitchAt} from "@/lib/theory/notes"
import type {StringIndex, Tuning} from "@/types/music"

export interface IntervalDef {
    /** Tonal interval name, also the i18n key. */
    id: string
    semitones: number
    /** Short label on the fretboard: "♭3", "5", "8". */
    label: string
}

export const INTERVALS: IntervalDef[] = [
    {id: "1P", semitones: 0, label: "1"},
    {id: "2m", semitones: 1, label: "♭2"},
    {id: "2M", semitones: 2, label: "2"},
    {id: "3m", semitones: 3, label: "♭3"},
    {id: "3M", semitones: 4, label: "3"},
    {id: "4P", semitones: 5, label: "4"},
    {id: "4A", semitones: 6, label: "♭5"},
    {id: "5P", semitones: 7, label: "5"},
    {id: "6m", semitones: 8, label: "♭6"},
    {id: "6M", semitones: 9, label: "6"},
    {id: "7m", semitones: 10, label: "♭7"},
    {id: "7M", semitones: 11, label: "7"},
    {id: "8P", semitones: 12, label: "8"},
]

export function findInterval(id: string): IntervalDef | undefined {
    return INTERVALS.find(interval => interval.id === id)
}

export interface Position {
    string: StringIndex
    fret: number
}

export interface IntervalPosition extends Position {
    interval: IntervalDef
    pitch: string
}

/** How far the fretting hand reaches around the reference note when showing shapes. */
export const HAND_SPAN = 5

/**
 * Every position within a hand's reach of `reference` that sounds a chosen interval
 * above it (unison to octave). This is what "interval shapes" on guitar are.
 */
export function intervalPositions(
    tuning: Tuning,
    reference: Position,
    fretCount: number,
    selected: string[],
): IntervalPosition[] {
    const referenceMidi = midiAt(tuning.strings[reference.string] ?? "E2", reference.fret)
    const wanted = INTERVALS.filter(interval => selected.includes(interval.id))
    const minFret = Math.max(0, reference.fret - HAND_SPAN)
    const maxFret = Math.min(fretCount, reference.fret + HAND_SPAN)

    return tuning.strings.flatMap((openString, string) => {
        const positions: IntervalPosition[] = []
        for (let fret = minFret; fret <= maxFret; fret++) {
            const distance = midiAt(openString, fret) - referenceMidi
            const interval = wanted.find(item => item.semitones === distance)
            if (interval) positions.push({string, fret, interval, pitch: pitchAt(openString, fret)})
        }
        return positions
    })
}

export interface IntervalShape {
    /** Strings to move up (towards the thin strings): 0 = same string. */
    stringsUp: number
    /** Frets to move along the neck; negative is towards the nut. */
    fretOffset: number
}

/**
 * The closest ways to reach `semitones` above a note on `string`: on the same string and on the
 * next one or two strings up. The G→B step is a major third, not a fourth, so shapes that cross
 * it shift by a fret — which this computes from the tuning rather than assuming.
 */
export function intervalShapes(tuning: Tuning, string: StringIndex, semitones: number): IntervalShape[] {
    const openMidi = (index: number) => midiAt(tuning.strings[index] ?? "E2", 0)
    const shapes: IntervalShape[] = [{stringsUp: 0, fretOffset: semitones}]
    for (let up = 1; up <= 2 && string + up < tuning.strings.length; up++) {
        const gap = openMidi(string + up) - openMidi(string)
        const fretOffset = semitones - gap
        if (Math.abs(fretOffset) <= 4) shapes.push({stringsUp: up, fretOffset})
    }
    return shapes
}

