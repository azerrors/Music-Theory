import {SCALES} from "@/constants/scales"
import {STANDARD_TUNING} from "@/constants/tunings"
import {markersForTones, zipTones} from "@/lib/theory/fretboard"
import {getDiatonicChords, getScaleInfo} from "@/lib/theory/scales"

describe("getScaleInfo", () => {
    it("resolves every scale in the catalogue", () => {
        for (const scale of SCALES) {
            expect(getScaleInfo("C", scale.id), scale.id).not.toBeNull()
        }
    })

    it("spells A minor pentatonic with its degrees", () => {
        const info = getScaleInfo("A", "minorPentatonic")!
        expect(info.notes).toEqual(["A", "C", "D", "E", "G"])
        expect(info.degrees).toEqual(["1", "♭3", "4", "5", "♭7"])
    })
})

describe("getDiatonicChords", () => {
    it("labels the chords of C major with roman numerals", () => {
        const chords = getDiatonicChords("C", "major")!
        expect(chords.map(chord => chord.roman)).toEqual(["I", "ii", "iii", "IV", "V", "vi", "vii°"])
        expect(chords.map(chord => chord.triad)).toEqual(["C", "Dm", "Em", "F", "G", "Am", "Bdim"])
    })

    it("uses flat numerals for natural minor", () => {
        const chords = getDiatonicChords("A", "minor")!
        expect(chords.map(chord => chord.roman)).toEqual(["i", "ii°", "♭III", "iv", "v", "♭VI", "♭VII"])
    })

    it("returns null for scales without a simple key", () => {
        expect(getDiatonicChords("C", "blues")).toBeNull()
    })
})

describe("markersForTones", () => {
    it("finds every E on the first five frets in standard tuning", () => {
        const markers = markersForTones(STANDARD_TUNING, 5, zipTones(["E"], ["1"]))
        const positions = markers.map(marker => [marker.string, marker.fret])
        expect(positions).toEqual([[0, 0], [2, 2], [4, 5], [5, 0]])
        expect(markers.every(marker => marker.isRoot)).toBe(true)
    })

    it("spells notes the way the scale spells them", () => {
        const info = getScaleInfo("F", "major")!
        const markers = markersForTones(STANDARD_TUNING, 12, zipTones(info.notes, info.degrees))
        expect(markers.some(marker => marker.note === "Bb")).toBe(true)
        expect(markers.some(marker => marker.note === "A#")).toBe(false)
    })
})
