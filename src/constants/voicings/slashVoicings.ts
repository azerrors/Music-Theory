import type {Barre, Fret, NoteName} from "@/types/music"
import type {ShapeTemplate} from "@/constants/voicings/movableShapes"

export interface OpenSlashVoicingDef {
    root: NoteName
    /** Tonal chord-type alias of the chord above the bass. */
    type: string
    /** The note in the bass, e.g. "E" in C/E. */
    bass: NoteName
    frets: Fret[]
    fingers: (number | null)[]
    barre?: Barre
}

/** A movable slash shape; `rootString` is the string that carries the bass. */
export interface SlashTemplate extends ShapeTemplate {
    /** Interval from the chord root up to the bass: "3M" = first inversion, "5P" = second, "7m" = third. */
    bassInterval: string
}

const x = null

/**
 * First-position slash chords. `slashVoicings.test.ts` checks that the bass is the
 * lowest sounding note and every other note belongs to the chord.
 */
export const OPEN_SLASH_VOICINGS: OpenSlashVoicingDef[] = [
    {root: "C", type: "M", bass: "E", frets: [0, 3, 2, 0, 1, 0], fingers: [x, 3, 2, x, 1, x]},
    {root: "C", type: "M", bass: "G", frets: [3, 3, 2, 0, 1, 0], fingers: [4, 3, 2, x, 1, x]},
    {root: "C", type: "M", bass: "B", frets: [x, 2, 2, 0, 1, 0], fingers: [x, 2, 3, x, 1, x]},
    {root: "C", type: "M", bass: "D", frets: [x, x, 0, 0, 1, 0], fingers: [x, x, x, x, 1, x]},
    {root: "G", type: "M", bass: "B", frets: [x, 2, 0, 0, 0, 3], fingers: [x, 1, x, x, x, 3]},
    {root: "G", type: "M", bass: "D", frets: [x, x, 0, 0, 0, 3], fingers: [x, x, x, x, x, 3]},
    {root: "G", type: "M", bass: "F", frets: [1, 2, 0, 0, 0, 3], fingers: [1, 2, x, x, x, 4]},
    {root: "D", type: "M", bass: "F#", frets: [2, x, 0, 2, 3, 2], fingers: [1, x, x, 2, 4, 3]},
    {root: "D", type: "M", bass: "A", frets: [x, 0, 0, 2, 3, 2], fingers: [x, x, x, 1, 3, 2]},
    {root: "D", type: "M", bass: "C", frets: [x, 3, 0, 2, 3, 2], fingers: [x, 3, x, 1, 4, 2]},
    {root: "A", type: "M", bass: "C#", frets: [x, 4, 2, 2, 2, 0], fingers: [x, 4, 1, 1, 1, x], barre: {fret: 2, fromString: 2, toString: 4}},
    {root: "A", type: "M", bass: "E", frets: [0, 0, 2, 2, 2, 0], fingers: [x, x, 1, 2, 3, x]},
    {root: "A", type: "M", bass: "G", frets: [3, 0, 2, 2, 2, 0], fingers: [4, x, 1, 2, 3, x]},
    {root: "E", type: "M", bass: "G#", frets: [4, x, 2, 1, 0, 0], fingers: [4, x, 2, 1, x, x]},
    {root: "E", type: "M", bass: "B", frets: [x, 2, 2, 1, 0, 0], fingers: [x, 2, 3, 1, x, x]},
    {root: "F", type: "M", bass: "A", frets: [x, 0, 3, 2, 1, 1], fingers: [x, x, 3, 2, 1, 1], barre: {fret: 1, fromString: 4, toString: 5}},
    {root: "F", type: "M", bass: "C", frets: [x, 3, 3, 2, 1, 1], fingers: [x, 3, 4, 2, 1, 1], barre: {fret: 1, fromString: 4, toString: 5}},
    {root: "F", type: "M", bass: "G", frets: [3, x, 3, 2, 1, 1], fingers: [4, x, 3, 2, 1, 1], barre: {fret: 1, fromString: 4, toString: 5}},

    {root: "A", type: "m", bass: "G", frets: [3, 0, 2, 2, 1, 0], fingers: [4, x, 2, 3, 1, x]},
    {root: "A", type: "m", bass: "C", frets: [x, 3, 2, 2, 1, 0], fingers: [x, 4, 2, 3, 1, x]},
    {root: "A", type: "m", bass: "E", frets: [0, 0, 2, 2, 1, 0], fingers: [x, x, 2, 3, 1, x]},
    {root: "A", type: "m", bass: "F#", frets: [2, 0, 2, 2, 1, 0], fingers: [2, x, 3, 4, 1, x]},
    {root: "E", type: "m", bass: "D", frets: [x, x, 0, 0, 0, 0], fingers: [x, x, x, x, x, x]},
    {root: "E", type: "m", bass: "G", frets: [3, 2, 2, 0, 0, 0], fingers: [3, 1, 2, x, x, x]},
    {root: "E", type: "m", bass: "B", frets: [x, 2, 2, 0, 0, 0], fingers: [x, 1, 2, x, x, x]},
    {root: "D", type: "m", bass: "F", frets: [1, x, 0, 2, 3, 1], fingers: [1, x, x, 3, 4, 2]},
    {root: "D", type: "m", bass: "C", frets: [x, 3, 0, 2, 3, 1], fingers: [x, 3, x, 2, 4, 1]},
    {root: "D", type: "m", bass: "A", frets: [x, 0, 0, 2, 3, 1], fingers: [x, x, x, 2, 3, 1]},
    {root: "B", type: "m", bass: "A", frets: [x, 0, 4, 4, 3, 2], fingers: [x, x, 3, 4, 2, 1]},

    {root: "C", type: "7", bass: "E", frets: [0, 3, 2, 3, 1, 0], fingers: [x, 3, 2, 4, 1, x]},
    {root: "G", type: "7", bass: "B", frets: [x, 2, 0, 0, 0, 1], fingers: [x, 2, x, x, x, 1]},
    {root: "D", type: "7", bass: "F#", frets: [2, x, 0, 2, 1, 2], fingers: [2, x, x, 3, 1, 4]},
    {root: "A", type: "m7", bass: "G", frets: [3, 0, 2, 0, 1, 0], fingers: [3, x, 2, x, 1, x]},
]

/** Inversions that slide along the neck, placed by their bass note. */
export const SLASH_SHAPES: SlashTemplate[] = [
    // Bass on the 6th string
    {type: "M", bassInterval: "3M", shape: "slash6", rootString: 0, offsets: [0, x, -2, 0, 1, x], fingers: [2, x, 1, 3, 4, x]},
    {type: "M", bassInterval: "5P", shape: "slash6", rootString: 0, offsets: [0, 0, 2, 2, 2, 0], fingers: [1, 1, 3, 3, 3, 1], barre: {offset: 0, fromString: 0, toString: 5}},
    {type: "m", bassInterval: "3m", shape: "slash6", rootString: 0, offsets: [0, x, -1, 1, 2, x], fingers: [2, x, 1, 3, 4, x]},
    {type: "m", bassInterval: "5P", shape: "slash6", rootString: 0, offsets: [0, 0, 2, 2, 1, 0], fingers: [1, 1, 3, 4, 2, 1], barre: {offset: 0, fromString: 0, toString: 5}},
    {type: "7", bassInterval: "3M", shape: "slash6", rootString: 0, offsets: [0, x, -2, 0, -1, x], fingers: [3, x, 1, 4, 2, x]},
    {type: "7", bassInterval: "5P", shape: "slash6", rootString: 0, offsets: [0, 0, 2, 0, 2, 0], fingers: [1, 1, 3, 1, 4, 1], barre: {offset: 0, fromString: 0, toString: 5}},
    {type: "maj7", bassInterval: "5P", shape: "slash6", rootString: 0, offsets: [0, 0, 2, 1, 2, 0], fingers: [1, 1, 3, 2, 4, 1], barre: {offset: 0, fromString: 0, toString: 5}},
    {type: "maj7", bassInterval: "7M", shape: "slash6", rootString: 0, offsets: [0, x, 3, 2, 1, x], fingers: [1, x, 4, 3, 2, x]},
    {type: "m7", bassInterval: "5P", shape: "slash6", rootString: 0, offsets: [0, 0, 2, 0, 1, 0], fingers: [1, 1, 3, 1, 2, 1], barre: {offset: 0, fromString: 0, toString: 5}},

    // Bass on the 5th string
    {type: "M", bassInterval: "3M", shape: "slash5", rootString: 1, offsets: [x, 0, -2, -2, -2, x], fingers: [x, 3, 1, 1, 1, x], barre: {offset: -2, fromString: 2, toString: 4}},
    {type: "M", bassInterval: "5P", shape: "slash5", rootString: 1, offsets: [x, 0, 0, 2, 3, 2], fingers: [x, 1, 1, 2, 4, 3], barre: {offset: 0, fromString: 1, toString: 2}},
    {type: "m", bassInterval: "3m", shape: "slash5", rootString: 1, offsets: [x, 0, -1, -1, -2, x], fingers: [x, 4, 2, 3, 1, x]},
    {type: "m", bassInterval: "5P", shape: "slash5", rootString: 1, offsets: [x, 0, 0, 2, 3, 1], fingers: [x, 1, 1, 3, 4, 2], barre: {offset: 0, fromString: 1, toString: 2}},
    {type: "7", bassInterval: "5P", shape: "slash5", rootString: 1, offsets: [x, 0, 0, 2, 1, 2], fingers: [x, 1, 1, 3, 2, 4], barre: {offset: 0, fromString: 1, toString: 2}},
    {type: "7", bassInterval: "7m", shape: "slash5", rootString: 1, offsets: [x, 0, x, -1, 0, -1], fingers: [x, 3, x, 1, 4, 2]},
    {type: "maj7", bassInterval: "5P", shape: "slash5", rootString: 1, offsets: [x, 0, 0, 2, 2, 2], fingers: [x, 1, 1, 2, 3, 4], barre: {offset: 0, fromString: 1, toString: 2}},
    {type: "m7", bassInterval: "5P", shape: "slash5", rootString: 1, offsets: [x, 0, 0, 2, 1, 1], fingers: [x, 1, 1, 4, 2, 3], barre: {offset: 0, fromString: 1, toString: 2}},
    {type: "m7", bassInterval: "7m", shape: "slash5", rootString: 1, offsets: [x, 0, x, -1, 0, -2], fingers: [x, 3, x, 2, 4, 1]},
]
