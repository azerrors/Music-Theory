import {describe, expect, it} from "vitest"
import {chordFingering} from "@/lib/piano/fingering"

describe("chordFingering", () => {
    it("fingers triads and their inversions the textbook way", () => {
        // C major: root position, first and second inversion.
        expect(chordFingering([60, 64, 67], "right")).toEqual([1, 3, 5])
        expect(chordFingering([64, 67, 72], "right")).toEqual([1, 2, 5])
        expect(chordFingering([67, 72, 76], "right")).toEqual([1, 3, 5])
        expect(chordFingering([48, 52, 55], "left")).toEqual([5, 3, 1])
        expect(chordFingering([52, 55, 60], "left")).toEqual([5, 3, 1])
        expect(chordFingering([55, 60, 64], "left")).toEqual([5, 2, 1])
    })

    it("fingers minor triads like major ones", () => {
        expect(chordFingering([60, 63, 67], "right")).toEqual([1, 3, 5])
    })

    it("fingers seventh chords 1-2-3-5 and 5-3-2-1", () => {
        expect(chordFingering([60, 64, 67, 71], "right")).toEqual([1, 2, 3, 5])
        expect(chordFingering([48, 52, 55, 59], "left")).toEqual([5, 3, 2, 1])
    })

    it("spreads two fingers with the interval", () => {
        expect(chordFingering([60, 62], "right")).toEqual([1, 2])
        expect(chordFingering([60, 64], "right")).toEqual([1, 3])
        expect(chordFingering([60, 65], "right")).toEqual([1, 4])
        expect(chordFingering([60, 66], "right")).toEqual([1, 4])
        expect(chordFingering([60, 67], "right")).toEqual([1, 5])
        expect(chordFingering([48, 60], "left")).toEqual([5, 1])
    })

    it("puts a lone bass note on the left little finger", () => {
        expect(chordFingering([40], "left")).toEqual([5])
    })

    it("gives up when the keys don't fit in one hand", () => {
        // C13 stacked in thirds spans almost two octaves.
        expect(chordFingering([60, 64, 67, 70, 74, 81], "right")).toBeNull()
        expect(chordFingering([60, 64, 67, 74], "right")).toBeNull()
    })

    it("sorts the keys first", () => {
        expect(chordFingering([67, 60, 64], "right")).toEqual([1, 3, 5])
    })
})
