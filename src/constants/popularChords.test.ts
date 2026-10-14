import {POPULAR_CHORDS, POPULAR_TYPES} from "@/constants/popularChords"
import {getChordInfo} from "@/lib/theory/chords"
import {getVoicings, primaryVoicing, sortByPosition, voicingPosition} from "@/lib/theory/voicings"

describe("POPULAR_CHORDS", () => {
    it("lists about 200 distinct chords", () => {
        expect(POPULAR_CHORDS).toHaveLength(204)
        expect(new Set(POPULAR_CHORDS.map(chord => chord.root + chord.type)).size).toBe(204)
    })

    it("starts with the chords songs use most", () => {
        expect(POPULAR_CHORDS.slice(0, 5).map(chord => chord.root + chord.type)).toEqual(["GM", "CM", "DM", "AM", "EM"])
        expect(POPULAR_CHORDS[12]).toMatchObject({root: "A", type: "m"})
    })

    it.each(POPULAR_CHORDS)("#$rank $root $type is a catalogue chord with shapes in at least 3 places on the neck", chord => {
        expect(getChordInfo(chord.root, chord.type)).not.toBeNull()
        const positions = new Set(getVoicings(chord.root, chord.type).map(voicingPosition))
        expect(positions.size).toBeGreaterThanOrEqual(3)
    })

    it("covers every popular type", () => {
        expect(new Set(POPULAR_CHORDS.map(chord => chord.type))).toEqual(new Set(POPULAR_TYPES))
    })
})

describe("primaryVoicing", () => {
    it("prefers the open chord", () => {
        expect(primaryVoicing(getVoicings("G", "M"))!.frets).toEqual([3, 2, 0, 0, 0, 3])
    })

    it("falls back to the barre shape nearest the nut", () => {
        // Bm: the A-shape at the 2nd fret, not the E-shape at the 7th.
        expect(primaryVoicing(getVoicings("B", "m"))!.frets).toEqual([null, 2, 4, 4, 3, 2])
    })
})

describe("sortByPosition", () => {
    it("orders shapes up the neck", () => {
        const positions = sortByPosition(getVoicings("C", "M")).map(voicingPosition)
        expect(positions.slice(1)).toEqual([...positions.slice(1)].sort((a, b) => a - b))
    })
})
