import {Chord, Interval, Key, Note} from "tonal"
import {CHORD_TYPES, findChordType} from "@/constants/chordTypes"
import {intervalToDegree, parseChordSymbol} from "@/lib/theory/chords"
import {chroma} from "@/lib/theory/notes"
import {inversionBasses} from "@/lib/theory/slash"
import type {NoteName} from "@/types/music"

export type KeyMode = "major" | "minor"

export const KEY_MODES: KeyMode[] = ["major", "minor"]

/**
 * Where a chord comes from relative to the key:
 * - diatonic: built only from the key's own scale
 * - secondary: a dominant 7th that resolves to a diatonic chord (V7/x)
 * - harmonic: needs the raised 7th of harmonic minor (minor keys only)
 * - borrowed: taken from the parallel key (C major ↔ C minor)
 */
export type ChordSource = "diatonic" | "secondary" | "harmonic" | "borrowed"

export interface KeyChord {
    root: NoteName
    /** Catalogue chord-type symbol, see `CHORD_TYPES`. */
    type: string
    /** Roman numeral relative to the tonic, e.g. "ii7", "♭VII", "V7/vi". */
    roman: string
    source: ChordSource
    /** Slash chords only: the bass note under the chord. */
    bass?: NoteName
}

/** What a chord does in the key: tonic = home, subdominant = moving away, dominant = tension that wants to resolve home. */
export type HarmonicFunction = "tonic" | "subdominant" | "dominant"

/** One step of a progression, stored relative to the tonic so it transposes with the key. */
export interface ProgressionStep {
    /** Tonal interval from the tonic to the chord root, e.g. "1P", "7m". */
    interval: string
    type: string
    /** Slash chords only: tonal interval from the tonic to the bass note. */
    bass?: string
}

export interface ProgressionPreset {
    id: string
    mode: KeyMode
    /**
     * Degree tokens: "1"…"7", flats as "b3", "b6", "b7"; an optional type overrides the diatonic triad.
     * The optional bass is a degree token measured from the chord root: ["5", undefined, "3"] = V with its 3rd in the bass (G/B in C).
     */
    steps: [degree: string, type?: string, bass?: string][]
}

const DEGREE_INTERVALS: Record<string, string> = {
    "1": "1P", "b2": "2m", "2": "2M", "b3": "3m", "3": "3M", "4": "4P", "#4": "4A",
    "b5": "5d", "5": "5P", "b6": "6m", "6": "6M", "b7": "7m", "7": "7M",
}

const NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII"]

export const PROGRESSION_PRESETS: ProgressionPreset[] = [
    {id: "pop", mode: "major", steps: [["1"], ["5"], ["6"], ["4"]]},
    {id: "fifties", mode: "major", steps: [["1"], ["6"], ["4"], ["5"]]},
    {id: "threeChord", mode: "major", steps: [["1"], ["4"], ["5"], ["1"]]},
    {id: "jazzTwoFiveOne", mode: "major", steps: [["2", "m7"], ["5", "7"], ["1", "maj7"]]},
    {id: "sensitive", mode: "major", steps: [["6"], ["4"], ["1"], ["5"]]},
    {id: "royalRoad", mode: "major", steps: [["4", "maj7"], ["5", "7"], ["3", "m7"], ["6", "m"]]},
    {id: "canon", mode: "major", steps: [["1"], ["5", undefined, "3"], ["6"], ["3", undefined, "b3"], ["4"], ["1", undefined, "3"], ["4"], ["5"]]},
    {id: "descendingBass", mode: "major", steps: [["1"], ["5", undefined, "3"], ["6"], ["1", undefined, "5"], ["4"], ["1", undefined, "3"], ["2"], ["5"]]},
    {id: "mixolydianRock", mode: "major", steps: [["1"], ["b7"], ["4"], ["1"]]},
    {id: "blues", mode: "major", steps: [
        ["1", "7"], ["1", "7"], ["1", "7"], ["1", "7"],
        ["4", "7"], ["4", "7"], ["1", "7"], ["1", "7"],
        ["5", "7"], ["4", "7"], ["1", "7"], ["5", "7"],
    ]},
    {id: "rockAndRoll", mode: "major", steps: [["1"], ["4"], ["5"], ["4"]]},
    {id: "turnaround", mode: "major", steps: [["1", "maj7"], ["6", "m7"], ["2", "m7"], ["5", "7"]]},
    {id: "minorPlagal", mode: "major", steps: [["1"], ["4"], ["4", "m"], ["1"]]},
    {id: "majorThree", mode: "major", steps: [["1"], ["3", "M"], ["4"], ["4", "m"]]},
    {id: "majorTwo", mode: "major", steps: [["1"], ["2", "7"], ["4"], ["1"]]},
    {id: "gospel", mode: "major", steps: [["1"], ["1", "7"], ["4"], ["4", "m"]]},
    {id: "heroic", mode: "major", steps: [["1"], ["b6"], ["b7"], ["1"]]},
    {id: "backdoor", mode: "major", steps: [["1", "maj7"], ["4", "m7"], ["b7", "7"], ["1", "maj7"]]},
    {id: "ragtime", mode: "major", steps: [["3", "7"], ["6", "7"], ["2", "7"], ["5", "7"], ["1"]]},

    {id: "minorBasic", mode: "minor", steps: [["1"], ["4"], ["5"], ["1"]]},
    {id: "epic", mode: "minor", steps: [["1"], ["b6"], ["b3"], ["b7"]]},
    {id: "minorRock", mode: "minor", steps: [["1"], ["b7"], ["b6"], ["b7"]]},
    {id: "andalusian", mode: "minor", steps: [["1"], ["b7"], ["b6"], ["5", "M"]]},
    {id: "minorTwoFiveOne", mode: "minor", steps: [["2", "m7b5"], ["5", "7"], ["1", "m7"]]},
    {id: "circle", mode: "minor", steps: [["1", "m7"], ["4", "m7"], ["b7", "7"], ["b3", "maj7"]]},
    {id: "dramatic", mode: "minor", steps: [["1"], ["b6"], ["4"], ["5", "M"]]},
    {id: "lineCliche", mode: "minor", steps: [["1"], ["1", "m", "b7"], ["1", "m", "6"], ["b6"]]},
    {id: "minorCadence", mode: "minor", steps: [["1"], ["4"], ["5", "7"], ["1"]]},
    {id: "aeolianClimb", mode: "minor", steps: [["1"], ["b6"], ["b7"], ["1"]]},
    {id: "minorCliche", mode: "minor", steps: [["1", "m"], ["1", "mMaj7"], ["1", "m7"], ["1", "m6"]]},
    {id: "dorianVamp", mode: "minor", steps: [["1", "m7"], ["4", "M"], ["1", "m7"], ["4", "M"]]},
    {id: "phrygian", mode: "minor", steps: [["1"], ["b2", "M"], ["b3"], ["b2", "M"]]},
    {id: "minorBlues", mode: "minor", steps: [
        ["1", "m7"], ["1", "m7"], ["1", "m7"], ["1", "m7"],
        ["4", "m7"], ["4", "m7"], ["1", "m7"], ["1", "m7"],
        ["b6", "7"], ["5", "7"], ["1", "m7"], ["5", "7"],
    ]},
]

export function presetsForMode(mode: KeyMode): ProgressionPreset[] {
    return PROGRESSION_PRESETS.filter(preset => preset.mode === mode)
}

export function keyScale(tonic: NoteName, mode: KeyMode): readonly NoteName[] {
    return mode === "major" ? Key.majorKey(tonic).scale : Key.minorKey(tonic).natural.scale
}

/** Triads of the key, one per scale degree, as tonal symbols ("Dm", "Bdim"). */
function keyTriads(tonic: NoteName, mode: KeyMode): readonly string[] {
    return mode === "major" ? Key.majorKey(tonic).triads : Key.minorKey(tonic).natural.triads
}

function keySevenths(tonic: NoteName, mode: KeyMode): readonly string[] {
    return mode === "major" ? Key.majorKey(tonic).chords : Key.minorKey(tonic).natural.chords
}

const MINOR_FAMILY = new Set(["m", "m6", "m7", "m9", "m11", "m13", "madd9", "mMaj7", "dim", "dim7", "m7b5"])

/** Chords without a third; their numeral takes the case of the key's own triad on that degree. */
const THIRDLESS = new Set(["sus2", "sus4", "7sus4", "9sus4", "5"])

/**
 * Roman numeral for `type` on `root` in a key on `tonic`: ("C", "D", "m7") → "ii7", ("C", "Bb", "M") → "♭VII".
 * Pass `mode` so third-less chords follow the degree: Asus4 in C major → "visus4".
 */
export function romanNumeral(tonic: NoteName, root: NoteName, type: string, mode?: KeyMode): string {
    const interval = Interval.get(Interval.distance(tonic, root))
    const degree = interval.empty ? 0 : (interval.num - 1) % 7
    // tonal's `alt` is measured against the major/perfect interval, so ♭III, ♭VI, ♭VII come out right in minor keys too.
    const accidental = interval.alt < 0 ? "♭".repeat(-interval.alt) : "♯".repeat(Math.max(0, interval.alt))
    const numeral = NUMERALS[degree] ?? "I"

    const degreeTriad = mode && THIRDLESS.has(type)
        ? keyTriads(tonic, mode).map(parseChordSymbol).find(chord => chord && chroma(chord.root) === chroma(root))
        : undefined
    const isMinor = MINOR_FAMILY.has(type) || (!!degreeTriad && MINOR_FAMILY.has(degreeTriad.type.symbol))
    const base = isMinor ? numeral.toLowerCase() : numeral
    const suffix = findChordType(type)?.suffix ?? type
    const quality =
        type === "dim" ? "°"
            : type === "dim7" ? "°7"
                : type === "m7b5" ? "ø7"
                    : type === "aug" ? "+"
                        : MINOR_FAMILY.has(type) ? suffix.replace(/^m/, "")
                            : suffix
    return accidental + base + quality
}

export function resolveStep(tonic: NoteName, step: ProgressionStep): NoteName {
    return Note.transpose(tonic, step.interval)
}

export function resolveBass(tonic: NoteName, step: ProgressionStep): NoteName | undefined {
    return step.bass ? Note.transpose(tonic, step.bass) : undefined
}

/** Builds a step from concrete notes, e.g. G/B in C → {interval: "5P", type: "M", bass: "7M"}. */
export function stepFor(tonic: NoteName, chord: {root: NoteName; type: string; bass?: NoteName}): ProgressionStep {
    return {
        interval: Interval.distance(tonic, chord.root),
        type: chord.type,
        bass: chord.bass ? Interval.distance(tonic, chord.bass) : undefined,
    }
}

/**
 * Full label of a chord in the key: secondary dominants read "V7/ii", slash chords
 * add the bass degree from the chord root ("V/3" = G/B in C).
 */
export function chordRoman(tonic: NoteName, mode: KeyMode, root: NoteName, type: string, bass?: NoteName): string {
    const inKey = sourcePools(tonic, mode).some(pool => isSubset(chordNotes(root, type), pool.scale))
    // A 7th on the tonic (blues I7) is read as I7, not as V7/IV.
    const isTonic = chroma(root) === chroma(tonic)
    const target = type === "7" && !inKey && !isTonic ? secondaryTarget(tonic, mode, root) : undefined
    const roman = target ? `V7/${target.roman}` : romanNumeral(tonic, root, type, mode)
    return bass ? `${roman}/${intervalToDegree(Interval.distance(root, bass))}` : roman
}

const MAJOR_FUNCTIONS: HarmonicFunction[] = ["tonic", "subdominant", "tonic", "subdominant", "dominant", "tonic", "dominant"]
const MINOR_FUNCTIONS: HarmonicFunction[] = ["tonic", "subdominant", "tonic", "subdominant", "dominant", "subdominant", "dominant"]

/** Tonic, subdominant or dominant, judged by the scale degree of the root; secondary dominants count as dominant. */
export function harmonicFunction(tonic: NoteName, mode: KeyMode, root: NoteName, type: string): HarmonicFunction {
    if (chordRoman(tonic, mode, root, type).startsWith("V7/")) return "dominant"
    const interval = Interval.get(Interval.distance(tonic, root))
    const degree = interval.empty ? 0 : (interval.num - 1) % 7
    return (mode === "major" ? MAJOR_FUNCTIONS : MINOR_FUNCTIONS)[degree] ?? "tonic"
}

function toKeyChord(tonic: NoteName, symbol: string, source: ChordSource): KeyChord | null {
    const parsed = parseChordSymbol(symbol)
    if (!parsed) return null
    return {root: parsed.root, type: parsed.type.symbol, roman: romanNumeral(tonic, parsed.root, parsed.type.symbol), source}
}

/** The seven diatonic triads (or seventh chords) of a key. */
export function diatonicChords(tonic: NoteName, mode: KeyMode, sevenths = false): KeyChord[] {
    const symbols = sevenths ? keySevenths(tonic, mode) : keyTriads(tonic, mode)
    return symbols.flatMap(symbol => toKeyChord(tonic, symbol, "diatonic") ?? [])
}

/** Turns a preset into concrete, key-relative steps; steps without a type take the key's diatonic triad. */
export function presetSteps(preset: ProgressionPreset, tonic: NoteName): ProgressionStep[] {
    const triads = diatonicChords(tonic, preset.mode)
    return preset.steps.map(([degree, type, bass]) => {
        const interval = DEGREE_INTERVALS[degree] ?? "1P"
        const root = Note.transpose(tonic, interval)
        const diatonic = triads.find(chord => chroma(chord.root) === chroma(root))
        const bassNote = bass ? Note.transpose(root, DEGREE_INTERVALS[bass] ?? "1P") : undefined
        return {interval, type: type ?? diatonic?.type ?? "M", bass: bassNote ? Interval.distance(tonic, bassNote) : undefined}
    })
}

function isSubset(notes: readonly NoteName[], pool: readonly NoteName[]): boolean {
    const chromas = new Set(pool.map(chroma))
    return notes.every(note => chromas.has(chroma(note)))
}

function chordNotes(root: NoteName, type: string): NoteName[] {
    return Chord.getChord(type, root).notes
}

/** Scales the alternatives are drawn from, in order of preference. */
function sourcePools(tonic: NoteName, mode: KeyMode): {source: ChordSource; scale: readonly NoteName[]}[] {
    if (mode === "major") {
        return [
            {source: "diatonic", scale: Key.majorKey(tonic).scale},
            {source: "borrowed", scale: Key.minorKey(tonic).natural.scale},
        ]
    }
    return [
        {source: "diatonic", scale: Key.minorKey(tonic).natural.scale},
        {source: "harmonic", scale: Key.minorKey(tonic).harmonic.scale},
        {source: "borrowed", scale: Key.majorKey(tonic).scale},
    ]
}

/** If `root`7 resolves a fifth down onto a major or minor diatonic chord (not the tonic), return that chord. */
function secondaryTarget(tonic: NoteName, mode: KeyMode, root: NoteName): KeyChord | undefined {
    const target = Note.transpose(root, "4P")
    if (chroma(target) === chroma(tonic)) return undefined
    return diatonicChords(tonic, mode).find(chord => chroma(chord.root) === chroma(target) && (chord.type === "M" || chord.type === "m"))
}

/**
 * Every catalogue chord on `root` that fits the key, grouped by where it comes from.
 * Used to offer substitutes for one step of a progression: I → Imaj7, I6, Iadd9, Isus2…
 */
export function chordAlternatives(tonic: NoteName, mode: KeyMode, root: NoteName): KeyChord[] {
    const pools = sourcePools(tonic, mode)
    const result: KeyChord[] = []

    for (const type of CHORD_TYPES) {
        const notes = chordNotes(root, type.symbol)
        if (notes.length === 0) continue

        const pool = pools.find(candidate => isSubset(notes, candidate.scale))
        if (pool) {
            result.push({root, type: type.symbol, roman: romanNumeral(tonic, root, type.symbol, mode), source: pool.source})
            continue
        }

        if (type.symbol === "7") {
            const target = secondaryTarget(tonic, mode, root)
            if (target) result.push({root, type: "7", roman: `V7/${target.roman}`, source: "secondary"})
        }
    }

    const order: ChordSource[] = ["diatonic", "secondary", "harmonic", "borrowed"]
    return result.sort((a, b) => order.indexOf(a.source) - order.indexOf(b.source))
}

/**
 * Chords outside the key that still sound "at home" in it: secondary dominants
 * and chords borrowed from the parallel key (plus harmonic-minor V and vii° in minor).
 */
export function chromaticChords(tonic: NoteName, mode: KeyMode): KeyChord[] {
    const diatonic = [...diatonicChords(tonic, mode), ...diatonicChords(tonic, mode, true)]
    const isDiatonic = (chord: {root: NoteName; type: string}) =>
        diatonic.some(item => chroma(item.root) === chroma(chord.root) && item.type === chord.type)

    const secondary = diatonicChords(tonic, mode)
        .filter(chord => (chord.type === "M" || chord.type === "m") && chroma(chord.root) !== chroma(tonic))
        .flatMap(target => {
            const root = Note.transpose(target.root, "5P")
            const chord = {root: Note.simplify(root), type: "7"}
            return isDiatonic(chord) ? [] : [{...chord, roman: `V7/${target.roman}`, source: "secondary" as const}]
        })

    const parallel = mode === "major"
        ? [...Key.minorKey(tonic).natural.triads, ...Key.minorKey(tonic).natural.chords]
        : [...Key.majorKey(tonic).triads]
    const borrowed = parallel.flatMap(symbol => {
        const chord = toKeyChord(tonic, symbol, "borrowed")
        return chord && !isDiatonic(chord) ? [chord] : []
    })

    const harmonic = mode === "minor"
        ? [Key.minorKey(tonic).harmonic.triads[4], Key.minorKey(tonic).harmonic.chords[4], Key.minorKey(tonic).harmonic.chords[6]]
            .flatMap(symbol => (symbol ? toKeyChord(tonic, symbol, "harmonic") ?? [] : []))
        : []

    const unique = new Map<string, KeyChord>()
    for (const chord of [...secondary, ...harmonic, ...borrowed]) {
        const key = `${chroma(chord.root)}-${chord.type}`
        if (!unique.has(key)) unique.set(key, chord)
    }
    return [...unique.values()]
}

/** Inversions of one chord, e.g. C → C/E, C/G — the "change the bass" options of a step. */
export function slashAlternatives(tonic: NoteName, mode: KeyMode, root: NoteName, type: string): KeyChord[] {
    return inversionBasses(root, type).map(bass => ({
        root,
        type,
        bass,
        roman: chordRoman(tonic, mode, root, type, bass),
        source: isSubset([bass], keyScale(tonic, mode)) ? "diatonic" : "borrowed",
    }))
}
