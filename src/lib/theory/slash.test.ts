import {Chord, Note} from "tonal"
import {ROOT_NOTES} from "@/constants/notes"
import {OPEN_SLASH_VOICINGS, SLASH_SHAPES} from "@/constants/voicings/slashVoicings"
import {getChordInfo} from "@/lib/theory/chords"
import {chroma} from "@/lib/theory/notes"
import {inversionBasses, inversionOf, SLASH_CHORD_TYPES, slashVoicings, withBass} from "@/lib/theory/slash"
import {getVoicings, placeShape, voicingMidi, voicingPitches} from "@/lib/theory/voicings"
import type {NoteName, Voicing} from "@/types/music"

function expectSlashVoicing(voicing: Voicing, root: NoteName, type: string, bass: NoteName) {
    const allowed = [...Chord.getChord(type, root).notes, bass].map(chroma)
    const pitches = voicingPitches(voicing).flatMap(pitch => (pitch ? [pitch] : []))
    const midi = voicingMidi(voicing)
    const label = `${root}${type}/${bass} ${voicing.frets.map(fret => fret ?? "x").join("-")}`

    expect(pitches.length, label).toBeGreaterThanOrEqual(3)
    for (const pitch of pitches) expect(allowed, `${label} plays a foreign note`).toContain(chroma(pitch))
    expect(pitches.map(chroma), `${label} is missing the root`).toContain(chroma(root))
    // The bass is the lowest pitch that sounds.
    const lowest = midi.indexOf(Math.min(...midi))
    expect(chroma(pitches[lowest]!), `${label} has the wrong bass`).toBe(chroma(bass))
}

describe("open slash voicings", () => {
    it.each(OPEN_SLASH_VOICINGS)("$root$type/$bass is spelled correctly", def => {
        expectSlashVoicing({id: "", shape: "open", frets: def.frets, fingers: def.fingers, barre: def.barre}, def.root, def.type, def.bass)
        expect(def.frets).toHaveLength(6)
        expect(def.fingers).toHaveLength(6)
    })
})

describe("movable slash shapes", () => {
    it.each(SLASH_SHAPES)("$type over $bassInterval ($shape) is correct in every key", template => {
        for (const root of ROOT_NOTES) {
            const bass = Note.transpose(root, template.bassInterval)
            const voicing = placeShape(template, bass)
            expectSlashVoicing(voicing, root, template.type, bass)
            expect(Math.min(...voicing.frets.filter(fret => fret !== null))).toBeGreaterThanOrEqual(0)
        }
    })
})

describe("slashVoicings", () => {
    it("has a shape for every inversion of the catalogue types in every key", () => {
        for (const root of ROOT_NOTES) {
            for (const type of SLASH_CHORD_TYPES) {
                for (const bass of Chord.getChord(type, root).notes.slice(1)) {
                    const voicings = slashVoicings(root, type, bass)
                    expect(voicings.length, `${root}${type}/${bass}`).toBeGreaterThan(0)
                    for (const voicing of voicings) expectSlashVoicing(voicing, root, type, bass)
                }
            }
        }
    })

    it("lists the curated open shape first", () => {
        expect(slashVoicings("D", "M", "F#")[0]!.frets).toEqual([2, null, 0, 2, 3, 2])
    })

    it("handles a bass outside the chord, e.g. Am/F#", () => {
        for (const root of ROOT_NOTES) {
            const bass = Note.transpose(root, "6M")
            const voicings = slashVoicings(root, "m", bass)
            expect(voicings.length, `${root}m/${bass}`).toBeGreaterThan(0)
            for (const voicing of voicings) expectSlashVoicing(voicing, root, "m", bass)
        }
    })
})

describe("withBass", () => {
    it("adds the bass on a lower string and keeps the shape", () => {
        const [openDm] = getVoicings("D", "m")
        expect(withBass(openDm!, "D", "B")?.frets).toEqual([null, 2, 0, 2, 3, 1])
    })

    it("refuses a bass that would need too wide a stretch", () => {
        const openE = getVoicings("E", "M")[0]!
        expect(withBass(openE, "E", "Bb")).toBeNull()
    })
})

describe("inversions", () => {
    it.each([
        ["C", "M", "E", 1],
        ["C", "M", "G", 2],
        ["G", "7", "F", 3],
        ["A", "m", "F#", 0],
    ])("%s%s/%s → %i", (root, type, bass, inversion) => {
        expect(inversionOf(root, type, bass)).toBe(inversion)
    })

    it("offers the third and fifth as basses of a triad", () => {
        expect(inversionBasses("C", "M")).toEqual(["E", "G"])
    })

    it("names slash chords and their bass degree", () => {
        const chord = getChordInfo("A", "m7", "G")!
        expect(chord.name).toBe("Am7/G")
        expect(chord.bassDegree).toBe("♭7")
    })

    it("ignores a bass equal to the root", () => {
        expect(getChordInfo("C", "M", "C")!.bass).toBeUndefined()
    })
})
