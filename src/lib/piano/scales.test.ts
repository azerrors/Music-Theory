import {describe, expect, it} from "vitest"
import {FINGERED_SCALES} from "@/constants/pianoFingerings"
import {ROOT_NOTES} from "@/constants/notes"
import {crossings, fingeringFor, handScaleMidi, upAndDown} from "@/lib/piano/scales"
import {getScaleInfo} from "@/lib/theory/scales"

const BLACK = new Set([1, 3, 6, 8, 10])
const scale = (root: string, id: string) => getScaleInfo(root, id)!

describe("handScaleMidi", () => {
    it("plays the right hand from middle C and the left an octave lower", () => {
        expect(handScaleMidi(scale("C", "major"), "right")).toEqual([60, 62, 64, 65, 67, 69, 71, 72])
        expect(handScaleMidi(scale("C", "major"), "left")).toEqual([48, 50, 52, 53, 55, 57, 59, 60])
    })
})

describe("upAndDown", () => {
    it("goes back down without repeating the top note", () => {
        expect(upAndDown([1, 2, 3])).toEqual([1, 2, 3, 2, 1])
    })
})

describe("fingeringFor", () => {
    it("gives the textbook C major fingering", () => {
        expect(fingeringFor(scale("C", "major"))).toEqual({right: [1, 2, 3, 1, 2, 3, 4, 5], left: [5, 4, 3, 2, 1, 3, 2, 1]})
    })

    it("has no fingering for pentatonics and modes", () => {
        expect(fingeringFor(scale("A", "minorPentatonic"))).toBeNull()
        expect(fingeringFor(scale("D", "dorian"))).toBeNull()
    })

    // The rule every standard fingering follows; a typo in the table almost always breaks it.
    it.each(FINGERED_SCALES.flatMap(id => ROOT_NOTES.map(root => [root, id] as const)))(
        "%s %s never puts a thumb on a black key",
        (root, id) => {
            const info = scale(root, id)
            const fingering = fingeringFor(info)!
            expect(fingering).not.toBeNull()
            for (const hand of ["right", "left"] as const) {
                const midi = handScaleMidi(info, hand)
                expect(fingering[hand]).toHaveLength(midi.length)
                midi.forEach((note, index) => {
                    if (fingering[hand][index] === 1) expect(BLACK.has(note % 12)).toBe(false)
                })
            }
        },
    )
})

describe("crossings", () => {
    it("finds the thumb passing under in the right hand", () => {
        expect(crossings([1, 2, 3, 1, 2, 3, 4, 5], "right")).toEqual([3])
    })

    it("finds the finger crossing over in the left hand", () => {
        expect(crossings([5, 4, 3, 2, 1, 3, 2, 1], "left")).toEqual([5])
    })
})
