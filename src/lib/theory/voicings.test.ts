import {Chord} from "tonal"
import {ROOT_NOTES} from "@/constants/notes"
import {MOVABLE_SHAPES} from "@/constants/voicings/movableShapes"
import {OPEN_VOICINGS} from "@/constants/voicings/openVoicings"
import {chroma} from "@/lib/theory/notes"
import {getVoicings, isMovableVoicing, placeShape, voicingFretRange, voicingPitches} from "@/lib/theory/voicings"
import type {NoteName, Voicing} from "@/types/music"

function soundingChromas(voicing: Voicing): number[] {
    return voicingPitches(voicing).flatMap(pitch => (pitch ? [chroma(pitch)] : []))
}

function expectVoicingSpellsChord(voicing: Voicing, root: NoteName, type: string) {
    const chordChromas = Chord.getChord(type, root).notes.map(chroma)
    const sounding = soundingChromas(voicing)
    const label = `${root}${type} ${voicing.frets.map(fret => fret ?? "x").join("-")}`

    expect(sounding.length, label).toBeGreaterThanOrEqual(2)
    for (const pitch of sounding) {
        expect(chordChromas, `${label} plays a non-chord tone`).toContain(pitch)
    }
    expect(sounding, `${label} is missing the root`).toContain(chroma(root))
}

describe("open voicings", () => {
    it.each(OPEN_VOICINGS)("$root$type contains only chord tones", voicing => {
        expectVoicingSpellsChord({id: "", shape: "open", frets: voicing.frets, fingers: voicing.fingers}, voicing.root, voicing.type)
    })

    it.each(OPEN_VOICINGS)("$root$type has six strings of frets and fingers", voicing => {
        expect(voicing.frets).toHaveLength(6)
        expect(voicing.fingers).toHaveLength(6)
    })
})

describe("movable shapes", () => {
    it.each(MOVABLE_SHAPES)("$shape-shape $type is correct in every key", template => {
        for (const root of ROOT_NOTES) {
            const voicing = placeShape(template, root)
            expectVoicingSpellsChord(voicing, root, template.type)
        }
    })

    it("never places a note behind the nut or a barre on it", () => {
        for (const template of MOVABLE_SHAPES) {
            for (const root of ROOT_NOTES) {
                const voicing = placeShape(template, root)
                const frets = voicing.frets.filter(fret => fret !== null)
                expect(Math.min(...frets)).toBeGreaterThanOrEqual(0)
                if (voicing.barre) expect(voicing.barre.fret).toBeGreaterThanOrEqual(1)
            }
        }
    })

    it("keeps an open string instead of jumping an octave when the shape allows it", () => {
        const shape = MOVABLE_SHAPES.find(template => template.type === "dim7" && template.shape === "A")!
        expect(placeShape(shape, "Bb").frets).toEqual([null, 1, 2, 0, 2, null])
    })

    it("puts the F major E-shape barre on the first fret", () => {
        const shape = MOVABLE_SHAPES.find(template => template.type === "M" && template.shape === "E")!
        const voicing = placeShape(shape, "F")

        expect(voicing.frets).toEqual([1, 3, 3, 2, 1, 1])
        expect(voicing.barre).toEqual({fret: 1, fromString: 0, toString: 5})
    })

    it("moves an E-rooted E-shape up to the 12th fret instead of duplicating open E", () => {
        const shape = MOVABLE_SHAPES.find(template => template.type === "M" && template.shape === "E")!
        expect(placeShape(shape, "E").frets[0]).toBe(12)
    })
})

describe("getVoicings", () => {
    it("lists open voicings before barre shapes", () => {
        const shapes = getVoicings("A", "m").map(voicing => voicing.shape)
        expect(shapes).toEqual(["open", "E", "A", "D", "C", "G"])
    })

    it("moves a movable shape that lands on an open voicing an octave up", () => {
        const frets = getVoicings("D", "M").map(voicing => voicing.frets.join())
        expect(new Set(frets).size).toBe(frets.length)
        expect(getVoicings("E", "5").map(voicing => voicing.frets)).toContainEqual([12, 14, 14, null, null, null])
    })

    it("matches open voicings by pitch class, not spelling", () => {
        expect(getVoicings("Cb", "7").some(voicing => voicing.shape === "open")).toBe(true)
    })
})

describe("isMovableVoicing", () => {
    it("treats shapes without open strings as movable", () => {
        const barre = getVoicings("F", "M").find(voicing => voicing.shape === "E")!
        expect(isMovableVoicing(barre)).toBe(true)
    })

    it("treats shapes that ring an open string as fixed", () => {
        const [openC] = getVoicings("C", "M")
        expect(isMovableVoicing(openC!)).toBe(false)
    })
})

describe("voicingFretRange", () => {
    it("starts at the nut for first-position chords", () => {
        const [openC] = getVoicings("C", "M")
        expect(voicingFretRange(openC!)).toEqual({baseFret: 1, span: 4})
    })

    it("starts at the lowest fretted note for barre chords", () => {
        const barre = getVoicings("B", "m").find(voicing => voicing.shape === "A")!
        expect(voicingFretRange(barre)).toEqual({baseFret: 2, span: 4})
    })
})
