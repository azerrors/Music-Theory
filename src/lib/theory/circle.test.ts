import {Interval} from "tonal"
import {CIRCLE_MAJORS, CIRCLE_MINORS, circleIndex, keyFamily, keySignature} from "@/lib/theory/circle"
import {chroma, mod12} from "@/lib/theory/notes"
import {diatonicChords} from "@/lib/theory/progressions"

describe("circle order", () => {
    it("moves a fifth up at every step", () => {
        CIRCLE_MAJORS.forEach((note, index) => {
            const next = CIRCLE_MAJORS[(index + 1) % 12]!
            expect(mod12(chroma(next) - chroma(note))).toBe(7)
        })
    })

    it("puts each relative minor a minor third below its major", () => {
        CIRCLE_MAJORS.forEach((major, index) => {
            expect(Interval.semitones(Interval.distance(CIRCLE_MINORS[index]!, major))).toBe(3)
        })
    })

    it("finds minor keys under their relative major", () => {
        expect(circleIndex("E", "minor")).toBe(circleIndex("G", "major"))
    })
})

describe("keySignature", () => {
    it.each([
        ["C", "major", 0, "none"],
        ["G", "major", 1, "sharp"],
        ["E", "major", 4, "sharp"],
        ["F", "major", 1, "flat"],
        ["Eb", "major", 3, "flat"],
        ["A", "minor", 0, "none"],
        ["D", "minor", 1, "flat"],
    ] as const)("%s %s → %i %s", (tonic, mode, count, type) => {
        expect(keySignature(tonic, mode)).toMatchObject({count, type})
    })

    it("lists accidentals in written order", () => {
        expect(keySignature("D", "major").accidentals).toEqual(["F#", "C#"])
        expect(keySignature("Bb", "major").accidentals).toEqual(["Bb", "Eb"])
    })
})

describe("keyFamily", () => {
    it("groups the six main chords of G major around it", () => {
        const names = keyFamily("G", "major").map(item => (item.ring === "major" ? CIRCLE_MAJORS : CIRCLE_MINORS)[item.index] + item.ring)
        expect(names).toEqual(["Gmajor", "Cmajor", "Dmajor", "Eminor", "Aminor", "Bminor"])
    })

    it.each(CIRCLE_MAJORS)("matches the diatonic chords of %s major", tonic => {
        const family = keyFamily(tonic, "major").map(item => chroma((item.ring === "major" ? CIRCLE_MAJORS : CIRCLE_MINORS)[item.index]!))
        const diatonic = diatonicChords(tonic, "major").filter(chord => chord.type !== "dim").map(chord => chroma(chord.root))
        expect(new Set(family)).toEqual(new Set(diatonic))
    })
})
