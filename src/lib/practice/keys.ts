import {Chord, Interval} from "tonal"
import {ROOT_NOTES} from "@/constants/notes"
import {CIRCLE_MAJORS, CIRCLE_MINORS} from "@/lib/theory/circle"
import {chroma} from "@/lib/theory/notes"
import {diatonicChords, type KeyChord, type KeyMode} from "@/lib/theory/progressions"
import type {NoteName} from "@/types/music"
import {weightedPick, slotKey, type CircleSlot, type Random} from "./questions"
import {itemWeight, type ExerciseStats} from "./stats"

/* Key puzzles: which key a set of chords is in, the chord that does not belong, the missing chord. */

export type KeyPuzzleMode = "key" | "odd" | "fill"
export const KEY_PUZZLE_MODES: KeyPuzzleMode[] = ["key", "odd", "fill"]

export type KeyLevel = "major" | "all"
export const KEY_LEVELS: KeyLevel[] = ["major", "all"]

export interface PuzzleChord {
    root: NoteName
    /** Catalogue chord-type symbol: "M", "m", "dim"… */
    type: string
}

export interface PuzzleKey {
    tonic: NoteName
    mode: KeyMode
    /** Where the key sits on the circle of fifths. */
    slot: CircleSlot
}

const keyAt = (slot: CircleSlot): PuzzleKey => ({
    tonic: (slot.ring === "major" ? CIRCLE_MAJORS : CIRCLE_MINORS)[slot.index]!,
    mode: slot.ring,
    slot,
})

/** All 24 keys, majors then minors, in circle order. */
export const ALL_KEYS: PuzzleKey[] = (["major", "minor"] as const).flatMap(ring => CIRCLE_MAJORS.map((_, index) => keyAt({ring, index})))

export const sameChord = (a: PuzzleChord, b: PuzzleChord) => chroma(a.root) === chroma(b.root) && a.type === b.type

/** The seven diatonic triads of a key. */
export const keyTriads = (key: PuzzleKey): KeyChord[] => diatonicChords(key.tonic, key.mode)

/** Whether every chord is one of the key's diatonic triads. */
export const fitsKey = (key: PuzzleKey, chords: PuzzleChord[]) => {
    const triads = keyTriads(key)
    return chords.every(chord => triads.some(triad => sameChord(triad, chord)))
}

/** Close-position pitches of a chord, its root at or above `base`. */
export function chordMidi(chord: PuzzleChord, base: number): number[] {
    const root = base + chroma(chord.root)
    return Chord.get(chord.type).intervals.map(interval => root + (Interval.semitones(interval) ?? 0))
}

const randomInt = (max: number, random: Random) => Math.min(max - 1, Math.floor(random() * max))

function shuffle<T>(items: T[], random: Random): T[] {
    const copy = [...items]
    for (let index = copy.length - 1; index > 0; index--) {
        const other = randomInt(index + 1, random)
        ;[copy[index], copy[other]] = [copy[other]!, copy[index]!]
    }
    return copy
}

/** A key for the next question: weighted by past answers, never the previous one. */
function pickKey(level: KeyLevel, stats: ExerciseStats, previous: string | undefined, random: Random): PuzzleKey {
    const keys = ALL_KEYS.filter(key => (level === "all" || key.mode === "major") && slotKey(key.slot) !== previous)
    return weightedPick(keys, key => itemWeight(stats.items[slotKey(key.slot)]), random)
}

export type KeyPuzzle =
    | {kind: "key"; key: PuzzleKey; chords: PuzzleChord[]; /** Every key these chords fit; any of them is right. */ answers: CircleSlot[]}
    | {kind: "odd"; key: PuzzleKey; chords: PuzzleChord[]; /** The chord outside the key. */ odd: number}
    | {kind: "fill"; key: PuzzleKey; steps: KeyChord[]; hidden: number; options: KeyChord[]}

/** Four of the key's chords, always with its home chord, so the set points at the key. */
export function keyPuzzle(level: KeyLevel, stats: ExerciseStats, previous?: string, random: Random = Math.random): KeyPuzzle {
    const key = pickKey(level, stats, previous, random)
    const [home, ...rest] = keyTriads(key)
    const chords = shuffle([home!, ...shuffle(rest, random).slice(0, 3)], random).map(({root, type}) => ({root, type}))
    const answers = ALL_KEYS.filter(candidate => (level === "all" || candidate.mode === "major") && fitsKey(candidate, chords)).map(candidate => candidate.slot)
    return {kind: "key", key, chords, answers}
}

/**
 * Three of the key's chords and one from outside it. Half the time the outsider is a trap: a root
 * that is in the key, with the wrong quality (C minor in G major).
 */
export function oddPuzzle(level: KeyLevel, stats: ExerciseStats, previous?: string, random: Random = Math.random): KeyPuzzle {
    const key = pickKey(level, stats, previous, random)
    const triads = keyTriads(key)
    const inKey = shuffle(triads, random).slice(0, 3).map(({root, type}) => ({root, type}))
    const outside = ROOT_NOTES.flatMap(root => (["M", "m"] as const).map(type => ({root, type})))
        .filter(chord => !triads.some(triad => sameChord(triad, chord)))
    const traps = outside.filter(chord => triads.some(triad => chroma(triad.root) === chroma(chord.root)))
    const pool = random() < 0.5 && traps.length > 0 ? traps : outside
    const odd = pool[randomInt(pool.length, random)]!
    const chords = shuffle([...inKey, odd], random)
    return {kind: "odd", key, chords, odd: chords.indexOf(odd)}
}

/** Familiar progressions as scale-degree indices (0 = I): one chord of each is hidden. */
const PATTERNS: Record<KeyMode, number[][]> = {
    major: [[0, 3, 4, 0], [0, 4, 5, 3], [0, 5, 3, 4], [5, 3, 0, 4], [1, 4, 0, 0], [0, 3, 0, 4]],
    minor: [[0, 3, 4, 0], [0, 5, 2, 6], [0, 6, 5, 6], [0, 5, 3, 4], [0, 3, 6, 2]],
}

export function fillPuzzle(level: KeyLevel, stats: ExerciseStats, previous?: string, random: Random = Math.random): KeyPuzzle {
    const key = pickKey(level, stats, previous, random)
    const triads = keyTriads(key)
    const patterns = PATTERNS[key.mode]
    const steps = patterns[randomInt(patterns.length, random)]!.map(degree => triads[degree]!)
    // Never hide the first chord: it sets the key before the gap.
    const hidden = 1 + randomInt(steps.length - 1, random)
    return {kind: "fill", key, steps, hidden, options: triads}
}

export const PUZZLES: Record<KeyPuzzleMode, typeof keyPuzzle> = {key: keyPuzzle, odd: oddPuzzle, fill: fillPuzzle}
