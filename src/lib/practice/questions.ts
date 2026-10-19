import {ROOT_NOTES} from "@/constants/notes"
import {CIRCLE_MAJORS, CIRCLE_MINORS, keySignature, type KeySignature} from "@/lib/theory/circle"
import {chroma, midiAt, mod12} from "@/lib/theory/notes"
import type {NoteName, Tuning} from "@/types/music"
import {itemWeight, type ExerciseStats} from "./stats"

/** A source of numbers in [0, 1); tests pass a fixed sequence. */
export type Random = () => number

/** Picks one item, favouring those with a higher weight. */
export function weightedPick<T>(items: T[], weightOf: (item: T) => number, random: Random = Math.random): T {
    const weights = items.map(weightOf)
    const total = weights.reduce((sum, weight) => sum + weight, 0)
    let roll = random() * total
    for (let index = 0; index < items.length; index++) {
        roll -= weights[index]!
        if (roll < 0) return items[index]!
    }
    return items[items.length - 1]!
}

/** Weighted by past answers, and never the same item twice in a row when there is a choice. */
function pickItem<T>(items: T[], keyOf: (item: T) => string, stats: ExerciseStats, previous: string | undefined, random: Random): T {
    const pool = items.length > 1 ? items.filter(item => keyOf(item) !== previous) : items
    return weightedPick(pool, item => itemWeight(stats.items[keyOf(item)]), random)
}

const randomInt = (max: number, random: Random) => Math.min(max - 1, Math.floor(random() * max))

/* ---------- Note by ear ---------- */

export type EarLevel = "natural" | "all"
export const EAR_LEVELS: EarLevel[] = ["natural", "all"]
export const NATURAL_NOTES: NoteName[] = ["C", "D", "E", "F", "G", "A", "B"]

/** How an answer is matched: the note in any octave, or the exact pitch that sounded. */
export type EarMatch = "note" | "pitch"
export const EAR_MATCHES: EarMatch[] = ["note", "pitch"]

/** The second note stays within this many semitones of the first, so the step can be heard. */
export const EAR_MAX_LEAP = 12

export interface EarQuestion {
    /** The note to find (pitch class), and the exact place and pitch it sounded at. */
    note: NoteName
    target: Spot
    /** The first note: lit on the instrument, never named until the answer. */
    reference: Spot
}

/**
 * A random first note somewhere on the instrument, then the note to find, up to an octave away
 * either side. The note to find is weighted by past answers; both come from the level's notes.
 */
export function earQuestion(level: EarLevel, spots: Spot[], stats: ExerciseStats, previous?: string, random: Random = Math.random): EarQuestion {
    const pool = level === "natural" ? NATURAL_NOTES : ROOT_NOTES
    const inPool = new Set(pool.map(chroma))
    const references = spots.filter(spot => inPool.has(mod12(spot.midi)))
    const note = pickItem(pool, item => item, stats, previous, random)

    // A first note with at least one place for the answer in reach; on a real range one always exists.
    for (let attempt = 0; attempt < 50; attempt++) {
        const reference = references[randomInt(references.length, random)]!
        const targets = spots.filter(spot => mod12(spot.midi) === chroma(note) && spot.midi !== reference.midi && Math.abs(spot.midi - reference.midi) <= EAR_MAX_LEAP)
        if (targets.length > 0) return {note, reference, target: targets[randomInt(targets.length, random)]!}
    }
    const target = spots.find(spot => mod12(spot.midi) === chroma(note)) ?? spots[0]!
    return {note, reference: references[0] ?? spots[0]!, target}
}

/* ---------- Find the note ---------- */

export type FindMode = "tap" | "name"
export const FIND_MODES: FindMode[] = ["tap", "name"]

/** A place on the instrument: a string and fret on guitar, a key (`midi`) on piano. */
export interface Spot {
    string?: number
    fret?: number
    midi: number
}

export interface FindQuestion {
    note: NoteName
    /** In "name" mode, the spot that is lit and must be named. */
    spot?: Spot
}

/** The conventional spelling of a pitch, as used in pickers. */
export const spellingOf = (midi: number): NoteName => ROOT_NOTES[mod12(midi)]!

/** Every fret from the open string to `fretCount`, on every string. */
export function guitarSpots(tuning: Tuning, fretCount: number): Spot[] {
    return tuning.strings.flatMap((open, string) =>
        Array.from({length: fretCount + 1}, (_, fret) => ({string, fret, midi: midiAt(open, fret)})))
}

export function pianoSpots(from: number, to: number): Spot[] {
    return Array.from({length: to - from + 1}, (_, index) => ({midi: from + index}))
}

export function findQuestion(mode: FindMode, spots: Spot[], stats: ExerciseStats, previous?: string, random: Random = Math.random): FindQuestion {
    const note = pickItem(ROOT_NOTES, item => item, stats, previous, random)
    if (mode === "tap") return {note}
    const matching = spots.filter(spot => mod12(spot.midi) === chroma(note))
    return {note, spot: matching[randomInt(matching.length, random)]}
}

/* ---------- Circle of fifths ---------- */

export type CircleLevel = "labels" | "hidden"
export const CIRCLE_LEVELS: CircleLevel[] = ["labels", "hidden"]

export type Ring = "major" | "minor"

export interface CircleSlot {
    ring: Ring
    index: number
}

export type CircleQuestion =
    | {kind: "steps"; from: NoteName; steps: number; direction: "clockwise" | "counter"; answer: CircleSlot}
    | {kind: "signature"; signature: KeySignature; answer: CircleSlot}
    | {kind: "relative"; from: NoteName; fromRing: Ring; answer: CircleSlot}

export const slotKey = (slot: CircleSlot) => `${slot.ring}:${slot.index}`
export const sameSlot = (a: CircleSlot, b: CircleSlot) => a.ring === b.ring && a.index === b.index
export const slotNote = (slot: CircleSlot): NoteName => (slot.ring === "major" ? CIRCLE_MAJORS : CIRCLE_MINORS)[slot.index]!

const SLOTS: CircleSlot[] = (["major", "minor"] as const).flatMap(ring => CIRCLE_MAJORS.map((_, index) => ({ring, index})))

export function circleQuestion(stats: ExerciseStats, previous?: string, random: Random = Math.random): CircleQuestion {
    const kinds = ["steps", "signature", "relative"] as const
    const kind = kinds[randomInt(kinds.length, random)]!

    if (kind === "steps") {
        // The answer is weighted; the start is worked out back from it.
        const answer = pickItem(SLOTS.filter(slot => slot.ring === "major"), slotKey, stats, previous, random)
        const steps = 1 + randomInt(5, random)
        const direction = random() < 0.5 ? "clockwise" : "counter"
        const start = mod12(answer.index + (direction === "clockwise" ? -steps : steps))
        return {kind, from: CIRCLE_MAJORS[start]!, steps, direction, answer}
    }

    if (kind === "signature") {
        // F♯/G♭ (6 either way) is left out: one signature, one answer.
        const answer = pickItem(SLOTS.filter(slot => slot.ring === "major" && slot.index !== 6), slotKey, stats, previous, random)
        return {kind, signature: keySignature(slotNote(answer), "major"), answer}
    }

    const answer = pickItem(SLOTS, slotKey, stats, previous, random)
    const fromRing: Ring = answer.ring === "major" ? "minor" : "major"
    return {kind, from: slotNote({ring: fromRing, index: answer.index}), fromRing, answer}
}
