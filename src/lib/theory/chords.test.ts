import {CHORD_TYPES} from "@/constants/chordTypes"
import {detectChords, formatChordSymbol, getChordInfo, intervalToDegree} from "@/lib/theory/chords"

describe("intervalToDegree", () => {
    it.each([
        ["1P", "1"],
        ["3M", "3"],
        ["3m", "♭3"],
        ["5d", "♭5"],
        ["5A", "♯5"],
        ["7d", "♭♭7"],
        ["9M", "9"],
        ["11P", "11"],
    ])("%s → %s", (interval, degree) => {
        expect(intervalToDegree(interval)).toBe(degree)
    })
})

describe("getChordInfo", () => {
    it("resolves every chord type in the catalogue", () => {
        for (const type of CHORD_TYPES) {
            expect(getChordInfo("C", type.symbol), type.symbol).not.toBeNull()
        }
    })

    it("builds the formula and notes of a minor seventh", () => {
        const info = getChordInfo("A", "m7")!
        expect(info.name).toBe("Am7")
        expect(info.notes).toEqual(["A", "C", "E", "G"])
        expect(info.degrees).toEqual(["1", "♭3", "5", "♭7"])
    })

    it("shows a bare root for major triads", () => {
        expect(getChordInfo("F#", "M")!.name).toBe("F#")
    })

    it("returns null for unknown chord types", () => {
        expect(getChordInfo("C", "nope")).toBeNull()
    })
})

describe("formatChordSymbol", () => {
    it("drops tonal's M suffix for major triads", () => {
        expect(formatChordSymbol("EM")).toBe("E")
    })

    it("keeps slash basses", () => {
        expect(formatChordSymbol("Am7/G")).toBe("Am7/G")
    })
})

describe("detectChords", () => {
    it("names a major seventh from its notes", () => {
        expect(detectChords(["C", "E", "G", "B"])).toContain("Cmaj7")
    })

    it("needs at least two notes", () => {
        expect(detectChords(["C"])).toEqual([])
    })
})
