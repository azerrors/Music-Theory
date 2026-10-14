import type {Barre, Fret, NoteName} from "@/types/music"

export interface OpenVoicingDef {
    root: NoteName
    /** Tonal chord-type alias, see `CHORD_TYPES`. */
    type: string
    /** Low E → high e, standard tuning. */
    frets: Fret[]
    fingers: (number | null)[]
    barre?: Barre
}

const x = null

/**
 * First-position chords in standard tuning. Every entry is checked against
 * the chord's pitch classes in `voicings.test.ts`, so a typo here fails the tests.
 */
export const OPEN_VOICINGS: OpenVoicingDef[] = [
    // Major
    {root: "C", type: "M", frets: [x, 3, 2, 0, 1, 0], fingers: [x, 3, 2, x, 1, x]},
    {root: "A", type: "M", frets: [x, 0, 2, 2, 2, 0], fingers: [x, x, 1, 2, 3, x]},
    {root: "G", type: "M", frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, x, x, x, 3]},
    {root: "G", type: "M", frets: [3, 2, 0, 0, 3, 3], fingers: [2, 1, x, x, 3, 4]},
    {root: "E", type: "M", frets: [0, 2, 2, 1, 0, 0], fingers: [x, 2, 3, 1, x, x]},
    {root: "D", type: "M", frets: [x, x, 0, 2, 3, 2], fingers: [x, x, x, 1, 3, 2]},
    {root: "F", type: "M", frets: [x, x, 3, 2, 1, 1], fingers: [x, x, 3, 2, 1, 1], barre: {fret: 1, fromString: 4, toString: 5}},

    // Minor
    {root: "A", type: "m", frets: [x, 0, 2, 2, 1, 0], fingers: [x, x, 2, 3, 1, x]},
    {root: "E", type: "m", frets: [0, 2, 2, 0, 0, 0], fingers: [x, 2, 3, x, x, x]},
    {root: "D", type: "m", frets: [x, x, 0, 2, 3, 1], fingers: [x, x, x, 2, 3, 1]},

    // Diminished and augmented
    {root: "B", type: "dim", frets: [x, 2, 3, 4, 3, x], fingers: [x, 1, 2, 4, 3, x]},
    {root: "A", type: "dim", frets: [x, 0, 1, 2, 1, x], fingers: [x, x, 1, 3, 2, x]},
    {root: "D", type: "dim", frets: [x, x, 0, 1, 3, 1], fingers: [x, x, x, 1, 3, 2]},
    {root: "C", type: "aug", frets: [x, 3, 2, 1, 1, 0], fingers: [x, 4, 3, 2, 1, x]},
    {root: "E", type: "aug", frets: [0, 3, 2, 1, 1, 0], fingers: [x, 4, 3, 2, 1, x]},
    {root: "G", type: "aug", frets: [3, 2, 1, 0, 0, 3], fingers: [3, 2, 1, x, x, 4]},
    {root: "D", type: "aug", frets: [x, x, 0, 3, 3, 2], fingers: [x, x, x, 2, 3, 1]},
    {root: "A", type: "aug", frets: [x, 0, 3, 2, 2, x], fingers: [x, x, 4, 2, 3, x]},
    {root: "E", type: "dim", frets: [0, 1, 2, 0, x, x], fingers: [x, 1, 2, x, x, x]},

    // Suspended
    {root: "C", type: "sus2", frets: [x, 3, 0, 0, 1, x], fingers: [x, 3, x, x, 1, x]},
    {root: "A", type: "sus2", frets: [x, 0, 2, 2, 0, 0], fingers: [x, x, 1, 2, x, x]},
    {root: "D", type: "sus2", frets: [x, x, 0, 2, 3, 0], fingers: [x, x, x, 1, 3, x]},
    {root: "G", type: "sus2", frets: [3, 0, 0, 0, 3, 3], fingers: [2, x, x, x, 3, 4]},
    {root: "E", type: "sus2", frets: [0, 2, 4, 4, 0, 0], fingers: [x, 1, 3, 4, x, x]},
    {root: "F", type: "sus2", frets: [x, x, 3, 0, 1, 1], fingers: [x, x, 3, x, 1, 1], barre: {fret: 1, fromString: 4, toString: 5}},
    {root: "C", type: "sus4", frets: [x, 3, 3, 0, 1, 1], fingers: [x, 3, 4, x, 1, 1]},
    {root: "A", type: "sus4", frets: [x, 0, 2, 2, 3, 0], fingers: [x, x, 1, 2, 3, x]},
    {root: "D", type: "sus4", frets: [x, x, 0, 2, 3, 3], fingers: [x, x, x, 1, 2, 3]},
    {root: "E", type: "sus4", frets: [0, 2, 2, 2, 0, 0], fingers: [x, 2, 3, 4, x, x]},
    {root: "G", type: "sus4", frets: [3, 3, 0, 0, 1, 3], fingers: [2, 3, x, x, 1, 4]},
    {root: "F", type: "sus4", frets: [x, x, 3, 3, 1, 1], fingers: [x, x, 3, 4, 1, 1], barre: {fret: 1, fromString: 4, toString: 5}},
    {root: "A", type: "7sus4", frets: [x, 0, 2, 0, 3, 0], fingers: [x, x, 2, x, 3, x]},
    {root: "E", type: "7sus4", frets: [0, 2, 0, 2, 0, 0], fingers: [x, 2, x, 3, x, x]},
    {root: "D", type: "7sus4", frets: [x, x, 0, 2, 1, 3], fingers: [x, x, x, 2, 1, 3]},
    {root: "G", type: "7sus4", frets: [3, 3, 0, 0, 1, 1], fingers: [3, 4, x, x, 1, 1], barre: {fret: 1, fromString: 4, toString: 5}},
    {root: "C", type: "7sus4", frets: [x, 3, 3, 3, 1, 1], fingers: [x, 2, 3, 4, 1, 1], barre: {fret: 1, fromString: 4, toString: 5}},
    {root: "B", type: "7sus4", frets: [x, 2, 4, 2, 5, 2], fingers: [x, 1, 3, 1, 4, 1], barre: {fret: 2, fromString: 1, toString: 5}},
    {root: "A", type: "9sus4", frets: [x, 0, 0, 0, 0, 0], fingers: [x, x, x, x, x, x]},
    {root: "D", type: "9sus4", frets: [x, x, 0, 2, 1, 0], fingers: [x, x, x, 2, 1, x]},

    // Sixth and add
    {root: "C", type: "6", frets: [x, 3, 2, 2, 1, 0], fingers: [x, 4, 2, 3, 1, x]},
    {root: "A", type: "6", frets: [x, 0, 2, 2, 2, 2], fingers: [x, x, 1, 1, 1, 1], barre: {fret: 2, fromString: 2, toString: 5}},
    {root: "G", type: "6", frets: [3, 2, 0, 0, 0, 0], fingers: [2, 1, x, x, x, x]},
    {root: "D", type: "6", frets: [x, x, 0, 2, 0, 2], fingers: [x, x, x, 2, x, 3]},
    {root: "E", type: "6", frets: [0, 2, 2, 1, 2, 0], fingers: [x, 2, 3, 1, 4, x]},
    {root: "F", type: "6", frets: [x, x, 3, 2, 3, 1], fingers: [x, x, 3, 2, 4, 1]},
    {root: "A", type: "m6", frets: [x, 0, 2, 2, 1, 2], fingers: [x, x, 2, 3, 1, 4]},
    {root: "E", type: "m6", frets: [0, 2, 2, 0, 2, 0], fingers: [x, 1, 2, x, 3, x]},
    {root: "D", type: "m6", frets: [x, x, 0, 2, 0, 1], fingers: [x, x, x, 2, x, 1]},
    {root: "C", type: "add9", frets: [x, 3, 2, 0, 3, 0], fingers: [x, 2, 1, x, 3, x]},
    {root: "G", type: "add9", frets: [3, 2, 0, 2, 0, 3], fingers: [2, 1, x, 3, x, 4]},
    {root: "E", type: "add9", frets: [0, 2, 2, 1, 0, 2], fingers: [x, 2, 3, 1, x, 4]},
    {root: "A", type: "add9", frets: [x, 0, 2, 4, 2, 0], fingers: [x, x, 1, 4, 2, x]},
    {root: "D", type: "add9", frets: [x, x, 4, 2, 3, 0], fingers: [x, x, 3, 1, 2, x]},
    {root: "F", type: "add9", frets: [x, x, 3, 2, 1, 3], fingers: [x, x, 3, 2, 1, 4]},
    {root: "A", type: "madd9", frets: [x, 0, 2, 4, 1, 0], fingers: [x, x, 2, 4, 1, x]},
    {root: "E", type: "madd9", frets: [0, 2, 4, 0, 0, 0], fingers: [x, 1, 3, x, x, x]},
    {root: "C", type: "69", frets: [x, 3, 2, 2, 3, 3], fingers: [x, 2, 1, 1, 3, 4]},
    {root: "G", type: "69", frets: [3, x, 0, 2, 0, 0], fingers: [2, x, x, 1, x, x]},
    {root: "E", type: "69", frets: [0, 2, 2, 1, 2, 2], fingers: [x, 2, 3, 1, 4, 4]},
    {root: "A", type: "69", frets: [x, 0, 4, 4, 2, 2], fingers: [x, x, 3, 4, 1, 1], barre: {fret: 2, fromString: 4, toString: 5}},

    // Dominant seventh
    {root: "C", type: "7", frets: [x, 3, 2, 3, 1, 0], fingers: [x, 3, 2, 4, 1, x]},
    {root: "A", type: "7", frets: [x, 0, 2, 0, 2, 0], fingers: [x, x, 2, x, 3, x]},
    {root: "A", type: "7", frets: [x, 0, 2, 2, 2, 3], fingers: [x, x, 1, 1, 1, 4], barre: {fret: 2, fromString: 2, toString: 4}},
    {root: "G", type: "7", frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, x, x, x, 1]},
    {root: "E", type: "7", frets: [0, 2, 0, 1, 0, 0], fingers: [x, 2, x, 1, x, x]},
    {root: "E", type: "7", frets: [0, 2, 2, 1, 3, 0], fingers: [x, 2, 3, 1, 4, x]},
    {root: "D", type: "7", frets: [x, x, 0, 2, 1, 2], fingers: [x, x, x, 2, 1, 3]},
    {root: "B", type: "7", frets: [x, 2, 1, 2, 0, 2], fingers: [x, 2, 1, 3, x, 4]},
    {root: "E", type: "7#5", frets: [0, 3, 0, 1, 1, 0], fingers: [x, 3, x, 1, 2, x]},
    {root: "A", type: "7#5", frets: [x, 0, 3, 0, 2, 1], fingers: [x, x, 3, x, 2, 1]},
    {root: "G", type: "7#5", frets: [3, x, 1, 0, 0, 1], fingers: [3, x, 1, x, x, 2]},
    {root: "E", type: "7b5", frets: [0, 1, 0, 1, 3, 0], fingers: [x, 1, x, 2, 4, x]},

    // Major seventh
    {root: "C", type: "maj7", frets: [x, 3, 2, 0, 0, 0], fingers: [x, 3, 2, x, x, x]},
    {root: "A", type: "maj7", frets: [x, 0, 2, 1, 2, 0], fingers: [x, x, 2, 1, 3, x]},
    {root: "D", type: "maj7", frets: [x, x, 0, 2, 2, 2], fingers: [x, x, x, 1, 1, 1], barre: {fret: 2, fromString: 3, toString: 5}},
    {root: "E", type: "maj7", frets: [0, 2, 1, 1, 0, 0], fingers: [x, 3, 1, 2, x, x]},
    {root: "F", type: "maj7", frets: [x, x, 3, 2, 1, 0], fingers: [x, x, 3, 2, 1, x]},
    {root: "G", type: "maj7", frets: [3, 2, 0, 0, 0, 2], fingers: [3, 2, x, x, x, 1]},

    // Minor seventh
    {root: "A", type: "m7", frets: [x, 0, 2, 0, 1, 0], fingers: [x, x, 2, x, 1, x]},
    {root: "A", type: "m7", frets: [x, 0, 2, 2, 1, 3], fingers: [x, x, 2, 3, 1, 4]},
    {root: "E", type: "m7", frets: [0, 2, 0, 0, 0, 0], fingers: [x, 2, x, x, x, x]},
    {root: "E", type: "m7", frets: [0, 2, 2, 0, 3, 0], fingers: [x, 1, 2, x, 3, x]},
    {root: "D", type: "m7", frets: [x, x, 0, 2, 1, 1], fingers: [x, x, x, 2, 1, 1]},
    {root: "B", type: "m7", frets: [x, 2, 0, 2, 0, 2], fingers: [x, 1, x, 2, x, 3]},
    {root: "F#", type: "m7", frets: [2, x, 2, 2, 2, x], fingers: [1, x, 2, 3, 4, x]},

    // Half-diminished, diminished seventh, minor-major seventh
    {root: "B", type: "m7b5", frets: [x, 2, 3, 2, 3, x], fingers: [x, 1, 3, 2, 4, x]},
    {root: "A", type: "m7b5", frets: [x, 0, 1, 0, 1, 3], fingers: [x, x, 1, x, 2, 4]},
    {root: "E", type: "m7b5", frets: [0, 1, 2, 0, 3, 0], fingers: [x, 1, 2, x, 4, x]},
    {root: "F#", type: "m7b5", frets: [2, x, 2, 2, 1, x], fingers: [2, x, 3, 4, 1, x]},
    {root: "D", type: "m7b5", frets: [x, x, 0, 1, 1, 1], fingers: [x, x, x, 1, 1, 1], barre: {fret: 1, fromString: 3, toString: 5}},
    {root: "B", type: "dim7", frets: [x, 2, 3, 1, 3, x], fingers: [x, 2, 3, 1, 4, x]},
    {root: "D", type: "dim7", frets: [x, x, 0, 1, 0, 1], fingers: [x, x, x, 1, x, 2]},
    {root: "E", type: "dim7", frets: [0, 1, 2, 0, 2, 0], fingers: [x, 1, 2, x, 3, x]},
    {root: "A", type: "dim7", frets: [x, 0, 1, 2, 1, 2], fingers: [x, x, 1, 3, 2, 4]},
    {root: "A", type: "mMaj7", frets: [x, 0, 2, 1, 1, 0], fingers: [x, x, 3, 1, 2, x]},
    {root: "E", type: "mMaj7", frets: [0, 2, 1, 0, 0, 0], fingers: [x, 2, 1, x, x, x]},
    {root: "D", type: "mMaj7", frets: [x, x, 0, 2, 2, 1], fingers: [x, x, x, 2, 3, 1]},

    // Ninths
    {root: "E", type: "9", frets: [0, 2, 0, 1, 0, 2], fingers: [x, 2, x, 1, x, 3]},
    {root: "A", type: "9", frets: [x, 0, 2, 4, 2, 3], fingers: [x, x, 1, 3, 2, 4]},
    {root: "D", type: "9", frets: [x, x, 0, 2, 1, 0], fingers: [x, x, x, 2, 1, x]},
    {root: "C", type: "9", frets: [x, 3, 2, 3, 3, 3], fingers: [x, 2, 1, 3, 3, 3]},
    {root: "G", type: "9", frets: [3, x, 0, 2, 0, 1], fingers: [3, x, x, 2, x, 1]},
    {root: "C", type: "maj9", frets: [x, 3, 0, 0, 0, 0], fingers: [x, 3, x, x, x, x]},
    {root: "A", type: "maj9", frets: [x, 0, 2, 1, 0, 0], fingers: [x, x, 2, 1, x, x]},
    {root: "F", type: "maj9", frets: [x, x, 3, 0, 1, 0], fingers: [x, x, 3, x, 1, x]},
    {root: "D", type: "maj9", frets: [x, x, 0, 2, 2, 0], fingers: [x, x, x, 1, 2, x]},
    {root: "E", type: "maj9", frets: [0, 2, 1, 1, 0, 2], fingers: [x, 3, 1, 2, x, 4]},
    {root: "G", type: "maj9", frets: [3, x, 0, 2, 0, 2], fingers: [2, x, x, 1, x, 3]},
    {root: "A", type: "m9", frets: [x, 0, 2, 4, 1, 3], fingers: [x, x, 2, 4, 1, 3]},
    {root: "E", type: "m9", frets: [0, 2, 0, 0, 0, 2], fingers: [x, 2, x, x, x, 3]},
    {root: "E", type: "7b9", frets: [0, 2, 0, 1, 0, 1], fingers: [x, 3, x, 1, x, 2]},
    {root: "A", type: "7b9", frets: [x, 0, 2, 3, 2, 3], fingers: [x, x, 1, 3, 2, 4]},

    // Elevenths and thirteenths
    {root: "A", type: "11", frets: [x, 0, 0, 0, 0, 0], fingers: [x, x, x, x, x, x]},
    {root: "A", type: "m11", frets: [x, 0, 0, 0, 1, 0], fingers: [x, x, x, x, 1, x]},
    {root: "E", type: "m11", frets: [0, 0, 0, 0, 0, 0], fingers: [x, x, x, x, x, x]},
    {root: "C", type: "maj7#11", frets: [x, 3, 2, 0, 0, 2], fingers: [x, 3, 2, x, x, 1]},
    {root: "F", type: "maj7#11", frets: [x, x, 3, 2, 0, 0], fingers: [x, x, 3, 2, x, x]},
    {root: "E", type: "13", frets: [0, 2, 0, 1, 2, 0], fingers: [x, 2, x, 1, 3, x]},
    {root: "A", type: "13", frets: [x, 0, 2, 0, 2, 2], fingers: [x, x, 1, x, 2, 3]},
    {root: "C", type: "maj13", frets: [x, 3, 2, 2, 0, 0], fingers: [x, 3, 1, 2, x, x]},

    // Power
    {root: "E", type: "5", frets: [0, 2, 2, x, x, x], fingers: [x, 1, 2, x, x, x]},
    {root: "A", type: "5", frets: [x, 0, 2, 2, x, x], fingers: [x, x, 1, 2, x, x]},
    {root: "D", type: "5", frets: [x, x, 0, 2, 3, x], fingers: [x, x, x, 1, 2, x]},
    {root: "G", type: "5", frets: [3, x, 0, 0, 3, 3], fingers: [2, x, x, x, 3, 4]},
    {root: "F", type: "5", frets: [1, 3, 3, x, x, x], fingers: [1, 3, 4, x, x, x]},
]
