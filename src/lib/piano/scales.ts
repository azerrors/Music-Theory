import {Interval} from "tonal"
import {scaleFingering, type ScaleFingering} from "@/constants/pianoFingerings"
import {rootMidi} from "@/lib/piano/voicings"
import {chroma} from "@/lib/theory/notes"
import type {ScaleInfo} from "@/lib/theory/scales"

export type Hand = "right" | "left"

export const HANDS: Hand[] = ["right", "left"]

/**
 * One ascending octave, root to root. The right hand plays around middle C, the left an octave
 * lower — where each hand practises scales.
 */
export function handScaleMidi(scale: ScaleInfo, hand: Hand): number[] {
    const start = rootMidi(scale.root) - (hand === "left" ? 12 : 0)
    const steps = scale.intervals.map(interval => start + (Interval.semitones(interval) ?? 0))
    return [...steps, start + 12]
}

/** Up and back down, the way scales are practised. */
export function upAndDown(midi: number[]): number[] {
    return [...midi, ...midi.slice(0, -1).reverse()]
}

export function fingeringFor(scale: ScaleInfo): ScaleFingering | null {
    const fingering = scaleFingering(scale.def.id, chroma(scale.root))
    // Fingerings are written for 7-note scales; anything else has no standard one.
    return fingering && fingering.right.length === scale.notes.length + 1 ? fingering : null
}

/**
 * Where the hand shifts going up: the right thumb passes under (…3 → 1), the left hand's
 * 3rd or 4th finger crosses over the thumb (1 → 3/4). Index of the note after the shift.
 */
export function crossings(fingers: number[], hand: Hand): number[] {
    return fingers.flatMap((finger, index) => {
        if (index === 0) return []
        const previous = fingers[index - 1]!
        const crosses = hand === "right" ? finger === 1 && previous !== 1 : previous === 1 && finger > 1
        return crosses ? [index] : []
    })
}
