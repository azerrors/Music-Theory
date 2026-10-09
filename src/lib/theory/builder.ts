import {Chord, Interval, Note} from "tonal"
import {CHORD_TYPES} from "@/constants/chordTypes"
import {intervalToDegree} from "@/lib/theory/chords"
import {mod12} from "@/lib/theory/notes"
import type {ChordTypeDef, NoteName} from "@/types/music"

/** The "floors" of a chord stacked in thirds, bottom to top. The root is always there. */
export type BuilderSlot = "third" | "fifth" | "seventh" | "ninth" | "eleventh" | "thirteenth"

export const BUILDER_SLOTS: BuilderSlot[] = ["third", "fifth", "seventh", "ninth", "eleventh", "thirteenth"]

export const NONE = "none"

/**
 * Choices per floor, as tonal interval names. The third floor also holds sus2/sus4
 * (they replace the third), the seventh floor holds the 6 of a sixth chord.
 */
export const SLOT_OPTIONS: Record<BuilderSlot, string[]> = {
    third: [NONE, "3m", "3M", "2M", "4P"],
    fifth: [NONE, "5d", "5P", "5A"],
    seventh: [NONE, "6M", "7d", "7m", "7M"],
    ninth: [NONE, "9m", "9M", "9A"],
    eleventh: [NONE, "11P", "11A"],
    thirteenth: [NONE, "13m", "13M"],
}

export type BuilderState = Record<BuilderSlot, string>

export const DEFAULT_STATE: BuilderState = {third: "3M", fifth: "5P", seventh: NONE, ninth: NONE, eleventh: NONE, thirteenth: NONE}

export const EMPTY_STATE: BuilderState = {third: NONE, fifth: NONE, seventh: NONE, ninth: NONE, eleventh: NONE, thirteenth: NONE}

/** Root first, then the chosen intervals from the bottom floor up. */
export function stateIntervals(state: BuilderState): string[] {
    return ["1P", ...BUILDER_SLOTS.map(slot => state[slot]).filter(value => value !== NONE)]
}

/** Reads a state back from a list of intervals (e.g. from the URL); unknown intervals are ignored. */
export function stateFromIntervals(intervals: string[]): BuilderState {
    const state = {...EMPTY_STATE}
    for (const interval of intervals) {
        const slot = BUILDER_SLOTS.find(item => SLOT_OPTIONS[item].includes(interval))
        if (slot) state[slot] = interval
    }
    return state
}

export function stateFromType(symbol: string): BuilderState {
    return stateFromIntervals(Chord.getChord(symbol, "C").intervals)
}

export interface BuiltChord {
    notes: NoteName[]
    intervals: string[]
    degrees: string[]
    /** Catalogue type when the stack is a chord we list, e.g. m7. */
    type?: ChordTypeDef
    /** True when the match needed the (left out) fifth: C E Bb → C7 without its 5th. */
    impliedFifth: boolean
    /** A name from tonal's chord detection when the catalogue has no match, e.g. "C9no5". */
    detected?: string
}

const sameSet = (a: Set<number | string>, b: Set<number | string>) => a.size === b.size && [...a].every(item => b.has(item))

function pitchSet(intervals: string[]): Set<number> {
    return new Set(intervals.map(interval => mod12(Interval.semitones(interval) ?? 0)))
}

/** Exact interval names win (9sus4 vs 11 share their notes), then same pitch classes. */
function matchType(intervals: string[]): ChordTypeDef | undefined {
    const names = new Set(intervals)
    const pitches = pitchSet(intervals)
    const candidates = CHORD_TYPES.map(type => ({type, intervals: Chord.getChord(type.symbol, "C").intervals}))
    return candidates.find(item => sameSet(new Set(item.intervals), names))?.type
        ?? candidates.find(item => sameSet(pitchSet(item.intervals), pitches))?.type
}

export function buildChord(root: NoteName, state: BuilderState): BuiltChord {
    const intervals = stateIntervals(state)
    const notes = intervals.map(interval => Note.transpose(root, interval))
    const degrees = intervals.map(intervalToDegree)

    let type = matchType(intervals)
    let impliedFifth = false
    // Guitarists often drop the fifth; name the chord as if it were there.
    if (!type && state.fifth === NONE && intervals.length >= 3) {
        type = matchType([...intervals, "5P"])
        impliedFifth = !!type
    }

    return {
        notes,
        intervals,
        degrees,
        type,
        impliedFifth,
        detected: type ? undefined : Chord.detect(notes)[0],
    }
}

/** Close-position pitches from the root in octave 3, for playback: compound intervals land above the octave. */
export function builderMidi(root: NoteName, state: BuilderState, octave = 3): number[] {
    const base = Note.midi(`${root}${octave}`)
    if (base === null) return []
    return stateIntervals(state).map(interval => base + (Interval.semitones(interval) ?? 0))
}

/** One step of a guided tour: the floors to show and the i18n key of its explanation. */
export interface TourStep {
    state: BuilderState
}

export interface BuilderTour {
    id: string
    steps: TourStep[]
}

const step = (patch: Partial<BuilderState>): TourStep => ({state: {...EMPTY_STATE, ...patch}})

export const BUILDER_TOURS: BuilderTour[] = [
    {
        id: "basics",
        steps: [
            step({}),
            step({third: "3M"}),
            step({third: "3M", fifth: "5P"}),
            step({third: "3m", fifth: "5P"}),
            step({third: "3m", fifth: "5P", seventh: "7m"}),
            step({third: "3m", fifth: "5P", seventh: "7m", ninth: "9M"}),
        ],
    },
    {
        id: "sevenths",
        steps: [
            step({third: "3M", fifth: "5P"}),
            step({third: "3M", fifth: "5P", seventh: "7M"}),
            step({third: "3M", fifth: "5P", seventh: "7m"}),
            step({third: "3m", fifth: "5P", seventh: "7m"}),
            step({third: "3m", fifth: "5d", seventh: "7m"}),
            step({third: "3m", fifth: "5d", seventh: "7d"}),
        ],
    },
    {
        id: "colours",
        steps: [
            step({third: "3M", fifth: "5P"}),
            step({third: "4P", fifth: "5P"}),
            step({third: "2M", fifth: "5P"}),
            step({third: "3M", fifth: "5P", seventh: "6M"}),
            step({third: "3M", fifth: "5P", ninth: "9M"}),
            step({third: "3M", fifth: "5P", seventh: "6M", ninth: "9M"}),
        ],
    },
]

export function findTour(id: string): BuilderTour | undefined {
    return BUILDER_TOURS.find(tour => tour.id === id)
}

