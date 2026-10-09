import {formatNote, pitchAt, rootToSlug, slugToRoot, spellInContext} from "@/lib/theory/notes"

describe("pitchAt", () => {
    it("adds frets to the open string", () => {
        expect(pitchAt("E2", 3)).toBe("G2")
        expect(pitchAt("B3", 1)).toBe("C4")
    })
})

describe("formatNote", () => {
    it("uses real accidental glyphs", () => {
        expect(formatNote("F#")).toBe("F♯")
        expect(formatNote("Bb")).toBe("B♭")
    })

    it("supports solfège", () => {
        expect(formatNote("C#", "solfege")).toBe("Do♯")
        expect(formatNote("B", "solfege")).toBe("Si")
    })
})

describe("root slugs", () => {
    it.each(["C", "C#", "Eb", "F#", "Bb"])("round-trips %s", root => {
        expect(slugToRoot(rootToSlug(root))).toBe(root)
    })

    it("rejects garbage", () => {
        expect(slugToRoot("H")).toBeNull()
    })
})

describe("spellInContext", () => {
    it("picks the context's spelling of a pitch", () => {
        expect(spellInContext(10, ["F", "G", "A", "Bb"])).toBe("Bb")
    })
})
