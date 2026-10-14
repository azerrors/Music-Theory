/**
 * Standard one-octave scale fingerings, ascending, root to root (8 notes). Descending uses the
 * same fingers in reverse. 1 = thumb … 5 = little finger. Sources: the ABRSM / Hanon fingerings
 * every method book repeats; the rule behind them is that the thumb never lands on a black key.
 *
 * Natural and harmonic minor share one table: the raised 7th never puts a thumb on a black key.
 */
export interface ScaleFingering {
    right: number[]
    left: number[]
}

export const FINGERED_SCALES = ["major", "minor", "harmonicMinor"] as const
export type FingeredScale = (typeof FINGERED_SCALES)[number]

/** C, G, D, A, E majors and their minors: three fingers, then four. */
const STANDARD: ScaleFingering = {right: [1, 2, 3, 1, 2, 3, 4, 5], left: [5, 4, 3, 2, 1, 3, 2, 1]}
const F_FAMILY: ScaleFingering = {right: [1, 2, 3, 4, 1, 2, 3, 4], left: [5, 4, 3, 2, 1, 3, 2, 1]}
const B_FAMILY: ScaleFingering = {right: [1, 2, 3, 1, 2, 3, 4, 5], left: [4, 3, 2, 1, 4, 3, 2, 1]}

/** Keyed by the root's pitch class (0 = C), so C♯ and D♭ share a fingering. */
const MAJOR: Record<number, ScaleFingering> = {
    0: STANDARD,
    1: {right: [2, 3, 1, 2, 3, 4, 1, 2], left: [3, 2, 1, 4, 3, 2, 1, 3]},
    2: STANDARD,
    3: {right: [3, 1, 2, 3, 4, 1, 2, 3], left: [3, 2, 1, 4, 3, 2, 1, 3]},
    4: STANDARD,
    5: F_FAMILY,
    6: {right: [2, 3, 4, 1, 2, 3, 1, 2], left: [4, 3, 2, 1, 3, 2, 1, 4]},
    7: STANDARD,
    8: {right: [3, 4, 1, 2, 3, 1, 2, 3], left: [3, 2, 1, 4, 3, 2, 1, 3]},
    9: STANDARD,
    10: {right: [4, 1, 2, 3, 1, 2, 3, 4], left: [3, 2, 1, 4, 3, 2, 1, 3]},
    11: B_FAMILY,
}

const MINOR: Record<number, ScaleFingering> = {
    0: STANDARD,
    1: {right: [3, 4, 1, 2, 3, 1, 2, 3], left: [3, 2, 1, 4, 3, 2, 1, 3]},
    2: STANDARD,
    3: {right: [3, 1, 2, 3, 4, 1, 2, 3], left: [2, 1, 4, 3, 2, 1, 3, 2]},
    4: STANDARD,
    5: F_FAMILY,
    6: {right: [3, 4, 1, 2, 3, 1, 2, 3], left: [4, 3, 2, 1, 3, 2, 1, 4]},
    7: STANDARD,
    8: {right: [3, 4, 1, 2, 3, 1, 2, 3], left: [3, 2, 1, 3, 2, 1, 4, 3]},
    9: STANDARD,
    10: {right: [4, 1, 2, 3, 1, 2, 3, 4], left: [2, 1, 3, 2, 1, 4, 3, 2]},
    11: B_FAMILY,
}

const FINGERINGS: Record<FingeredScale, Record<number, ScaleFingering>> = {
    major: MAJOR,
    minor: MINOR,
    harmonicMinor: MINOR,
}

export function isFingeredScale(id: string): id is FingeredScale {
    return (FINGERED_SCALES as readonly string[]).includes(id)
}

/** Null for scales without a standard fingering (pentatonics, modes, melodic minor). */
export function scaleFingering(scaleId: string, rootPitchClass: number): ScaleFingering | null {
    if (!isFingeredScale(scaleId)) return null
    return FINGERINGS[scaleId][((rootPitchClass % 12) + 12) % 12] ?? null
}
