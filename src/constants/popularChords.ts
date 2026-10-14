import type {NoteName} from "@/types/music"

/**
 * Chord types ranked by how often they appear in songs. Corpus studies agree on the top of the
 * list: in the McGill Billboard set major, minor, 7, m7 and maj7 make up 85.7% of all chords
 * (Burgoyne 2011); in Chordonomicon (51M chords from guitar sites) 71% are major, 26% minor,
 * then sus and power chords at ~1.4% each. The tail below that is ordered by how common the
 * chords are in guitar song books, which no corpus ranks precisely.
 */
export const POPULAR_TYPES = [
    "M", "m", "7", "m7", "maj7",
    "sus4", "sus2", "5", "add9", "7sus4",
    "6", "m6", "dim", "dim7", "m7b5", "aug", "9",
] as const

/**
 * Roots in the order guitar music uses them: open-string keys first (G, C, D, A, E), as raw
 * guitar-site data puts G and C at 24% of all chords. Minor-family chords follow the relative
 * minors of the same keys, and spell their roots the way chord charts do (G♯m, not A♭m).
 */
const MAJOR_ROOTS: NoteName[] = ["G", "C", "D", "A", "E", "F", "B", "Bb", "Eb", "F#", "Ab", "C#"]
const MINOR_ROOTS: NoteName[] = ["A", "E", "D", "B", "F#", "C#", "G", "C", "F", "G#", "Bb", "Eb"]

const MINOR_FAMILY = new Set(["m", "m7", "m6", "dim", "dim7", "m7b5"])

export interface PopularChord {
    /** 1 = most used. */
    rank: number
    root: NoteName
    type: string
}

/**
 * The ~200 chords a guitarist meets most: 17 types × 12 roots = 204, ranked by type first and
 * root popularity second, so all the major chords come before the first exotic colour.
 */
export const POPULAR_CHORDS: PopularChord[] = POPULAR_TYPES.flatMap(type =>
    (MINOR_FAMILY.has(type) ? MINOR_ROOTS : MAJOR_ROOTS).map(root => ({root, type})),
).map((chord, index) => ({...chord, rank: index + 1}))
