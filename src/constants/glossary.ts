export type GlossaryGroup = "basics" | "intervals" | "chords" | "guitar" | "keys" | "harmony"

export const GLOSSARY_GROUPS: GlossaryGroup[] = ["basics", "intervals", "chords", "guitar", "keys", "harmony"]

/** A short sound clip next to a definition: one strum, a run of single notes, or a few chords in a row. */
export type GlossaryExample =
    | {kind: "strum" | "arpeggio"; notes: string[]}
    | {kind: "sequence"; chords: string[][]}

export interface GlossaryTerm {
    /** i18n key in the `glossary` namespace and the `[[id|text]]` marker used in other texts. */
    id: string
    group: GlossaryGroup
    example?: GlossaryExample
    /** Page of the site where the idea can be seen in action. */
    link?: string
}

const C_MAJOR = ["C3", "E3", "G3", "C4", "E4"]
const G7 = ["G2", "B2", "D3", "F3", "B3", "G4"]

export const GLOSSARY_TERMS: GlossaryTerm[] = [
    {id: "note", group: "basics", example: {kind: "arpeggio", notes: ["C4", "D4", "E4", "F4", "G4", "A4", "B4"]}},
    {id: "semitone", group: "basics", example: {kind: "arpeggio", notes: ["C4", "C#4", "D4"]}},
    {id: "octave", group: "basics", example: {kind: "arpeggio", notes: ["C3", "C4", "C5"]}},
    {id: "interval", group: "basics", example: {kind: "arpeggio", notes: ["C4", "E4", "C4", "G4"]}},
    {id: "root", group: "basics", link: "/chords"},
    {id: "degree", group: "basics", link: "/scales"},

    {id: "third", group: "intervals", example: {kind: "arpeggio", notes: ["C4", "E4", "C4", "Eb4"]}},
    {id: "fifth", group: "intervals", example: {kind: "arpeggio", notes: ["C4", "G4"]}},
    {id: "seventh", group: "intervals", example: {kind: "arpeggio", notes: ["C4", "Bb4", "C4", "B4"]}},
    {id: "extension", group: "intervals", example: {kind: "strum", notes: ["C3", "E3", "Bb3", "D4", "G4"]}, link: "/chords?filter=extended"},

    {id: "chord", group: "chords", example: {kind: "strum", notes: C_MAJOR}, link: "/chords"},
    {id: "triad", group: "chords", example: {kind: "strum", notes: ["C3", "E3", "G3"]}, link: "/chords?filter=triad"},
    {id: "major", group: "chords", example: {kind: "strum", notes: ["C3", "G3", "C4", "E4", "G4"]}, link: "/chords?filter=triad"},
    {id: "minor", group: "chords", example: {kind: "strum", notes: ["C3", "G3", "C4", "Eb4", "G4"]}, link: "/chords?filter=triad"},
    {id: "diminished", group: "chords", example: {kind: "strum", notes: ["C3", "Gb3", "C4", "Eb4"]}, link: "/chords?filter=triad"},
    {id: "augmented", group: "chords", example: {kind: "strum", notes: ["C3", "G#3", "C4", "E4"]}, link: "/chords?filter=triad"},
    {id: "sus", group: "chords", example: {kind: "sequence", chords: [["C3", "G3", "C4", "F4", "G4"], ["C3", "G3", "C4", "E4", "G4"]]}, link: "/chords?filter=sus"},
    {id: "seventhChord", group: "chords", example: {kind: "strum", notes: ["C3", "G3", "Bb3", "E4", "G4"]}, link: "/chords?filter=seventh"},
    {id: "powerChord", group: "chords", example: {kind: "strum", notes: ["E2", "B2", "E3"]}, link: "/chords?filter=power"},
    {id: "inversion", group: "chords", example: {kind: "sequence", chords: [["C3", "E3", "G3", "C4"], ["E2", "C3", "E3", "G3", "C4"], ["G2", "C3", "E3", "G3", "C4"]]}, link: "/chords?filter=slash"},
    {id: "slashChord", group: "chords", example: {kind: "strum", notes: ["E2", "C3", "E3", "G3", "C4", "E4"]}, link: "/chords?filter=slash"},

    {id: "fret", group: "guitar"},
    {id: "openChord", group: "guitar", example: {kind: "strum", notes: C_MAJOR}, link: "/chords?filter=open"},
    {id: "barre", group: "guitar", example: {kind: "strum", notes: ["F2", "C3", "F3", "A3", "C4", "F4"]}, link: "/chords/F/M"},
    {id: "movableShape", group: "guitar", link: "/chords?filter=open&mobility=movable"},
    {id: "cagedShape", group: "guitar", link: "/chords/C/M"},
    {id: "capo", group: "guitar", link: "/song"},

    {id: "scale", group: "keys", example: {kind: "arpeggio", notes: ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"]}, link: "/scales"},
    {id: "key", group: "keys", link: "/progressions"},
    {id: "keySignature", group: "keys", link: "/circle"},
    {id: "circleOfFifths", group: "keys", link: "/circle"},
    {id: "transposition", group: "keys", example: {kind: "sequence", chords: [["C3", "E3", "G3", "C4", "E4"], ["D3", "A3", "D4", "F#4"]]}, link: "/song"},
    {id: "mode", group: "keys", example: {kind: "sequence", chords: [["C3", "G3", "C4", "E4", "G4"], ["C3", "G3", "C4", "Eb4", "G4"]]}, link: "/scales"},
    {id: "pentatonic", group: "keys", example: {kind: "arpeggio", notes: ["A3", "C4", "D4", "E4", "G4", "A4"]}, link: "/scales?scale=minorPentatonic"},
    {id: "harmonicMinor", group: "keys", example: {kind: "arpeggio", notes: ["A3", "B3", "C4", "D4", "E4", "F4", "G#4", "A4"]}, link: "/scales?scale=harmonicMinor"},
    {id: "relativeKey", group: "keys", example: {kind: "sequence", chords: [C_MAJOR, ["A2", "E3", "A3", "C4", "E4"]]}, link: "/progressions"},
    {id: "parallelKey", group: "keys", example: {kind: "sequence", chords: [C_MAJOR, ["C3", "G3", "C4", "Eb4", "G4"]]}, link: "/progressions"},

    {id: "diatonic", group: "harmony", link: "/progressions"},
    {id: "romanNumerals", group: "harmony", link: "/progressions"},
    {id: "progression", group: "harmony", example: {kind: "sequence", chords: [C_MAJOR, ["G2", "B2", "D3", "G3", "B3"], ["A2", "E3", "A3", "C4", "E4"], ["F2", "C3", "F3", "A3", "C4"]]}, link: "/progressions"},
    {id: "harmonicFunction", group: "harmony", link: "/progressions"},
    {id: "tonic", group: "harmony", example: {kind: "strum", notes: C_MAJOR}, link: "/progressions"},
    {id: "subdominant", group: "harmony", example: {kind: "sequence", chords: [C_MAJOR, ["F2", "C3", "F3", "A3", "C4"]]}, link: "/progressions"},
    {id: "dominant", group: "harmony", example: {kind: "sequence", chords: [G7, C_MAJOR]}, link: "/progressions"},
    {id: "secondaryDominant", group: "harmony", example: {kind: "sequence", chords: [["A2", "E3", "G3", "C#4", "E4"], ["D3", "A3", "D4", "F4"]]}, link: "/progressions"},
    {id: "borrowedChord", group: "harmony", example: {kind: "sequence", chords: [C_MAJOR, ["F2", "C3", "F3", "A3", "C4"], ["F2", "C3", "F3", "Ab3", "C4"], C_MAJOR]}, link: "/progressions"},
]

export function findGlossaryTerm(id: string): GlossaryTerm | undefined {
    return GLOSSARY_TERMS.find(term => term.id === id)
}
