import type {NoteName} from "@/types/music"

/** Root choices offered in pickers — one conventional spelling per pitch class. */
export const ROOT_NOTES: NoteName[] = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"]

export const SOLFEGE: Record<string, string> = {
    C: "Do",
    D: "Re",
    E: "Mi",
    F: "Fa",
    G: "Sol",
    A: "La",
    B: "Si",
}

export const DEFAULT_FRET_COUNT = 15

/** Frets that carry inlay dots on a real neck; 12 and 24 get a double dot. */
export const INLAY_FRETS = [3, 5, 7, 9, 15, 17, 19, 21]
export const DOUBLE_INLAY_FRETS = [12, 24]
