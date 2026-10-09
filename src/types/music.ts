/** Pitch class spelled with letter + accidentals, e.g. "C", "F#", "Bb". */
export type NoteName = string

/** Scientific pitch notation, e.g. "E2", "G#3". */
export type PitchName = string

export type Notation = "letter" | "solfege"

/** A fret value per string: `null` = muted, `0` = open string. */
export type Fret = number | null

/** Strings are indexed from the lowest-pitched string (0) to the highest (5). */
export type StringIndex = number

export type VoicingShape = "open" | "E" | "A" | "D" | "C" | "G" | "slash6" | "slash5" | "slash4"

export interface Barre {
    fret: number
    fromString: StringIndex
    toString: StringIndex
}

export interface Voicing {
    id: string
    shape: VoicingShape
    /** Low string → high string. */
    frets: Fret[]
    /** Finger numbers (1 = index … 4 = pinky); `null` for open/muted strings. */
    fingers: (number | null)[]
    barre?: Barre
}

export type ChordCategory = "triad" | "sus" | "sixth" | "seventh" | "extended" | "power"

export interface ChordTypeDef {
    /** Tonal chord-type alias, also used as the URL slug. */
    symbol: string
    /** Suffix shown after the root, e.g. "" for major, "m7" for minor seventh. */
    suffix: string
    category: ChordCategory
}

export type ScaleGroup = "basic" | "pentatonic" | "mode" | "minorVariant"

export interface ScaleDef {
    /** Tonal scale name, e.g. "major pentatonic". */
    name: string
    /** URL slug and i18n key. */
    id: string
    group: ScaleGroup
}

export interface Tuning {
    id: string
    /** Low string → high string. */
    strings: PitchName[]
}
