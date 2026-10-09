import type {ScaleDef, ScaleGroup} from "@/types/music"

export const SCALE_GROUPS: ScaleGroup[] = ["basic", "pentatonic", "mode", "minorVariant"]

export const SCALES: ScaleDef[] = [
    {id: "major", name: "major", group: "basic"},
    {id: "minor", name: "minor", group: "basic"},

    {id: "majorPentatonic", name: "major pentatonic", group: "pentatonic"},
    {id: "minorPentatonic", name: "minor pentatonic", group: "pentatonic"},
    {id: "blues", name: "blues", group: "pentatonic"},

    {id: "ionian", name: "ionian", group: "mode"},
    {id: "dorian", name: "dorian", group: "mode"},
    {id: "phrygian", name: "phrygian", group: "mode"},
    {id: "lydian", name: "lydian", group: "mode"},
    {id: "mixolydian", name: "mixolydian", group: "mode"},
    {id: "aeolian", name: "aeolian", group: "mode"},
    {id: "locrian", name: "locrian", group: "mode"},

    {id: "harmonicMinor", name: "harmonic minor", group: "minorVariant"},
    {id: "melodicMinor", name: "melodic minor", group: "minorVariant"},
]

export function findScale(id: string): ScaleDef | undefined {
    return SCALES.find(scale => scale.id === id)
}
