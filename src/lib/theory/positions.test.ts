import {ROOT_NOTES} from "@/constants/notes"
import {SCALES} from "@/constants/scales"
import {STANDARD_TUNING} from "@/constants/tunings"
import {chroma} from "@/lib/theory/notes"
import {scalePositions} from "@/lib/theory/positions"
import {getScaleInfo} from "@/lib/theory/scales"

function fretsByString(scaleId: string, root: string, position: number): number[][] {
    const scale = getScaleInfo(root, scaleId)!
    const notes = scalePositions(scale)[position - 1]!.notes
    return STANDARD_TUNING.strings.map((_, string) => notes.filter(note => note.string === string).map(note => note.fret))
}

describe("scalePositions", () => {
    it("draws A minor pentatonic box 1 at the 5th fret", () => {
        expect(fretsByString("minorPentatonic", "A", 1)).toEqual([[5, 8], [5, 7], [5, 7], [5, 7], [5, 8], [5, 8]])
    })

    it("shifts box 2 across the G and B strings", () => {
        expect(fretsByString("minorPentatonic", "A", 2)).toEqual([[8, 10], [7, 10], [7, 10], [7, 9], [8, 10], [8, 10]])
    })

    it("plays C major three notes per string from the 8th fret", () => {
        expect(fretsByString("major", "C", 1)).toEqual([[8, 10, 12], [8, 10, 12], [9, 10, 12], [9, 10, 12], [10, 12, 13], [10, 12, 13]])
    })

    it("adds the blue note inside the box", () => {
        const blues = fretsByString("blues", "A", 1)
        expect(blues[1]).toEqual([5, 6, 7]) // D, E♭, E on the A string
    })

    const sizes = SCALES.map(def => def.id)
    it.each(sizes)("%s positions are playable and cover the scale in every key", scaleId => {
        for (const root of ROOT_NOTES) {
            const scale = getScaleInfo(root, scaleId)!
            const positions = scalePositions(scale)
            expect(positions.length, `${root} ${scaleId}`).toBe(scale.notes.length === 6 ? 5 : scale.notes.length)

            for (const position of positions) {
                const label = `${root} ${scaleId} #${position.number}`
                expect(position.minFret, label).toBeGreaterThanOrEqual(0)
                // Pentatonic boxes fit in 5 frets; one 3nps position of every 7-note scale needs a 7-fret stretch.
                expect(position.maxFret - position.minFret, label).toBeLessThanOrEqual(position.system === "pentatonic" ? 4 : 6)
                // Only scale notes, and every scale note appears.
                const chromas = new Set(position.notes.map(note => chroma(note.note)))
                expect(chromas, label).toEqual(new Set(scale.notes.map(chroma)))
                // Each position starts on its own degree on the lowest string.
                expect(position.notes[0]!.string, label).toBe(0)
            }
            expect(new Set(positions.map(position => position.notes[0]!.degree)).size).toBe(positions.length)
        }
    })
})
