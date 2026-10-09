import {Chord, Interval, Key, Note} from "tonal"
import {findChordType} from "@/constants/chordTypes"
import {ROOT_NOTES} from "@/constants/notes"
import {OPEN_VOICINGS} from "@/constants/voicings/openVoicings"
import {OPEN_SLASH_VOICINGS} from "@/constants/voicings/slashVoicings"
import {chroma, isSamePitchClass, mod12} from "@/lib/theory/notes"
import {
    chordRoman,
    harmonicFunction,
    KEY_MODES,
    PROGRESSION_PRESETS,
    presetSteps,
    resolveStep,
    romanNumeral,
    type HarmonicFunction,
    type KeyMode,
    type ProgressionPreset,
} from "@/lib/theory/progressions"
import {slashVoicings} from "@/lib/theory/slash"
import {getVoicings} from "@/lib/theory/voicings"
import type {NoteName} from "@/types/music"

export interface SongChord {
    root: NoteName
    /** Catalogue chord-type symbol. */
    type: string
    bass?: NoteName
}

export interface ParsedToken {
    /** The text as typed, e.g. "G/B". */
    token: string
    chord?: SongChord
    /** Set when the symbol isn't in the catalogue and was simplified, e.g. "C7b13" → C7. */
    simplifiedFrom?: string
}

/**
 * Where a chord sits relative to a key; "outside" means it fits none of the usual explanations.
 * "blues" is a dominant 7th on I or IV of a major key (E7, A7 in E), the bread and butter of the blues.
 */
export type ChordFit = "diatonic" | "harmonic" | "blues" | "secondary" | "borrowed" | "outside"

export interface KeyCandidate {
    tonic: NoteName
    mode: KeyMode
    score: number
    /** Share of the chords built only from the key's own scale, 0–1. */
    diatonicShare: number
}

export interface ChordAnalysis {
    chord: SongChord
    roman: string
    fn: HarmonicFunction
    fit: ChordFit
}

const FIT_WEIGHTS: Record<ChordFit, number> = {diatonic: 1, harmonic: 0.85, blues: 0.85, secondary: 0.6, borrowed: 0.4, outside: 0}

const DOMINANT_TYPES = new Set(["7", "9", "13", "7#9", "7b9"])

const MAJOR_TONIC_TYPES = new Set(["M", "maj7", "6", "add9", "69", "maj9", "maj13", "sus2", "sus4", "5"])
const MINOR_TONIC_TYPES = new Set(["m", "m7", "m6", "madd9", "m9", "m11", "mMaj7", "5"])

/** Brings a symbol the catalogue doesn't list down to its basic quality: C7b13 → 7, Cm(maj9) → mMaj7… */
function simplifyType(intervals: string[]): string {
    const has = (interval: string) => intervals.includes(interval)
    const minor = has("3m")
    const major = has("3M")
    if (minor && has("5d") && has("7m")) return "m7b5"
    if (minor && has("5d")) return "dim"
    if (minor) return has("7M") ? "mMaj7" : has("7m") ? "m7" : "m"
    if (major) return has("7M") ? "maj7" : has("7m") ? "7" : has("5A") ? "aug" : "M"
    if (has("4P")) return has("7m") ? "7sus4" : "sus4"
    if (has("2M")) return "sus2"
    return "5"
}

function parseToken(token: string): ParsedToken {
    const symbol = token.replaceAll("♯", "#").replaceAll("♭", "b")
    const chord = Chord.get(symbol)
    if (chord.empty || !chord.tonic) return {token}

    const known = chord.aliases.map(findChordType).find(Boolean)
    const type = known?.symbol ?? simplifyType(chord.intervals)
    const bass = chord.bass && chroma(chord.bass) !== chroma(chord.tonic) ? chord.bass : undefined

    return {
        token,
        chord: {root: chord.tonic, type, bass},
        simplifiedFrom: known ? undefined : token,
    }
}

/** Reads chords typed the way people write them: "G Em C D", "Am | F | C | G/B", "C, G, Am, F". */
export function parseChordList(text: string): ParsedToken[] {
    return text
        .replaceAll(/[–—]/g, " ")
        .replaceAll(/\s-\s/g, " ")
        .split(/[\s,|;]+/)
        .filter(Boolean)
        .map(parseToken)
}

function chordNotes(chord: SongChord): NoteName[] {
    return Chord.getChord(chord.type, chord.root).notes
}

function isSubset(notes: readonly NoteName[], scale: readonly NoteName[]): boolean {
    const chromas = new Set(scale.map(chroma))
    return notes.every(note => chromas.has(chroma(note)))
}

/** How a chord fits the key on `tonic`: built from the scale, borrowed, a secondary dominant… */
export function chordFit(tonic: NoteName, mode: KeyMode, chord: SongChord): ChordFit {
    const notes = chordNotes(chord)
    const natural = mode === "major" ? Key.majorKey(tonic).scale : Key.minorKey(tonic).natural.scale
    if (isSubset(notes, natural)) return "diatonic"
    if (mode === "minor" && isSubset(notes, Key.minorKey(tonic).harmonic.scale)) return "harmonic"
    if (chordRoman(tonic, mode, chord.root, chord.type).startsWith("V7/")) return "secondary"
    if (mode === "major" && DOMINANT_TYPES.has(chord.type)) {
        const degree = mod12(chroma(chord.root) - chroma(tonic))
        if (degree === 0 || degree === 5) return "blues"
    }
    const parallel = mode === "major" ? Key.minorKey(tonic).natural.scale : Key.majorKey(tonic).scale
    if (isSubset(notes, parallel)) return "borrowed"
    return "outside"
}

function isTonicChord(tonic: NoteName, mode: KeyMode, chord: SongChord): boolean {
    if (!isSamePitchClass(chord.root, tonic)) return false
    // In the blues the home chord is a dominant 7th (E7 in E).
    if (mode === "major" && DOMINANT_TYPES.has(chord.type)) return true
    return (mode === "major" ? MAJOR_TONIC_TYPES : MINOR_TONIC_TYPES).has(chord.type)
}

/** True when `chord` is the key's V or V7 (major V in minor too), the chord that resolves home. */
function isDominantOf(tonic: NoteName, chord: SongChord): boolean {
    return mod12(chroma(chord.root) - chroma(tonic)) === 7 && (chord.type === "M" || DOMINANT_TYPES.has(chord.type))
}

/**
 * Ranks all 24 major and minor keys for a chord list. Fit with the key's chords counts
 * most; starting and especially ending on the tonic chord, and V → I resolutions, break ties
 * such as G major vs E minor. A last, tiny nudge goes to major, the more common case.
 */
export function detectKeys(chords: SongChord[]): KeyCandidate[] {
    if (chords.length === 0) return []

    const candidates = ROOT_NOTES.flatMap(tonic => KEY_MODES.map(mode => {
        const fits = chords.map(chord => chordFit(tonic, mode, chord))
        const fit = fits.reduce((sum, item) => sum + FIT_WEIGHTS[item], 0) / chords.length

        let bonus = 0
        if (isTonicChord(tonic, mode, chords.at(-1)!)) bonus += 0.15
        if (isTonicChord(tonic, mode, chords[0]!)) bonus += 0.1
        if (!chords.some(chord => isTonicChord(tonic, mode, chord))) bonus -= 0.1
        // Songs loop, so the last chord also leads back into the first.
        const resolutions = chords.filter((chord, index) =>
            isDominantOf(tonic, chord) && isTonicChord(tonic, mode, chords[(index + 1) % chords.length]!)).length
        bonus += Math.min(resolutions * 0.05, 0.1)
        if (mode === "major") bonus += 0.01

        return {
            tonic,
            mode,
            score: fit + bonus,
            diatonicShare: fits.filter(item => item === "diatonic").length / chords.length,
        }
    }))

    return candidates.sort((a, b) => b.score - a.score)
}

export function analyzeChords(tonic: NoteName, mode: KeyMode, chords: SongChord[]): ChordAnalysis[] {
    return chords.map(chord => ({
        chord,
        roman: chordRoman(tonic, mode, chord.root, chord.type, chord.bass),
        fn: harmonicFunction(tonic, mode, chord.root, chord.type),
        fit: chordFit(tonic, mode, chord),
    }))
}

const TRIAD_OF: Record<string, string> = {
    m: "m", m6: "m", m7: "m", m9: "m", m11: "m", m13: "m", madd9: "m", mMaj7: "m",
    dim: "dim", dim7: "dim", m7b5: "dim", aug: "aug", "7#5": "aug",
}

/** Numeral of the chord's basic triad, so Dm7 and Dm both read "ii" when matching progressions. */
function triadRoman(tonic: NoteName, chord: {root: NoteName; type: string}): string {
    return romanNumeral(tonic, chord.root, TRIAD_OF[chord.type] ?? "M")
}

/**
 * A known progression the song contains, e.g. G Em C D → "fifties". The preset may start
 * anywhere in the loop (vi–IV–I–V is the pop progression rotated), and chord colours are ignored.
 */
export function findPreset(tonic: NoteName, mode: KeyMode, chords: SongChord[]): ProgressionPreset | undefined {
    const song = chords.map(chord => triadRoman(tonic, chord))
    const loop = [...song, ...song].join(" ")

    return PROGRESSION_PRESETS
        .filter(preset => preset.mode === mode && preset.steps.length >= 3 && preset.steps.length <= song.length)
        .map(preset => ({
            preset,
            numerals: presetSteps(preset, tonic).map(step => triadRoman(tonic, {root: resolveStep(tonic, step), type: step.type})),
        }))
        .map(item => ({...item, at: ` ${loop} `.indexOf(` ${item.numerals.join(" ")} `)}))
        .filter(item => item.at >= 0)
        // Longest match wins; between rotations of the same loop, the one the song starts with.
        .sort((a, b) => b.numerals.length - a.numerals.length || a.at - b.at)[0]?.preset
}

/** Moves every chord by the interval between two keys, keeping sensible spellings (no double sharps). */
export function transposeChords(chords: SongChord[], from: NoteName, to: NoteName): SongChord[] {
    const interval = Interval.distance(from, to)
    const move = (note: NoteName) => Note.simplify(Note.transpose(note, interval))
    return chords.map(chord => ({...chord, root: move(chord.root), bass: chord.bass && move(chord.bass)}))
}

/** Semitones from `from` up to `to`, as the shortest move: -5…+6. */
export function semitoneShift(from: NoteName, to: NoteName): number {
    const up = mod12(chroma(to) - chroma(from))
    return up > 6 ? up - 12 : up
}

export interface CapoOption {
    capo: number
    /** The chords as fingered with the capo on: the shapes you actually play. */
    shapes: SongChord[]
    /** How many shapes are open chords (easy) — the main ranking criterion. */
    openCount: number
    /** Shapes with no diagram at all. */
    missingCount: number
}

function hasOpenShape(chord: SongChord): boolean {
    if (chord.bass) {
        return OPEN_SLASH_VOICINGS.some(def => def.type === chord.type && isSamePitchClass(def.root, chord.root) && isSamePitchClass(def.bass, chord.bass!))
    }
    return OPEN_VOICINGS.some(def => def.type === chord.type && isSamePitchClass(def.root, chord.root))
}

function hasAnyShape(chord: SongChord): boolean {
    return (chord.bass ? slashVoicings(chord.root, chord.type, chord.bass) : getVoicings(chord.root, chord.type)).length > 0
}

/** Spells a shape the way chord charts do (Bb, not A#), since it names a fingering, not a sounding pitch. */
function shapeNote(note: NoteName, capo: number): NoteName {
    return ROOT_NOTES[mod12(chroma(note) - capo)] ?? note
}

/**
 * Every capo position from 0 to `maxCapo`, ranked by how many chords become open shapes.
 * Ties go to the lower capo.
 */
export function capoOptions(chords: SongChord[], maxCapo = 7): CapoOption[] {
    const options = Array.from({length: maxCapo + 1}, (_, capo) => {
        const shapes = chords.map(chord => ({...chord, root: shapeNote(chord.root, capo), bass: chord.bass && shapeNote(chord.bass, capo)}))
        const unique = uniqueChords(shapes)
        return {
            capo,
            shapes,
            openCount: unique.filter(hasOpenShape).length,
            missingCount: unique.filter(chord => !hasAnyShape(chord)).length,
        }
    })
    return options.sort((a, b) => b.openCount - a.openCount || a.missingCount - b.missingCount || a.capo - b.capo)
}

/** First occurrence of each distinct chord, in order. */
export function uniqueChords(chords: SongChord[]): SongChord[] {
    const seen = new Set<string>()
    return chords.filter(chord => {
        const key = `${chroma(chord.root)}-${chord.type}-${chord.bass ? chroma(chord.bass) : ""}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
    })
}

