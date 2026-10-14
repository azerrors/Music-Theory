import type {Hand} from "@/lib/piano/scales"

/** Widest stretch a hand plays as a block chord: an octave from thumb to little finger. */
const MAX_SPAN = 12

/**
 * Fingers for keys pressed together by one hand, listed low → high like the keys. 1 = thumb …
 * 5 = little finger. Null when the keys don't fit in one hand.
 *
 * The rules are the ones method books teach:
 * - triads: right 1-3-5, but 1-2-5 when the top gap is a fourth (first inversion);
 *   left 5-3-1, but 5-2-1 when the bottom gap is a fourth (second inversion)
 * - four notes: right 1-2-3-5, left 5-3-2-1
 * - two notes: the wider the interval, the further apart the fingers; a fourth or tritone takes 1 and 4,
 *   a fifth or more 1 and 5
 * - a lone bass note goes to the left little finger, a lone melody note to the right thumb
 */
export function chordFingering(midi: number[], hand: Hand): number[] | null {
    const keys = [...midi].sort((a, b) => a - b)
    if (keys.length === 0 || keys.length > 5) return null
    if (keys.length === 1) return [hand === "left" ? 5 : 1]
    if (keys[keys.length - 1]! - keys[0]! > MAX_SPAN) return null

    const right = hand === "right"
    const gaps = keys.slice(1).map((key, index) => key - keys[index]!)

    switch (keys.length) {
        case 2: {
            const size = gaps[0]!
            const far = size <= 2 ? 2 : size <= 4 ? 3 : size <= 6 ? 4 : 5
            return right ? [1, far] : [far, 1]
        }
        case 3:
            return right ? [1, gaps[1]! >= 5 ? 2 : 3, 5] : [5, gaps[0]! >= 5 ? 2 : 3, 1]
        case 4:
            return right ? [1, 2, 3, 5] : [5, 3, 2, 1]
        default:
            return right ? [1, 2, 3, 4, 5] : [5, 4, 3, 2, 1]
    }
}

/** Finger per key, for drawing; empty when the keys don't fit in one hand. */
export function fingerMap(midi: number[], hand: Hand): Map<number, number> {
    const keys = [...midi].sort((a, b) => a - b)
    const fingers = chordFingering(keys, hand)
    return new Map(fingers ? keys.map((key, index) => [key, fingers[index]!]) : [])
}

/** Whether every hand in a voicing can actually play its keys as one block. */
export function isPlayable(voicing: {left: number[]; right: number[]}): boolean {
    return (voicing.left.length === 0 || chordFingering(voicing.left, "left") !== null)
        && (voicing.right.length === 0 || chordFingering(voicing.right, "right") !== null)
}
