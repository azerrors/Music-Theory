import {STANDARD_TUNING} from "@/constants/tunings"
import {MOVABLE_SHAPES, type ShapeTemplate} from "@/constants/voicings/movableShapes"
import {OPEN_VOICINGS} from "@/constants/voicings/openVoicings"
import {chroma, isSamePitchClass, midiAt, mod12, pitchAt} from "@/lib/theory/notes"
import type {Fret, NoteName, PitchName, Tuning, Voicing} from "@/types/music"

function frettedValues(frets: Fret[]): number[] {
    return frets.filter((fret): fret is number => fret !== null)
}

/** Slides an E- or A-shape so its root string lands on `root`. */
export function placeShape(template: ShapeTemplate, root: NoteName, tuning: Tuning = STANDARD_TUNING): Voicing {
    const openString = tuning.strings[template.rootString] ?? "E2"
    let rootFret = mod12(chroma(root) - chroma(openString))

    // A note behind the nut is unplayable, and a barre on the nut is just the open chord — move up an octave.
    // Other shapes may keep an open string (e.g. Bbdim7 as x-1-2-0-2-x).
    const lowestOffset = Math.min(...frettedValues(template.offsets))
    const lowestFret = rootFret + lowestOffset
    const barreFret = template.barre ? rootFret + template.barre.offset : Infinity
    if (lowestFret < 0 || barreFret < 1) rootFret += 12

    return {
        id: `${template.shape}-${template.type}-${rootFret}`,
        shape: template.shape,
        frets: template.offsets.map(offset => (offset === null ? null : rootFret + offset)),
        fingers: template.fingers,
        barre: template.barre && {
            fret: rootFret + template.barre.offset,
            fromString: template.barre.fromString,
            toString: template.barre.toString,
        },
    }
}

/**
 * All known shapes for a chord: open-position voicings first, then the movable
 * E-, A-, D-, C- and G-shapes. Shapes are defined for standard tuning only.
 */
export function getVoicings(root: NoteName, type: string): Voicing[] {
    const open: Voicing[] = OPEN_VOICINGS
        .filter(voicing => voicing.type === type && isSamePitchClass(voicing.root, root))
        .map((voicing, index) => ({
            id: `open-${type}-${index}`,
            shape: "open",
            frets: voicing.frets,
            fingers: voicing.fingers,
            barre: voicing.barre,
        }))

    // A shape placed at the nut can land exactly on an open voicing (D-shape on D) — list it once.
    const seen = new Set(open.map(voicing => voicing.frets.join()))
    const movable = MOVABLE_SHAPES
        .filter(template => template.type === type)
        .map(template => placeShape(template, root))
        .filter(voicing => !seen.has(voicing.frets.join()))

    return [...open, ...movable]
}

/**
 * A voicing with no open strings keeps its fingering anywhere on the neck:
 * slide it one fret up and the chord moves up a semitone. Open strings pin it in place.
 */
export function isMovableVoicing(voicing: Voicing): boolean {
    return voicing.frets.some(fret => fret !== null) && !voicing.frets.includes(0)
}

export function voicingPitches(voicing: Voicing, tuning: Tuning = STANDARD_TUNING): (PitchName | null)[] {
    return voicing.frets.map((fret, string) =>
        fret === null ? null : pitchAt(tuning.strings[string] ?? "E2", fret),
    )
}

/** MIDI numbers of the sounding strings, low → high — what the audio player strums. */
export function voicingMidi(voicing: Voicing, tuning: Tuning = STANDARD_TUNING): number[] {
    return voicing.frets.flatMap((fret, string) =>
        fret === null ? [] : [midiAt(tuning.strings[string] ?? "E2", fret)],
    )
}

/** The fret window a chord diagram needs to show, starting at `baseFret`. */
export function voicingFretRange(voicing: Voicing, minSpan = 4): {baseFret: number; span: number} {
    const fretted = frettedValues(voicing.frets).filter(fret => fret > 0)
    if (fretted.length === 0) return {baseFret: 1, span: minSpan}

    const lowest = Math.min(...fretted)
    const highest = Math.max(...fretted)
    // Open strings or a first-fret note tie the shape to the nut; anything else is drawn from its lowest fret.
    const touchesNut = voicing.frets.includes(0) || lowest === 1
    const baseFret = highest <= minSpan && touchesNut ? 1 : lowest
    return {baseFret, span: Math.max(minSpan, highest - baseFret + 1)}
}
