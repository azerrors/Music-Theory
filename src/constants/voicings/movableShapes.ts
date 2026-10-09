import type {Fret, StringIndex, VoicingShape} from "@/types/music"

export interface ShapeTemplate {
    /** Tonal chord-type alias. */
    type: string
    shape: Exclude<VoicingShape, "open">
    /** String that carries the root: 0 = low E (E-shape), 1 = A string (A-, C-shape), 2 = D string (D-shape). */
    rootString: StringIndex
    /** Fret offsets relative to the root fret, low → high; `null` = muted. */
    offsets: Fret[]
    fingers: (number | null)[]
    /** Index-finger barre, as an offset from the root fret. */
    barre?: {offset: number; fromString: StringIndex; toString: StringIndex}
}

const x = null

/**
 * CAGED E-, A-, D-, C- and G-shapes. `getVoicings` slides these up the neck to the
 * requested root, so one template covers all twelve keys.
 */
export const MOVABLE_SHAPES: ShapeTemplate[] = [
    // E-shape — root on the 6th string
    {type: "M", shape: "E", rootString: 0, offsets: [0, 2, 2, 1, 0, 0], fingers: [1, 3, 4, 2, 1, 1], barre: {offset: 0, fromString: 0, toString: 5}},
    {type: "m", shape: "E", rootString: 0, offsets: [0, 2, 2, 0, 0, 0], fingers: [1, 3, 4, 1, 1, 1], barre: {offset: 0, fromString: 0, toString: 5}},
    {type: "dim", shape: "E", rootString: 0, offsets: [0, 1, 2, 0, x, x], fingers: [1, 2, 3, 1, x, x]},
    {type: "aug", shape: "E", rootString: 0, offsets: [0, x, 2, 1, 1, x], fingers: [1, x, 4, 2, 3, x]},
    {type: "sus4", shape: "E", rootString: 0, offsets: [0, 2, 2, 2, 0, 0], fingers: [1, 2, 3, 4, 1, 1], barre: {offset: 0, fromString: 0, toString: 5}},
    {type: "7sus4", shape: "E", rootString: 0, offsets: [0, 2, 0, 2, 0, 0], fingers: [1, 3, 1, 4, 1, 1], barre: {offset: 0, fromString: 0, toString: 5}},
    {type: "9sus4", shape: "E", rootString: 0, offsets: [0, x, 0, -1, -2, x], fingers: [3, x, 4, 2, 1, x]},
    {type: "6", shape: "E", rootString: 0, offsets: [0, x, -1, 1, 0, x], fingers: [2, x, 1, 4, 3, x]},
    {type: "m6", shape: "E", rootString: 0, offsets: [0, x, -1, 0, 0, x], fingers: [2, x, 1, 3, 4, x]},
    {type: "madd9", shape: "E", rootString: 0, offsets: [0, 2, x, 0, 0, 2], fingers: [1, 3, x, 1, 1, 4]},
    {type: "69", shape: "E", rootString: 0, offsets: [0, x, -1, -1, 0, 0], fingers: [2, x, 1, 1, 3, 4]},
    {type: "7", shape: "E", rootString: 0, offsets: [0, 2, 0, 1, 0, 0], fingers: [1, 3, 1, 2, 1, 1], barre: {offset: 0, fromString: 0, toString: 5}},
    {type: "m7", shape: "E", rootString: 0, offsets: [0, 2, 0, 0, 0, 0], fingers: [1, 3, 1, 1, 1, 1], barre: {offset: 0, fromString: 0, toString: 5}},
    {type: "maj7", shape: "E", rootString: 0, offsets: [0, x, 1, 1, 0, x], fingers: [1, x, 3, 4, 2, x]},
    {type: "m7b5", shape: "E", rootString: 0, offsets: [0, x, 0, 0, -1, x], fingers: [2, x, 3, 4, 1, x]},
    {type: "dim7", shape: "E", rootString: 0, offsets: [0, x, -1, 0, -1, x], fingers: [2, x, 1, 3, 1, x]},
    {type: "mMaj7", shape: "E", rootString: 0, offsets: [0, x, 1, 0, 0, x], fingers: [2, x, 4, 1, 1, x]},
    {type: "7#5", shape: "E", rootString: 0, offsets: [0, x, 0, 1, 1, x], fingers: [1, x, 2, 3, 4, x]},
    {type: "7b5", shape: "E", rootString: 0, offsets: [0, x, 0, 1, -1, x], fingers: [2, x, 3, 4, 1, x]},
    {type: "9", shape: "E", rootString: 0, offsets: [0, x, 0, 1, 0, 2], fingers: [1, x, 1, 2, 1, 3]},
    {type: "maj9", shape: "E", rootString: 0, offsets: [0, x, 1, -1, 0, x], fingers: [2, x, 3, 1, 4, x]},
    {type: "m9", shape: "E", rootString: 0, offsets: [0, x, 0, 0, 0, 2], fingers: [1, x, 1, 1, 1, 3]},
    {type: "7b9", shape: "E", rootString: 0, offsets: [0, x, 0, 1, 0, 1], fingers: [1, x, 1, 2, 1, 3]},
    {type: "7#9", shape: "E", rootString: 0, offsets: [0, x, 0, 1, 0, 3], fingers: [1, x, 1, 2, 1, 4]},
    {type: "11", shape: "E", rootString: 0, offsets: [0, x, 0, -1, -2, -2], fingers: [3, x, 4, 2, 1, 1], barre: {offset: -2, fromString: 4, toString: 5}},
    {type: "m11", shape: "E", rootString: 0, offsets: [0, x, 0, 0, -2, -2], fingers: [2, x, 3, 4, 1, 1], barre: {offset: -2, fromString: 4, toString: 5}},
    {type: "maj7#11", shape: "E", rootString: 0, offsets: [0, x, 1, 1, -1, x], fingers: [2, x, 3, 4, 1, x]},
    {type: "13", shape: "E", rootString: 0, offsets: [0, x, 0, 1, 2, x], fingers: [1, x, 2, 3, 4, x]},
    {type: "maj13", shape: "E", rootString: 0, offsets: [0, x, 1, 1, 2, x], fingers: [1, x, 2, 3, 4, x]},
    {type: "m13", shape: "E", rootString: 0, offsets: [0, x, 0, 0, 2, x], fingers: [1, x, 2, 3, 4, x]},
    {type: "5", shape: "E", rootString: 0, offsets: [0, 2, 2, x, x, x], fingers: [1, 3, 4, x, x, x]},

    // A-shape — root on the 5th string
    {type: "M", shape: "A", rootString: 1, offsets: [x, 0, 2, 2, 2, 0], fingers: [x, 1, 3, 3, 3, 1], barre: {offset: 0, fromString: 1, toString: 5}},
    {type: "m", shape: "A", rootString: 1, offsets: [x, 0, 2, 2, 1, 0], fingers: [x, 1, 3, 4, 2, 1], barre: {offset: 0, fromString: 1, toString: 5}},
    {type: "dim", shape: "A", rootString: 1, offsets: [x, 0, 1, 2, 1, x], fingers: [x, 1, 2, 4, 3, x]},
    {type: "aug", shape: "A", rootString: 1, offsets: [x, 0, -1, -2, -2, x], fingers: [x, 4, 3, 1, 1, x]},
    {type: "sus2", shape: "A", rootString: 1, offsets: [x, 0, 2, 2, 0, 0], fingers: [x, 1, 3, 4, 1, 1], barre: {offset: 0, fromString: 1, toString: 5}},
    {type: "sus4", shape: "A", rootString: 1, offsets: [x, 0, 2, 2, 3, 0], fingers: [x, 1, 2, 3, 4, 1], barre: {offset: 0, fromString: 1, toString: 5}},
    {type: "7sus4", shape: "A", rootString: 1, offsets: [x, 0, 2, 0, 3, 0], fingers: [x, 1, 3, 1, 4, 1], barre: {offset: 0, fromString: 1, toString: 5}},
    {type: "9sus4", shape: "A", rootString: 1, offsets: [x, 0, 0, 0, 0, 0], fingers: [x, 1, 1, 1, 1, 1], barre: {offset: 0, fromString: 1, toString: 5}},
    {type: "6", shape: "A", rootString: 1, offsets: [x, 0, 2, 2, 2, 2], fingers: [x, 1, 3, 3, 3, 3]},
    {type: "m6", shape: "A", rootString: 1, offsets: [x, 0, -2, -1, -2, 0], fingers: [x, 3, 1, 2, 1, 4]},
    {type: "add9", shape: "A", rootString: 1, offsets: [x, 0, 2, 4, 2, 0], fingers: [x, 1, 3, 4, 2, 1], barre: {offset: 0, fromString: 1, toString: 5}},
    {type: "madd9", shape: "A", rootString: 1, offsets: [x, 0, 2, 4, 1, x], fingers: [x, 1, 3, 4, 2, x]},
    {type: "69", shape: "A", rootString: 1, offsets: [x, 0, -1, -1, 0, 0], fingers: [x, 2, 1, 1, 3, 4]},
    {type: "7", shape: "A", rootString: 1, offsets: [x, 0, 2, 0, 2, 0], fingers: [x, 1, 3, 1, 4, 1], barre: {offset: 0, fromString: 1, toString: 5}},
    {type: "maj7", shape: "A", rootString: 1, offsets: [x, 0, 2, 1, 2, 0], fingers: [x, 1, 3, 2, 4, 1], barre: {offset: 0, fromString: 1, toString: 5}},
    {type: "m7", shape: "A", rootString: 1, offsets: [x, 0, 2, 0, 1, 0], fingers: [x, 1, 3, 1, 2, 1], barre: {offset: 0, fromString: 1, toString: 5}},
    {type: "m7b5", shape: "A", rootString: 1, offsets: [x, 0, 1, 0, 1, x], fingers: [x, 1, 3, 2, 4, x]},
    {type: "dim7", shape: "A", rootString: 1, offsets: [x, 0, 1, -1, 1, x], fingers: [x, 2, 3, 1, 4, x]},
    {type: "mMaj7", shape: "A", rootString: 1, offsets: [x, 0, 2, 1, 1, 0], fingers: [x, 1, 4, 2, 3, 1], barre: {offset: 0, fromString: 1, toString: 5}},
    {type: "7#5", shape: "A", rootString: 1, offsets: [x, 0, x, 0, 2, 1], fingers: [x, 1, x, 2, 4, 3]},
    {type: "7b5", shape: "A", rootString: 1, offsets: [x, 0, 1, 0, 2, x], fingers: [x, 1, 2, 1, 3, x]},
    {type: "9", shape: "A", rootString: 1, offsets: [x, 0, -1, 0, 0, 0], fingers: [x, 2, 1, 3, 3, 3]},
    {type: "maj9", shape: "A", rootString: 1, offsets: [x, 0, -1, 1, 0, x], fingers: [x, 2, 1, 4, 3, x]},
    {type: "m9", shape: "A", rootString: 1, offsets: [x, 0, -2, 0, 0, x], fingers: [x, 2, 1, 3, 4, x]},
    {type: "7b9", shape: "A", rootString: 1, offsets: [x, 0, -1, 0, -1, x], fingers: [x, 2, 1, 3, 1, x]},
    {type: "7#9", shape: "A", rootString: 1, offsets: [x, 0, -1, 0, 1, x], fingers: [x, 2, 1, 3, 4, x]},
    {type: "11", shape: "A", rootString: 1, offsets: [x, 0, 0, 0, 0, 0], fingers: [x, 1, 1, 1, 1, 1], barre: {offset: 0, fromString: 1, toString: 5}},
    {type: "m11", shape: "A", rootString: 1, offsets: [x, 0, -2, 0, 0, -2], fingers: [x, 2, 1, 3, 4, 1], barre: {offset: -2, fromString: 2, toString: 5}},
    {type: "maj7#11", shape: "A", rootString: 1, offsets: [x, 0, x, 1, 2, -1], fingers: [x, 2, x, 3, 4, 1]},
    {type: "13", shape: "A", rootString: 1, offsets: [x, 0, -1, 0, 2, 2], fingers: [x, 2, 1, 3, 4, 4]},
    {type: "maj13", shape: "A", rootString: 1, offsets: [x, 0, -1, 1, 2, 2], fingers: [x, 2, 1, 3, 4, 4]},
    {type: "m13", shape: "A", rootString: 1, offsets: [x, 0, x, 0, 1, 2], fingers: [x, 1, x, 2, 3, 4]},
    {type: "5", shape: "A", rootString: 1, offsets: [x, 0, 2, 2, x, x], fingers: [x, 1, 3, 4, x, x]},

    // D-shape — root on the 4th string
    {type: "M", shape: "D", rootString: 2, offsets: [x, x, 0, 2, 3, 2], fingers: [x, x, 1, 2, 4, 3]},
    {type: "m", shape: "D", rootString: 2, offsets: [x, x, 0, 2, 3, 1], fingers: [x, x, 1, 3, 4, 2]},
    {type: "aug", shape: "D", rootString: 2, offsets: [x, x, 0, 3, 3, 2], fingers: [x, x, 1, 3, 4, 2]},
    {type: "sus2", shape: "D", rootString: 2, offsets: [x, x, 0, 2, 3, 0], fingers: [x, x, 1, 3, 4, 1], barre: {offset: 0, fromString: 2, toString: 5}},
    {type: "sus4", shape: "D", rootString: 2, offsets: [x, x, 0, 2, 3, 3], fingers: [x, x, 1, 2, 3, 4]},
    {type: "7sus4", shape: "D", rootString: 2, offsets: [x, x, 0, 2, 1, 3], fingers: [x, x, 1, 3, 2, 4]},
    {type: "m6", shape: "D", rootString: 2, offsets: [x, x, 0, 2, 0, 1], fingers: [x, x, 1, 3, 1, 2], barre: {offset: 0, fromString: 2, toString: 4}},
    {type: "7", shape: "D", rootString: 2, offsets: [x, x, 0, 2, 1, 2], fingers: [x, x, 1, 3, 2, 4]},
    {type: "maj7", shape: "D", rootString: 2, offsets: [x, x, 0, 2, 2, 2], fingers: [x, x, 1, 2, 3, 4]},
    {type: "m7", shape: "D", rootString: 2, offsets: [x, x, 0, 2, 1, 1], fingers: [x, x, 1, 4, 2, 3]},
    {type: "m7b5", shape: "D", rootString: 2, offsets: [x, x, 0, 1, 1, 1], fingers: [x, x, 1, 2, 3, 4]},
    {type: "dim7", shape: "D", rootString: 2, offsets: [x, x, 0, 1, 0, 1], fingers: [x, x, 1, 3, 1, 4], barre: {offset: 0, fromString: 2, toString: 4}},
    {type: "9", shape: "D", rootString: 2, offsets: [x, x, 0, 2, 1, 0], fingers: [x, x, 1, 3, 2, 1], barre: {offset: 0, fromString: 2, toString: 5}},
    {type: "5", shape: "D", rootString: 2, offsets: [x, x, 0, 2, 3, x], fingers: [x, x, 1, 3, 4, x]},

    // C-shape — root on the 5th string under the ring/pinky finger
    {type: "M", shape: "C", rootString: 1, offsets: [x, 0, -1, -3, -2, -3], fingers: [x, 4, 3, 1, 2, 1], barre: {offset: -3, fromString: 3, toString: 5}},
    {type: "m", shape: "C", rootString: 1, offsets: [x, 0, -2, -3, -2, x], fingers: [x, 4, 2, 1, 3, x]},
    {type: "sus2", shape: "C", rootString: 1, offsets: [x, 0, -3, -3, -2, x], fingers: [x, 3, 1, 1, 2, x], barre: {offset: -3, fromString: 2, toString: 3}},
    {type: "6", shape: "C", rootString: 1, offsets: [x, 0, -1, -1, -2, -3], fingers: [x, 4, 3, 3, 2, 1]},
    {type: "add9", shape: "C", rootString: 1, offsets: [x, 0, -1, -3, 0, -3], fingers: [x, 3, 2, 1, 4, 1], barre: {offset: -3, fromString: 3, toString: 5}},
    {type: "maj7", shape: "C", rootString: 1, offsets: [x, 0, -1, -3, -3, -3], fingers: [x, 3, 2, 1, 1, 1], barre: {offset: -3, fromString: 3, toString: 5}},

    // G-shape — root on the 6th (and 1st) string under the ring/pinky finger; the index bars three middle strings
    {type: "M", shape: "G", rootString: 0, offsets: [0, -1, -3, -3, -3, 0], fingers: [3, 2, 1, 1, 1, 4], barre: {offset: -3, fromString: 2, toString: 4}},
    {type: "m", shape: "G", rootString: 0, offsets: [0, -2, -3, -3, x, x], fingers: [4, 2, 1, 1, x, x], barre: {offset: -3, fromString: 2, toString: 3}},
    {type: "6", shape: "G", rootString: 0, offsets: [0, -1, -3, -3, -3, -3], fingers: [3, 2, 1, 1, 1, 1], barre: {offset: -3, fromString: 2, toString: 5}},
    {type: "7", shape: "G", rootString: 0, offsets: [0, -1, -3, -3, -3, -2], fingers: [4, 3, 1, 1, 1, 2], barre: {offset: -3, fromString: 2, toString: 4}},
    {type: "maj7", shape: "G", rootString: 0, offsets: [0, -1, -3, -3, -3, -1], fingers: [4, 2, 1, 1, 1, 3], barre: {offset: -3, fromString: 2, toString: 4}},
]
