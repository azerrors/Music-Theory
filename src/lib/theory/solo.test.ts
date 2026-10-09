import {STANDARD_TUNING} from "@/constants/tunings"
import {getChordInfo} from "@/lib/theory/chords"
import {chroma} from "@/lib/theory/notes"
import {getScaleInfo} from "@/lib/theory/scales"
import {soloPositions, soloScaleId} from "@/lib/theory/solo"

function positionsFor(scaleId: string, tonic: string, root: string, type: string) {
    const scale = getScaleInfo(tonic, scaleId)!
    const chord = getChordInfo(root, type)!
    return soloPositions(STANDARD_TUNING, 12, scale.notes, chord.notes, chord.degrees)
}

describe("soloScaleId", () => {
    it("starts with the key's pentatonic", () => {
        expect(soloScaleId("minor", "pentatonic")).toBe("minorPentatonic")
        expect(soloScaleId("major", "full")).toBe("major")
    })
})

describe("soloPositions", () => {
    it("marks the chord's notes over the scale", () => {
        const positions = positionsFor("minorPentatonic", "A", "A", "m")
        const at = (string: number, fret: number) => positions.find(position => position.string === string && position.fret === fret)
        expect(at(0, 5)).toMatchObject({role: "chordRoot", degree: "1"}) // A on the low E string
        expect(at(0, 8)).toMatchObject({role: "chordTone", degree: "♭3"}) // C
        expect(at(0, 10)).toMatchObject({role: "scale"}) // D, in the scale but not in Am
    })

    it("flags a chord tone the scale doesn't have", () => {
        const positions = positionsFor("minor", "A", "E", "7")
        const gSharp = positions.filter(position => chroma(position.note) === chroma("G#"))
        expect(gSharp.length).toBeGreaterThan(0)
        expect(gSharp.every(position => position.role === "outside")).toBe(true)
    })

    it("leaves out notes in neither the scale nor the chord", () => {
        const positions = positionsFor("minorPentatonic", "A", "A", "m")
        expect(positions.some(position => chroma(position.note) === chroma("F"))).toBe(false)
    })
})
