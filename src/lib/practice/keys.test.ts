import {chroma} from "@/lib/theory/notes"
import {ALL_KEYS, chordMidi, fillPuzzle, fitsKey, keyPuzzle, keyTriads, oddPuzzle, sameChord} from "./keys"
import {slotKey, type Random} from "./questions"
import {emptyStore, exerciseStats} from "./stats"

const noStats = exerciseStats(emptyStore(), "x")
const rolls = (step: number) => Array.from({length: Math.floor(1 / step)}, (_, index) => index * step)
const seeded = (seed: number): Random => {
    let state = seed
    return () => {
        state = (state * 9301 + 49297) % 233280
        return state / 233280
    }
}

describe("keyTriads", () => {
    it("gives C major its seven triads in order", () => {
        const triads = keyTriads(ALL_KEYS[0]!)
        expect(triads.map(chord => `${chord.root}${chord.type}`)).toEqual(["CM", "Dm", "Em", "FM", "GM", "Am", "Bdim"])
    })
})

describe("chordMidi", () => {
    it("stacks a triad above its root", () => {
        expect(chordMidi({root: "C", type: "M"}, 48)).toEqual([48, 52, 55])
        expect(chordMidi({root: "A", type: "m"}, 48)).toEqual([57, 60, 64])
        expect(chordMidi({root: "B", type: "dim"}, 48)).toEqual([59, 62, 65])
    })
})

describe("keyPuzzle", () => {
    it("shows four different chords of the key, its home chord among them", () => {
        rolls(0.05).forEach((_, seed) => {
            const puzzle = keyPuzzle("all", noStats, undefined, seeded(seed + 1))
            if (puzzle.kind !== "key") throw new Error("kind")
            expect(puzzle.chords).toHaveLength(4)
            expect(new Set(puzzle.chords.map(chord => `${chroma(chord.root)}${chord.type}`)).size).toBe(4)
            expect(puzzle.chords.some(chord => sameChord(chord, keyTriads(puzzle.key)[0]!))).toBe(true)
            expect(fitsKey(puzzle.key, puzzle.chords)).toBe(true)
        })
    })

    it("accepts every key the chords fit, and the asked key is one of them", () => {
        rolls(0.05).forEach((_, seed) => {
            const puzzle = keyPuzzle("all", noStats, undefined, seeded(seed + 7))
            if (puzzle.kind !== "key") throw new Error("kind")
            expect(puzzle.answers.map(slotKey)).toContain(slotKey(puzzle.key.slot))
            puzzle.answers.forEach(slot => {
                const key = ALL_KEYS.find(candidate => slotKey(candidate.slot) === slotKey(slot))!
                expect(fitsKey(key, puzzle.chords)).toBe(true)
            })
        })
    })

    it("asks only major keys at the major level", () => {
        rolls(0.05).forEach((_, seed) => {
            const puzzle = keyPuzzle("major", noStats, undefined, seeded(seed + 3))
            if (puzzle.kind !== "key") throw new Error("kind")
            expect(puzzle.key.mode).toBe("major")
            expect(puzzle.answers.every(slot => slot.ring === "major")).toBe(true)
        })
    })
})

describe("oddPuzzle", () => {
    it("has exactly one chord outside the key", () => {
        rolls(0.05).forEach((_, seed) => {
            const puzzle = oddPuzzle("all", noStats, undefined, seeded(seed + 11))
            if (puzzle.kind !== "odd") throw new Error("kind")
            const outside = puzzle.chords.filter(chord => !fitsKey(puzzle.key, [chord]))
            expect(outside).toHaveLength(1)
            expect(sameChord(outside[0]!, puzzle.chords[puzzle.odd]!)).toBe(true)
        })
    })
})

describe("fillPuzzle", () => {
    it("hides one chord after the first and offers the key's seven", () => {
        rolls(0.05).forEach((_, seed) => {
            const puzzle = fillPuzzle("all", noStats, undefined, seeded(seed + 21))
            if (puzzle.kind !== "fill") throw new Error("kind")
            expect(puzzle.hidden).toBeGreaterThan(0)
            expect(puzzle.hidden).toBeLessThan(puzzle.steps.length)
            expect(puzzle.options).toHaveLength(7)
            expect(puzzle.options.some(option => sameChord(option, puzzle.steps[puzzle.hidden]!))).toBe(true)
        })
    })

    it("never asks the same key twice in a row", () => {
        rolls(0.05).forEach((roll, seed) => {
            const previous = slotKey(ALL_KEYS[seed % 12]!.slot)
            expect(slotKey(fillPuzzle("major", noStats, previous, () => roll).key.slot)).not.toBe(previous)
        })
    })
})
