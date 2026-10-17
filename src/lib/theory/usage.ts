import {Chord, Key} from "tonal"
import {chroma} from "@/lib/theory/notes"
import {
    diatonicChords,
    harmonicFunction,
    presetSteps,
    presetsForMode,
    resolveStep,
    romanNumeral,
    type HarmonicFunction,
    type KeyChord,
    type KeyMode,
    type ProgressionPreset,
    type ProgressionStep,
} from "@/lib/theory/progressions"
import type {NoteName} from "@/types/music"

/** Key tonics spelled the way key signatures spell them (D♭ major, not C♯; E♭ minor, not D♯). */
const MAJOR_TONICS: NoteName[] = ["C", "G", "D", "A", "E", "B", "F#", "Db", "Ab", "Eb", "Bb", "F"]
const MINOR_TONICS: NoteName[] = ["A", "E", "B", "F#", "C#", "G#", "Eb", "Bb", "F", "C", "G", "D"]

/**
 * Which chords usually follow each scale degree (0 = I). Based on the classic "chord progression
 * map" of functional harmony: chords move down by fifths towards the tonic (vi → ii → V → I),
 * the tonic can go anywhere, and pop music adds the IV ↔ vi and ♭VI ↔ ♭VII moves.
 */
const NEXT_DEGREES: Record<KeyMode, number[][]> = {
    major: [
        [3, 4, 5, 1, 2], // I → IV, V, vi, ii, iii
        [4, 6], // ii → V, vii°
        [5, 3], // iii → vi, IV
        [4, 0, 1, 6], // IV → V, I, ii, vii°
        [0, 5], // V → I, vi
        [3, 1, 4], // vi → IV, ii, V
        [0], // vii° → I
    ],
    minor: [
        [3, 5, 6, 4, 2, 1], // i → iv, ♭VI, ♭VII, V, ♭III, ii°
        [4], // ii° → V
        [5, 3, 6], // ♭III → ♭VI, iv, ♭VII
        [4, 0, 6, 1], // iv → V, i, ♭VII, ii°
        [0, 5], // V → i, ♭VI
        [6, 3, 4, 1, 2], // ♭VI → ♭VII, iv, V, ii°, ♭III
        [2, 0, 5], // ♭VII → ♭III, i, ♭VI
    ],
}

/** How central a degree is, used to list the keys where the chord matters most first: I, V, IV, vi… */
const DEGREE_WEIGHT: Record<KeyMode, number[]> = {
    major: [0, 4, 5, 2, 1, 3, 6],
    minor: [0, 6, 5, 2, 1, 3, 4],
}

/** Diatonic = natural scale; harmonic = minor keys only, needs the raised 7th (E or E7 in A minor). */
export type UsageSource = "diatonic" | "harmonic"

export interface PresetUsage {
    preset: ProgressionPreset
    steps: ProgressionStep[]
    /** Indexes of the steps that are this chord. */
    matches: number[]
}

export interface KeyUsage {
    tonic: NoteName
    mode: KeyMode
    /** The chord's root as the key spells it. */
    root: NoteName
    /** Scale degree of the root, 0 = tonic. */
    degree: number
    roman: string
    fn: HarmonicFunction
    source: UsageSource
    before: KeyChord[]
    after: KeyChord[]
    presets: PresetUsage[]
}

type Quality = "major" | "minor" | "dim" | "aug" | "open"

/** The triad inside a chord; sus and power chords have no third, so they fit either quality. */
function quality(type: string): Quality {
    const intervals = Chord.getChord(type, "C").intervals
    if (intervals.includes("3m")) return intervals.includes("5d") ? "dim" : "minor"
    if (intervals.includes("3M")) return intervals.includes("5A") ? "aug" : "major"
    return "open"
}

function sameSlot(a: {root: NoteName; type: string}, b: {root: NoteName; type: string}): boolean {
    if (chroma(a.root) !== chroma(b.root)) return false
    const qa = quality(a.type)
    const qb = quality(b.type)
    return qa === qb || qa === "open" || qb === "open"
}

/** The key's chord on each degree; in minor the V is the major chord of harmonic minor, as in real songs. */
function degreeChords(tonic: NoteName, mode: KeyMode): KeyChord[] {
    const chords = diatonicChords(tonic, mode)
    if (mode === "minor" && chords[4]) {
        const root = chords[4].root
        chords[4] = {root, type: "M", roman: romanNumeral(tonic, root, "M", mode), source: "harmonic"}
    }
    return chords
}

function fits(notes: NoteName[], scale: readonly NoteName[]): boolean {
    const pool = new Set(scale.map(chroma))
    return notes.every(note => pool.has(chroma(note)))
}

function presetUsages(tonic: NoteName, mode: KeyMode, chord: {root: NoteName; type: string}): PresetUsage[] {
    return presetsForMode(mode).flatMap(preset => {
        const steps = presetSteps(preset, tonic)
        const matches = steps.flatMap((step, index) => (sameSlot({root: resolveStep(tonic, step), type: step.type}, chord) ? [index] : []))
        return matches.length > 0 ? [{preset, steps, matches}] : []
    })
}

/**
 * Every key the chord lives in, with its Roman numeral there, the chords that usually come
 * before and after it, and the ready-made progressions that use it. Slash chords are judged by
 * the chord above the bass.
 */
export function chordUsage(root: NoteName, type: string): KeyUsage[] {
    const notes = Chord.getChord(type, root).notes
    if (notes.length === 0) return []

    const result: KeyUsage[] = []
    for (const mode of ["major", "minor"] as KeyMode[]) {
        for (const tonic of mode === "major" ? MAJOR_TONICS : MINOR_TONICS) {
            const scales: {source: UsageSource; scale: readonly NoteName[]}[] = mode === "major"
                ? [{source: "diatonic", scale: Key.majorKey(tonic).scale}]
                : [
                    {source: "diatonic", scale: Key.minorKey(tonic).natural.scale},
                    {source: "harmonic", scale: Key.minorKey(tonic).harmonic.scale},
                ]
            const pool = scales.find(item => fits(notes, item.scale))
            if (!pool) continue

            const degree = pool.scale.findIndex(note => chroma(note) === chroma(root))
            if (degree < 0) continue
            const keyRoot = pool.scale[degree]!
            const chords = degreeChords(tonic, mode)
            const next = NEXT_DEGREES[mode][degree] ?? []
            const previous = NEXT_DEGREES[mode].flatMap((targets, from) => (from !== degree && targets.includes(degree) ? [from] : []))
                .sort((a, b) => DEGREE_WEIGHT[mode][a]! - DEGREE_WEIGHT[mode][b]!)

            result.push({
                tonic,
                mode,
                root: keyRoot,
                degree,
                roman: romanNumeral(tonic, keyRoot, type, mode),
                fn: harmonicFunction(tonic, mode, keyRoot, type),
                source: pool.source,
                before: previous.flatMap(index => chords[index] ?? []),
                after: next.flatMap(index => chords[index] ?? []),
                presets: presetUsages(tonic, mode, {root: keyRoot, type}),
            })
        }
    }

    return result.sort((a, b) =>
        // Keys from the natural scales first, then by how central the degree is, major before minor.
        Number(a.source === "harmonic") - Number(b.source === "harmonic")
        || DEGREE_WEIGHT[a.mode][a.degree]! - DEGREE_WEIGHT[b.mode][b.degree]!
        || Number(a.mode === "minor") - Number(b.mode === "minor"))
}
