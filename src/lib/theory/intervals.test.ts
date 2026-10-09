import {Interval} from "tonal"
import {STANDARD_TUNING} from "@/constants/tunings"
import {INTERVALS, intervalPositions, intervalShapes} from "@/lib/theory/intervals"
import {midiAt} from "@/lib/theory/notes"

const ALL = INTERVALS.map(interval => interval.id)

describe("INTERVALS", () => {
    it.each(INTERVALS)("$id is $semitones semitones", interval => {
        expect(Interval.semitones(interval.id)).toBe(interval.semitones)
    })
})

describe("intervalPositions", () => {
    // C on the A string, 3rd fret.
    const reference = {string: 1, fret: 3}

    it("finds the classic shapes around C", () => {
        const positions = intervalPositions(STANDARD_TUNING, reference, 15, ["3M", "5P", "8P"])
        const at = (id: string) => positions.filter(position => position.interval.id === id).map(({string, fret}) => `${string}:${fret}`)
        expect(at("5P")).toContain("2:5") // G on the D string
        expect(at("8P")).toContain("3:5") // C on the G string
        expect(at("3M")).toContain("2:2") // E on the D string
        expect(at("3M")).toContain("1:7") // E on the same string
    })

    it("only returns notes the chosen distance above the reference", () => {
        const referenceMidi = midiAt("A2", 3)
        for (const position of intervalPositions(STANDARD_TUNING, reference, 15, ALL)) {
            const midi = midiAt(STANDARD_TUNING.strings[position.string]!, position.fret)
            expect(midi - referenceMidi).toBe(position.interval.semitones)
        }
    })

    it("stays within a hand's reach", () => {
        for (const position of intervalPositions(STANDARD_TUNING, {string: 0, fret: 10}, 15, ALL)) {
            expect(Math.abs(position.fret - 10)).toBeLessThanOrEqual(5)
        }
    })
})

describe("intervalShapes", () => {
    it("puts a fifth two frets up on the next string", () => {
        expect(intervalShapes(STANDARD_TUNING, 0, 7)).toContainEqual({stringsUp: 1, fretOffset: 2})
    })

    it("shifts a shape that crosses from G to B", () => {
        // Octave: two strings up and two frets up from the low strings, but three from the D string.
        expect(intervalShapes(STANDARD_TUNING, 0, 12)).toContainEqual({stringsUp: 2, fretOffset: 2})
        expect(intervalShapes(STANDARD_TUNING, 2, 12)).toContainEqual({stringsUp: 2, fretOffset: 3})
    })
})
