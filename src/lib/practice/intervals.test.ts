import {STANDARD_TUNING} from "@/constants/tunings"
import {intervalQuestion, levelIntervals} from "./intervals"
import {guitarSpots, pianoSpots, type Random} from "./questions"
import {emptyStore, exerciseStats, recordAnswer} from "./stats"

const noStats = exerciseStats(emptyStore(), "x")
const seeded = (seed: number): Random => {
    let state = seed
    return () => {
        state = (state * 9301 + 49297) % 233280
        return state / 233280
    }
}
const neck = guitarSpots(STANDARD_TUNING, 22)
const keys = pianoSpots(36, 96)

describe("levelIntervals", () => {
    it("grows from five clear intervals to all twelve", () => {
        expect(levelIntervals("basic").map(interval => interval.id)).toEqual(["3m", "3M", "4P", "5P", "8P"])
        expect(levelIntervals("more")).toHaveLength(9)
        expect(levelIntervals("all")).toHaveLength(12)
        expect(levelIntervals("all").some(interval => interval.id === "1P")).toBe(false)
    })

    it("takes the picked intervals for the custom level, in their usual order", () => {
        expect(levelIntervals("custom", ["2M", "2m"]).map(interval => interval.id)).toEqual(["2m", "2M"])
        expect(levelIntervals("custom", ["1P", "nope"])).toEqual([])
    })
})

describe("intervalQuestion", () => {
    it("puts the second note the asked interval away, in the asked direction, at a real place", () => {
        for (let seed = 1; seed < 80; seed++) {
            for (const spots of [neck, keys]) {
                const question = intervalQuestion(levelIntervals("all"), spots, ["up", "down"], noStats, undefined, seeded(seed))
                const step = question.target.midi - question.reference.midi
                expect(Math.abs(step)).toBe(question.interval.semitones)
                expect(Math.sign(step)).toBe(question.direction === "up" ? 1 : -1)
                expect(spots).toContainEqual(question.reference)
                expect(spots).toContainEqual(question.target)
            }
        }
    })

    it("only goes up when only up is allowed, and stays within the level", () => {
        for (let seed = 1; seed < 40; seed++) {
            const question = intervalQuestion(levelIntervals("basic"), keys, ["up"], noStats, undefined, seeded(seed))
            expect(question.direction).toBe("up")
            expect(levelIntervals("basic")).toContainEqual(question.interval)
        }
    })

    it("asks only the picked intervals", () => {
        const pool = levelIntervals("custom", ["2m", "2M"])
        for (let seed = 1; seed < 40; seed++) {
            expect(["2m", "2M"]).toContain(intervalQuestion(pool, keys, ["up", "down"], noStats, undefined, seeded(seed)).interval.id)
        }
    })

    it("does not repeat the previous interval and favours missed ones", () => {
        for (let seed = 1; seed < 40; seed++) {
            expect(intervalQuestion(levelIntervals("basic"), keys, ["up"], noStats, "5P", seeded(seed)).interval.id).not.toBe("5P")
        }
        let store = emptyStore()
        for (let i = 0; i < 6; i++) store = recordAnswer(store, "e", "3m", false)
        const stats = exerciseStats(store, "e")
        const counts = new Map<string, number>()
        for (let roll = 0; roll < 1; roll += 0.002) {
            const id = intervalQuestion(levelIntervals("basic"), keys, ["up"], stats, undefined, () => roll).interval.id
            counts.set(id, (counts.get(id) ?? 0) + 1)
        }
        expect(counts.get("3m")!).toBeGreaterThan(2 * (counts.get("5P") ?? 0))
    })
})
