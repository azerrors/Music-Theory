import {INTERVALS, type IntervalDef} from "@/lib/theory/intervals"
import {weightedPick, type Random, type Spot} from "./questions"
import {itemWeight, type ExerciseStats} from "./stats"

/* Intervals: name the gap between two notes by ear, or build it on the instrument. */

export type IntervalMode = "ear" | "build"
export const INTERVAL_MODES: IntervalMode[] = ["ear", "build"]

/** The preset levels, and "custom": the intervals someone picked themselves. */
export type IntervalLevel = "basic" | "more" | "all" | "custom"
export const INTERVAL_LEVELS: IntervalLevel[] = ["basic", "more", "all", "custom"]

/** How the two notes sound in "by ear": one after the other going up or down, or together. */
export type IntervalPlayback = "up" | "down" | "together"
export const INTERVAL_PLAYBACKS: IntervalPlayback[] = ["up", "down", "together"]

export type Direction = "up" | "down"

/** The intervals of each level: the clearest first, then the steps and sixths, then the rest. */
const LEVEL_IDS: Record<Exclude<IntervalLevel, "custom">, string[]> = {
    basic: ["3m", "3M", "4P", "5P", "8P"],
    more: ["2m", "2M", "3m", "3M", "4P", "5P", "6m", "6M", "8P"],
    all: INTERVALS.filter(interval => interval.id !== "1P").map(interval => interval.id),
}

/** Every interval that can be practised: unison to octave, without the unison. */
export const PRACTICE_INTERVALS: IntervalDef[] = INTERVALS.filter(interval => interval.id !== "1P")

/** A level's intervals; the custom level takes the picked ones, in their usual order. */
export const levelIntervals = (level: IntervalLevel, custom: string[] = []): IntervalDef[] => {
    const ids = level === "custom" ? custom : LEVEL_IDS[level]
    return PRACTICE_INTERVALS.filter(interval => ids.includes(interval.id))
}

/** By ear needs two intervals to choose between; building needs one. */
export const minimumIntervals = (mode: IntervalMode) => (mode === "ear" ? 2 : 1)

export interface IntervalQuestion {
    interval: IntervalDef
    direction: Direction
    /** The first note, and where the second one sounds. */
    reference: Spot
    target: Spot
}

const randomInt = (max: number, random: Random) => Math.min(max - 1, Math.floor(random() * max))

/**
 * An interval weighted by past answers, then a first note anywhere on the instrument that leaves
 * room for the second one in the asked direction.
 */
export function intervalQuestion(
    pool: IntervalDef[],
    spots: Spot[],
    directions: Direction[],
    stats: ExerciseStats,
    previous?: string,
    random: Random = Math.random,
): IntervalQuestion {
    const choices = pool.length > 1 ? pool.filter(interval => interval.id !== previous) : pool
    const interval = weightedPick(choices, item => itemWeight(stats.items[item.id]), random)
    const direction = directions[randomInt(directions.length, random)]!
    const step = direction === "up" ? interval.semitones : -interval.semitones
    const byMidi = new Map<number, Spot[]>()
    spots.forEach(spot => byMidi.set(spot.midi, [...(byMidi.get(spot.midi) ?? []), spot]))

    const references = spots.filter(spot => byMidi.has(spot.midi + step))
    const reference = references[randomInt(references.length, random)] ?? spots[0]!
    const targets = byMidi.get(reference.midi + step) ?? [reference]
    return {interval, direction, reference, target: targets[randomInt(targets.length, random)]!}
}
