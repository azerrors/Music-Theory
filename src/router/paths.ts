import {rootToSlug} from "@/lib/theory/notes"
import type {NoteName} from "@/types/music"

export const PATHS = {
    home: "/",
    chords: "/chords",
    chordPattern: "/chords/:root/:type",
    chord: (root: NoteName, type: string, bass?: NoteName) =>
        `/chords/${rootToSlug(root)}/${encodeURIComponent(type)}${bass ? `?bass=${rootToSlug(bass)}` : ""}`,
    scales: "/scales",
    progressions: "/progressions",
    song: "/song",
    builder: "/builder",
    intervals: "/intervals",
    circle: "/circle",
    glossary: "/glossary",
    fretboard: "/fretboard",
    settings: "/settings",
} as const
