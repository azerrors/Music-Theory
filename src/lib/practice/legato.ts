import type {ScalePosition} from "@/lib/theory/positions"
import type {StringIndex} from "@/types/music"

export type Finger = 1 | 2 | 3 | 4
export type Technique = "pick" | "hammer" | "pull"

export interface LegatoNote {
    string: StringIndex
    fret: number
    finger: Finger
    technique: Technique
}

/** The notes played from one hand placement, before the hand moves. */
export type LegatoGroup = LegatoNote[]

export const LEGATO_PATTERNS = ["up", "down", "upDown", "roll", "rollBack", "trill", "skip"] as const
export type LegatoPattern = (typeof LEGATO_PATTERNS)[number]

/** Fingers in playing order; the first note of each placement is picked, the rest are legato. */
export const PATTERN_FINGERS: Record<LegatoPattern, Finger[]> = {
    up: [1, 3, 4],
    down: [4, 3, 1],
    upDown: [1, 3, 4, 3, 1],
    roll: [1, 3, 4, 3],
    rollBack: [4, 3, 1, 3],
    trill: [1, 3, 4, 3, 4, 3, 1],
    skip: [1, 4, 3, 4],
}

/** How far above the first finger each finger sits in the 1-3-4 grip: a whole step, then a half step. */
const GRIP_OFFSET: Record<Finger, number> = {1: 0, 2: 1, 3: 2, 4: 3}

export const LEGATO_MOVES = ["alongString", "acrossStrings", "diagonal", "zigzag"] as const
export type LegatoMove = (typeof LEGATO_MOVES)[number]

export interface MoveOptions {
    /** The string for a move along one string. */
    string: StringIndex
    /** First-finger fret where the move starts. */
    from: number
    /** First-finger fret where a move along the neck turns (or ends, for the zigzag). */
    to: number
    stringCount: number
}

interface Placement {
    string: StringIndex
    fret: number
}

/** Inclusive, in either direction. */
function span(from: number, to: number): number[] {
    const step = from <= to ? 1 : -1
    return Array.from({length: Math.abs(to - from) + 1}, (_, index) => from + index * step)
}

/** There and back, without playing the turning point twice. */
function thereAndBack<T>(items: T[]): T[] {
    return [...items, ...items.slice(0, -1).reverse()]
}

/** Marks each note picked, hammered or pulled: legato goes up or down on the same string, a new string is picked. */
export function withTechniques(notes: Omit<LegatoNote, "technique">[]): LegatoGroup {
    return notes.map((note, index) => {
        const previous = notes[index - 1]
        const technique: Technique = !previous || previous.string !== note.string ? "pick" : note.fret > previous.fret ? "hammer" : "pull"
        return {...note, technique}
    })
}

export function gripGroup(pattern: LegatoPattern, string: StringIndex, fret: number): LegatoGroup {
    return withTechniques(PATTERN_FINGERS[pattern].map(finger => ({string, fret: fret + GRIP_OFFSET[finger], finger})))
}

/** The hand placements a move walks through, each as a string and a first-finger fret. */
export function movePlacements(move: LegatoMove, {string, from, to, stringCount}: MoveOptions): Placement[] {
    const lowToHigh = span(0, stringCount - 1)
    switch (move) {
        case "alongString":
            return thereAndBack(span(from, to)).map(fret => ({string, fret}))
        case "acrossStrings":
            return thereAndBack(lowToHigh).map(at => ({string: at, fret: from}))
        case "diagonal":
            // One fret higher on each higher string, then back down the same line.
            return thereAndBack(lowToHigh).map(at => ({string: at, fret: from + at}))
        case "zigzag":
            // Across all strings, one fret along, back across, and so on up the neck.
            return span(from, to).flatMap((fret, index) => {
                const order = index % 2 === 0 ? lowToHigh : [...lowToHigh].reverse()
                return order.map(at => ({string: at, fret}))
            })
    }
}

export function legatoExercise(pattern: LegatoPattern, move: LegatoMove, options: MoveOptions): LegatoGroup[] {
    return movePlacements(move, options).map(placement => gripGroup(pattern, placement.string, placement.fret))
}

/** Three notes on one string: 1-3-4 when the whole step comes first, 1-2-4 when the half step does, 1-2-3 for a chromatic cluster. */
export function stringFingers(frets: number[]): Finger[] {
    const [first, middle, last] = frets as [number, number, number]
    if (last - first <= 2) return [1, 2, 3]
    return middle - first > last - middle ? [1, 3, 4] : [1, 2, 4]
}

export interface ScaleString {
    string: StringIndex
    notes: {fret: number, finger: Finger}[]
    /** Played with the 1-3-4 grip. */
    isGrip: boolean
}

/** A three-notes-per-string position split into strings, low to high, each with its fingering. */
export function positionStrings(position: ScalePosition): ScaleString[] {
    const strings = [...new Set(position.notes.map(note => note.string))].sort((a, b) => a - b)
    return strings.map(string => {
        const frets = position.notes.filter(note => note.string === string).map(note => note.fret).sort((a, b) => a - b)
        const fingers = stringFingers(frets)
        return {
            string,
            notes: frets.map((fret, index) => ({fret, finger: fingers[index]!})),
            isGrip: fingers.join() === "1,3,4",
        }
    })
}

export const SCALE_RUNS = ["up", "down", "upDown", "loop"] as const
export type ScaleRun = (typeof SCALE_RUNS)[number]

/** One group per string: picked on the first note of each string, legato for the rest. */
export function scaleRun(strings: ScaleString[], run: ScaleRun): LegatoGroup[] {
    const ascending = (item: ScaleString) => item.notes.map(note => ({string: item.string, ...note}))
    const descending = (item: ScaleString) => ascending(item).reverse()
    const upAndDown = (item: ScaleString) => withTechniques([...ascending(item), ...descending(item).slice(1)])

    switch (run) {
        case "up":
            return strings.map(item => withTechniques(ascending(item)))
        case "down":
            return [...strings].reverse().map(item => withTechniques(descending(item)))
        case "upDown": {
            // The top string turns around in one group.
            const below = strings.slice(0, -1)
            const top = strings.at(-1)
            if (!top) return []
            return [
                ...below.map(item => withTechniques(ascending(item))),
                upAndDown(top),
                ...[...below].reverse().map(item => withTechniques(descending(item))),
            ]
        }
        case "loop":
            return strings.map(upAndDown)
    }
}
