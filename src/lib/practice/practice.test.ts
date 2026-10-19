import {STANDARD_TUNING} from "@/constants/tunings"
import {CIRCLE_MAJORS, CIRCLE_MINORS, keySignature} from "@/lib/theory/circle"
import {chroma, mod12} from "@/lib/theory/notes"
import {
    circleQuestion,
    EAR_MAX_LEAP,
    earQuestion,
    findQuestion,
    guitarSpots,
    NATURAL_NOTES,
    pianoSpots,
    slotNote,
    spellingOf,
    weightedPick,
    type Random,
} from "./questions"
import {emptyStore, exerciseStats, HISTORY_LIMIT, itemWeight, readStore, recordAnswer, recordSession, weakestItems, writeStore} from "./stats"

/** A fixed sequence of "random" numbers, repeated. */
const sequence = (...values: number[]): Random => {
    let at = 0
    return () => values[at++ % values.length]!
}

const noStats = exerciseStats(emptyStore(), "x")

describe("weightedPick", () => {
    it("lands on an item in proportion to its weight", () => {
        const weight = (item: string) => (item === "b" ? 3 : 1)
        expect(weightedPick(["a", "b", "c"], weight, () => 0.1)).toBe("a")
        expect(weightedPick(["a", "b", "c"], weight, () => 0.5)).toBe("b")
        expect(weightedPick(["a", "b", "c"], weight, () => 0.99)).toBe("c")
    })
})

describe("itemWeight", () => {
    it("asks missed items more and mastered ones less, within bounds", () => {
        expect(itemWeight(undefined)).toBe(1)
        expect(itemWeight({right: 0, wrong: 3})).toBe(4)
        expect(itemWeight({right: 20, wrong: 0})).toBe(0.4)
        expect(itemWeight({right: 1, wrong: 5})).toBeGreaterThan(itemWeight({right: 5, wrong: 1}))
    })
})

describe("earQuestion", () => {
    const neck = guitarSpots(STANDARD_TUNING, 22)
    const keys = pianoSpots(21, 108)

    it("starts anywhere and lands on the note within an octave, at a real place", () => {
        for (let roll = 0; roll < 1; roll += 0.013) {
            for (const spots of [neck, keys]) {
                const question = earQuestion("natural", spots, noStats, undefined, sequence(roll, 1 - roll, (roll * 7) % 1))
                expect(NATURAL_NOTES).toContain(question.note)
                expect(NATURAL_NOTES.map(chroma)).toContain(mod12(question.reference.midi))
                expect(mod12(question.target.midi)).toBe(chroma(question.note))
                expect(question.target.midi).not.toBe(question.reference.midi)
                expect(Math.abs(question.target.midi - question.reference.midi)).toBeLessThanOrEqual(EAR_MAX_LEAP)
                expect(spots).toContainEqual(question.target)
                expect(spots).toContainEqual(question.reference)
            }
        }
    })

    it("does not always start from the same note", () => {
        const starts = new Set<number>()
        for (let roll = 0; roll < 1; roll += 0.05) starts.add(earQuestion("all", neck, noStats, undefined, sequence(0.5, roll, 0.5)).reference.midi)
        expect(starts.size).toBeGreaterThan(5)
    })

    it("does not ask the same note twice in a row", () => {
        for (let roll = 0; roll < 1; roll += 0.05) {
            expect(earQuestion("all", keys, noStats, "E", () => roll).note).not.toBe("E")
        }
    })

    it("favours notes that were missed", () => {
        let store = emptyStore()
        for (let i = 0; i < 5; i++) store = recordAnswer(store, "ear", "F#", false)
        const stats = exerciseStats(store, "ear")
        const counts = new Map<string, number>()
        for (let roll = 0; roll < 1; roll += 0.002) {
            const note = earQuestion("all", keys, stats, undefined, () => roll).note
            counts.set(note, (counts.get(note) ?? 0) + 1)
        }
        expect(counts.get("F#")!).toBeGreaterThan(2 * (counts.get("C") ?? 0))
    })
})

describe("findQuestion", () => {
    const spots = guitarSpots(STANDARD_TUNING, 12)

    it("covers every string from the open string to the last fret", () => {
        expect(spots).toHaveLength(6 * 13)
        expect(spots[0]).toEqual({string: 0, fret: 0, midi: 40})
    })

    it("lights a spot that really is the note in name mode", () => {
        for (let roll = 0; roll < 1; roll += 0.09) {
            const question = findQuestion("name", spots, noStats, undefined, sequence(roll, 1 - roll))
            expect(mod12(question.spot!.midi)).toBe(chroma(question.note))
        }
    })

    it("asks only for a note in tap mode", () => {
        expect(findQuestion("tap", pianoSpots(48, 72), noStats, undefined, () => 0.3).spot).toBeUndefined()
    })

    it("spells pitches the way the pickers do", () => {
        expect([61, 63, 66, 68, 70].map(spellingOf)).toEqual(["C#", "Eb", "F#", "Ab", "Bb"])
    })
})

describe("circleQuestion", () => {
    it("counts steps round the circle to the answer", () => {
        for (let roll = 0; roll < 1; roll += 0.013) {
            const question = circleQuestion(noStats, undefined, sequence(0.1, roll, roll, 1 - roll))
            if (question.kind !== "steps") continue
            const start = CIRCLE_MAJORS.indexOf(question.from)
            const moved = question.direction === "clockwise" ? start + question.steps : start - question.steps
            expect(mod12(moved)).toBe(question.answer.index)
            expect(question.steps).toBeGreaterThanOrEqual(1)
            expect(question.steps).toBeLessThanOrEqual(5)
        }
    })

    it("gives the signature of the answer key, never the ambiguous F♯/G♭", () => {
        for (let roll = 0; roll < 1; roll += 0.013) {
            const question = circleQuestion(noStats, undefined, sequence(0.5, roll))
            expect(question.kind).toBe("signature")
            if (question.kind !== "signature") continue
            expect(question.answer.index).not.toBe(6)
            expect(question.signature).toEqual(keySignature(slotNote(question.answer), "major"))
        }
    })

    it("pairs a key with its relative on the other ring", () => {
        for (let roll = 0; roll < 1; roll += 0.013) {
            const question = circleQuestion(noStats, undefined, sequence(0.9, roll))
            expect(question.kind).toBe("relative")
            if (question.kind !== "relative") continue
            expect(question.fromRing).not.toBe(question.answer.ring)
            const ring = question.fromRing === "major" ? CIRCLE_MAJORS : CIRCLE_MINORS
            expect(ring[question.answer.index]).toBe(question.from)
        }
    })
})

describe("practice store", () => {
    it("counts answers per item and keeps the best score per level", () => {
        let store = recordAnswer(emptyStore(), "guitar:ear", "C", true)
        store = recordAnswer(store, "guitar:ear", "C", false)
        store = recordSession(store, {exercise: "guitar:ear", level: "all", score: 7, total: 10, at: 1})
        store = recordSession(store, {exercise: "guitar:ear", level: "all", score: 5, total: 10, at: 2})
        const stats = exerciseStats(store, "guitar:ear")
        expect(stats.items.C).toEqual({right: 1, wrong: 1})
        expect(stats.best.all).toBe(7)
        expect(stats.sessions).toBe(2)
        expect(store.history[0]!.at).toBe(2)
    })

    it("caps the session history", () => {
        let store = emptyStore()
        for (let at = 0; at < HISTORY_LIMIT + 10; at++) store = recordSession(store, {exercise: "e", level: "l", score: 1, total: 10, at})
        expect(store.history).toHaveLength(HISTORY_LIMIT)
    })

    it("lists the most missed items first", () => {
        let store = emptyStore()
        const answer = (item: string, correct: boolean, times: number) => {
            for (let i = 0; i < times; i++) store = recordAnswer(store, "e", item, correct)
        }
        answer("A", false, 3)
        answer("B", true, 3)
        answer("B", false, 1)
        answer("C", false, 1)
        expect(weakestItems(exerciseStats(store, "e"))).toEqual(["A", "B"])
    })

    it("reads back what it wrote and starts fresh on bad data", () => {
        const data = new Map<string, string>()
        const storage = {getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => void data.set(key, value)}
        const store = recordAnswer(emptyStore(), "e", "C", true)
        writeStore(store, storage)
        expect(readStore(storage)).toEqual(store)
        data.set("practice:v1", "{not json")
        expect(readStore(storage)).toEqual(emptyStore())
    })
})
