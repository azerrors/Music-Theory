import {Note} from "tonal"
import {STANDARD_TUNING} from "@/constants/tunings"
import {chroma, mod12} from "@/lib/theory/notes"
import type {ScaleInfo} from "@/lib/theory/scales"
import type {NoteName, StringIndex, Tuning} from "@/types/music"

export type PositionSystem = "pentatonic" | "threePerString"

export interface PositionNote {
    string: StringIndex
    fret: number
    note: NoteName
    degree: string
    midi: number
}

/** Frets a hand covers comfortably; a three-per-string position wider than this needs a stretch. */
export const COMFORTABLE_SPAN = 5

export interface ScalePosition {
    /** 1-based, numbered from the root: position 1 starts on the root on the low string. */
    number: number
    system: PositionSystem
    notes: PositionNote[]
    minFret: number
    maxFret: number
}

/** The seven three-notes-per-string shapes, named after the major-scale mode each one starts on, in order up the neck. */
export const MODE_SHAPES = ["ionian", "dorian", "phrygian", "lydian", "mixolydian", "aeolian", "locrian"] as const
export type ModeShape = (typeof MODE_SHAPES)[number]

/** How far each major-scale mode sits from its parent major; other scales have no shape names. */
const MODE_STEP: Record<string, number> = {major: 0, ionian: 0, dorian: 1, phrygian: 2, lydian: 3, mixolydian: 4, minor: 5, aeolian: 5, locrian: 6}

/**
 * The shape a position of the major scale or one of its modes is named after: the mode that
 * starts on the position's first note. A minor position 1 starts on A, the 6th note of C major,
 * so it is the Aeolian shape; position 3 starts on C, so it is the Ionian shape.
 */
export function positionShape(scaleId: string, positionNumber: number): ModeShape | null {
    const step = MODE_STEP[scaleId]
    if (step === undefined) return null
    return MODE_SHAPES[(step + positionNumber - 1) % MODE_SHAPES.length]!
}

/** The blues scale's extra note; its boxes are the minor pentatonic ones with this added in. */
const BLUE_NOTE = "♭5"

function openMidis(tuning: Tuning): number[] {
    return tuning.strings.map(note => Note.midi(note) ?? 0)
}

/**
 * Splits a scale into playable positions: pentatonic boxes (2 notes per string) for five-note
 * scales and the blues, three-notes-per-string shapes for seven-note scales. Position N starts
 * on the scale's Nth note on the lowest string and climbs in pitch, so the G→B string step
 * shifts the shape by itself. Other scale sizes have no standard system and return [].
 */
export function scalePositions(scale: ScaleInfo, tuning: Tuning = STANDARD_TUNING): ScalePosition[] {
    // Locrian has a ♭5 too; only the six-note blues scale treats it as an extra "blue" note.
    const isBlues = scale.notes.length === 6 && scale.degrees.includes(BLUE_NOTE)
    const core = scale.notes
        .map((note, index) => ({note, degree: scale.degrees[index]!}))
        .filter(item => !(isBlues && item.degree === BLUE_NOTE))

    const system: PositionSystem | null = core.length === 5 ? "pentatonic" : core.length === 7 ? "threePerString" : null
    if (!system) return []
    const perString = system === "pentatonic" ? 2 : 3

    const opens = openMidis(tuning)
    const lowest = opens[0]!
    const coreChromas = core.map(item => chroma(item.note))
    /** The next core scale note strictly above `midi`. */
    const nextAbove = (midi: number) => {
        let candidate = midi + 1
        while (!coreChromas.includes(mod12(candidate))) candidate++
        return candidate
    }
    const spell = (midi: number) => {
        const index = coreChromas.indexOf(mod12(midi))
        return core[index]!
    }

    return core.map((start, startIndex) => {
        let midi = lowest + mod12(chroma(start.note) - mod12(lowest))
        const notes: PositionNote[] = []

        opens.forEach((open, string) => {
            for (let count = 0; count < perString; count++) {
                if (string > 0 || count > 0) midi = nextAbove(midi)
                const {note, degree} = spell(midi)
                notes.push({string, fret: midi - open, note, degree, midi})
            }
        })

        // A box that would need frets behind the nut moves up an octave.
        if (notes.some(item => item.fret < 0)) notes.forEach(item => { item.fret += 12; item.midi += 12 })

        const frets = notes.map(item => item.fret)
        const minFret = Math.min(...frets)
        const maxFret = Math.max(...frets)

        if (isBlues) {
            const blue = scale.notes[scale.degrees.indexOf(BLUE_NOTE)]!
            opens.forEach((open, string) => {
                for (let fret = minFret; fret <= maxFret; fret++) {
                    if (mod12(open + fret) === chroma(blue)) notes.push({string, fret, note: blue, degree: BLUE_NOTE, midi: open + fret})
                }
            })
            notes.sort((a, b) => a.midi - b.midi)
        }

        return {number: startIndex + 1, system, notes, minFret, maxFret}
    })
}
