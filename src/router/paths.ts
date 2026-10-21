import {rootToSlug} from "@/lib/theory/notes"
import type {NoteName} from "@/types/music"

/** Entry page: pick an instrument. */
export const INSTRUMENT_PICKER_PATH = "/"

export const PATHS = {
    home: "/guitar",
    chords: "/guitar/chords",
    chordPattern: "/guitar/chords/:root/:type",
    chord: (root: NoteName, type: string, bass?: NoteName) =>
        `/guitar/chords/${rootToSlug(root)}/${encodeURIComponent(type)}${bass ? `?bass=${rootToSlug(bass)}` : ""}`,
    scales: "/guitar/scales",
    progressions: "/guitar/progressions",
    song: "/guitar/song",
    builder: "/guitar/builder",
    intervals: "/guitar/intervals",
    circle: "/guitar/circle",
    glossary: "/guitar/glossary",
    fretboard: "/guitar/fretboard",
    play: "/guitar/play",
    practiceEar: "/guitar/practice/ear",
    practiceFind: "/guitar/practice/find",
    practiceCircle: "/guitar/practice/circle",
    practiceKeys: "/guitar/practice/keys",
    practiceIntervals: "/guitar/practice/intervals",
    settings: "/settings",
} as const

export const PIANO_PATHS = {
    home: "/piano",
    chords: "/piano/chords",
    scales: "/piano/scales",
    builder: "/piano/builder",
    progressions: "/piano/progressions",
    intervals: "/piano/intervals",
    play: "/piano/play",
    practiceEar: "/piano/practice/ear",
    practiceFind: "/piano/practice/find",
    practiceCircle: "/piano/practice/circle",
    practiceKeys: "/piano/practice/keys",
    practiceIntervals: "/piano/practice/intervals",
    chordPattern: "/piano/chords/:root/:type",
    chord: (root: NoteName, type: string, bass?: NoteName) =>
        `/piano/chords/${rootToSlug(root)}/${encodeURIComponent(type)}${bass ? `?bass=${rootToSlug(bass)}` : ""}`,
} as const
