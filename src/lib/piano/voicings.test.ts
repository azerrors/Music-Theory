import {describe, expect, it} from "vitest"
import {getChordInfo} from "@/lib/theory/chords"
import {closeVoicing, inversionCount, keyboardRange, pianoVoicings, rootMidi, slashVoicing, twoHandVoicing} from "@/lib/piano/voicings"

const chord = (root: string, type: string, bass?: string) => getChordInfo(root, type, bass)!

describe("rootMidi", () => {
    it("keeps roots around middle C", () => {
        expect(rootMidi("C")).toBe(60)
        expect(rootMidi("F#")).toBe(66)
        expect(rootMidi("G")).toBe(55)
        expect(rootMidi("B")).toBe(59)
    })
})

describe("closeVoicing", () => {
    it("stacks a root-position triad", () => {
        expect(closeVoicing(chord("C", "M"))).toEqual([60, 64, 67])
    })

    it("keeps every inversion close to the root position bass", () => {
        expect(closeVoicing(chord("C", "M"), 1)).toEqual([64, 67, 72])
        expect(closeVoicing(chord("C", "M"), 2)).toEqual([55, 60, 64])
        expect(closeVoicing(chord("G", "7"), 3)).toEqual([53, 55, 59, 62])
    })
})

describe("inversionCount", () => {
    it("allows inversions only for chords within an octave", () => {
        expect(inversionCount(chord("C", "M"))).toBe(2)
        expect(inversionCount(chord("C", "maj7"))).toBe(3)
        expect(inversionCount(chord("C", "5"))).toBe(1)
        expect(inversionCount(chord("C", "add9"))).toBe(0)
        expect(inversionCount(chord("C", "13"))).toBe(0)
    })
})

describe("twoHandVoicing", () => {
    it("plays the root low and the triad above", () => {
        expect(twoHandVoicing(chord("C", "M"))).toEqual({left: [48], right: [60, 64, 67]})
    })

    it("drops the root from the right hand on seventh chords", () => {
        expect(twoHandVoicing(chord("C", "maj7"))).toEqual({left: [48], right: [64, 67, 71]})
    })

    it("moves the 7th to the left hand and leaves out the 5th on extended chords", () => {
        // C13: C + B♭ below, E A D above.
        expect(twoHandVoicing(chord("C", "13"))).toEqual({left: [48, 58], right: [64, 69, 74]})
    })
})

describe("slashVoicing", () => {
    it("puts the bass note just below the chord", () => {
        expect(slashVoicing(chord("C", "M", "E"))).toEqual({left: [52], right: [60, 64, 67]})
        expect(slashVoicing(chord("D", "M", "C"))).toEqual({left: [60], right: [62, 66, 69]})
    })
})

describe("pianoVoicings", () => {
    it("lists root position, every inversion and the two-hand voicing", () => {
        expect(pianoVoicings(chord("A", "m")).map(voicing => voicing.id)).toEqual(["close-0", "close-1", "close-2", "twoHands"])
    })

    it("adds the matching inversion to a slash chord", () => {
        expect(pianoVoicings(chord("C", "M", "G")).map(voicing => voicing.id)).toEqual(["slash", "close-2"])
        expect(pianoVoicings(chord("D", "M", "C")).map(voicing => voicing.id)).toEqual(["slash"])
    })
})

describe("keyboardRange", () => {
    it("starts on C and spans at least two octaves", () => {
        expect(keyboardRange([60, 64, 67])).toEqual({from: 60, to: 83})
        expect(keyboardRange([48, 64, 69, 74])).toEqual({from: 48, to: 76})
    })

    it("stops at the first E or B past the highest note", () => {
        expect(keyboardRange([48, 77])).toEqual({from: 48, to: 83})
        expect(keyboardRange([48, 72])).toEqual({from: 48, to: 76})
    })
})
