import type {ChordCategory, ChordTypeDef} from "@/types/music"

export const CHORD_CATEGORIES: ChordCategory[] = ["triad", "sus", "sixth", "seventh", "extended", "power"]

export const CHORD_TYPES: ChordTypeDef[] = [
    {symbol: "M", suffix: "", category: "triad"},
    {symbol: "m", suffix: "m", category: "triad"},
    {symbol: "dim", suffix: "dim", category: "triad"},
    {symbol: "aug", suffix: "aug", category: "triad"},

    {symbol: "sus2", suffix: "sus2", category: "sus"},
    {symbol: "sus4", suffix: "sus4", category: "sus"},
    {symbol: "7sus4", suffix: "7sus4", category: "sus"},
    {symbol: "9sus4", suffix: "9sus4", category: "sus"},

    {symbol: "6", suffix: "6", category: "sixth"},
    {symbol: "m6", suffix: "m6", category: "sixth"},
    {symbol: "add9", suffix: "add9", category: "sixth"},
    {symbol: "madd9", suffix: "m(add9)", category: "sixth"},
    {symbol: "69", suffix: "6/9", category: "sixth"},

    {symbol: "7", suffix: "7", category: "seventh"},
    {symbol: "maj7", suffix: "maj7", category: "seventh"},
    {symbol: "m7", suffix: "m7", category: "seventh"},
    {symbol: "m7b5", suffix: "m7♭5", category: "seventh"},
    {symbol: "dim7", suffix: "dim7", category: "seventh"},
    {symbol: "mMaj7", suffix: "m(maj7)", category: "seventh"},
    {symbol: "7#5", suffix: "7♯5", category: "seventh"},
    {symbol: "7b5", suffix: "7♭5", category: "seventh"},

    {symbol: "9", suffix: "9", category: "extended"},
    {symbol: "maj9", suffix: "maj9", category: "extended"},
    {symbol: "m9", suffix: "m9", category: "extended"},
    {symbol: "7b9", suffix: "7♭9", category: "extended"},
    {symbol: "7#9", suffix: "7♯9", category: "extended"},
    {symbol: "11", suffix: "11", category: "extended"},
    {symbol: "m11", suffix: "m11", category: "extended"},
    {symbol: "maj7#11", suffix: "maj7♯11", category: "extended"},
    {symbol: "13", suffix: "13", category: "extended"},
    {symbol: "maj13", suffix: "maj13", category: "extended"},
    {symbol: "m13", suffix: "m13", category: "extended"},

    {symbol: "5", suffix: "5", category: "power"},
]

export function findChordType(symbol: string): ChordTypeDef | undefined {
    return CHORD_TYPES.find(type => type.symbol === symbol)
}
