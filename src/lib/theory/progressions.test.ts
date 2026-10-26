import {Chord} from "tonal"
import {ROOT_NOTES} from "@/constants/notes"
import {chroma} from "@/lib/theory/notes"
import {
    chordAlternatives,
    chordRoman,
    chromaticChords,
    diatonicChords,
    harmonicFunction,
    keyScale,
    PROGRESSION_PRESETS,
    presetSteps,
    resolveBass,
    resolveStep,
    romanNumeral,
    slashAlternatives,
    stepFor,
} from "@/lib/theory/progressions"
import {slashVoicings} from "@/lib/theory/slash"
import {getVoicings} from "@/lib/theory/voicings"

const label = (tonic: string, root: string, type: string) => romanNumeral(tonic, root, type)

describe("romanNumeral", () => {
    it.each([
        ["C", "D", "m7", "ii7"],
        ["C", "G", "7", "V7"],
        ["C", "B", "dim", "vii°"],
        ["C", "B", "m7b5", "viiø7"],
        ["C", "Bb", "M", "♭VII"],
        ["A", "F", "M", "♭VI"],
        ["A", "G#", "dim7", "vii°7"],
        ["C", "C", "maj7", "Imaj7"],
    ])("%s key: %s%s → %s", (tonic, root, type, roman) => {
        expect(label(tonic, root, type)).toBe(roman)
    })

    it("gives third-less chords the case of their degree", () => {
        expect(romanNumeral("C", "A", "sus4", "major")).toBe("visus4")
        expect(romanNumeral("C", "G", "sus4", "major")).toBe("Vsus4")
    })
})

describe("diatonicChords", () => {
    it("builds the major-key triads", () => {
        expect(diatonicChords("C", "major").map(chord => chord.roman)).toEqual(["I", "ii", "iii", "IV", "V", "vi", "vii°"])
    })

    it("builds the natural-minor sevenths", () => {
        expect(diatonicChords("A", "minor", true).map(chord => chord.roman))
            .toEqual(["i7", "iiø7", "♭IIImaj7", "iv7", "v7", "♭VImaj7", "♭VII7"])
    })
})

describe("presets", () => {
    it.each(PROGRESSION_PRESETS)("$id resolves in every key", preset => {
        for (const tonic of ROOT_NOTES) {
            const steps = presetSteps(preset, tonic)
            expect(steps).toHaveLength(preset.steps.length)
            for (const step of steps) {
                expect(Chord.getChord(step.type, resolveStep(tonic, step)).empty, `${preset.id} in ${tonic}`).toBe(false)
            }
        }
    })

    it.each(PROGRESSION_PRESETS)("$id has a chord diagram for every step in every key", preset => {
        for (const tonic of ROOT_NOTES) {
            for (const step of presetSteps(preset, tonic)) {
                const root = resolveStep(tonic, step)
                const bass = resolveBass(tonic, step)
                const voicings = bass ? slashVoicings(root, step.type, bass) : getVoicings(root, step.type)
                expect(voicings.length, `${preset.id} in ${tonic}: ${root}${step.type}/${bass ?? ""}`).toBeGreaterThan(0)
            }
        }
    })

    it("spells the Canon with its walking bass in C", () => {
        const canon = PROGRESSION_PRESETS.find(preset => preset.id === "canon")!
        const chords = presetSteps(canon, "C").map(step => {
            const bass = resolveBass("C", step)
            return resolveStep("C", step) + step.type + (bass ? `/${bass}` : "")
        })
        expect(chords).toEqual(["CM", "GM/B", "Am", "Em/G", "FM", "CM/E", "FM", "GM"])
    })

    it("spells I–V–vi–IV in G", () => {
        const pop = PROGRESSION_PRESETS.find(preset => preset.id === "pop")!
        const chords = presetSteps(pop, "G").map(step => resolveStep("G", step) + step.type)
        expect(chords).toEqual(["GM", "DM", "Em", "CM"])
    })

    it.each([
        ["ragtime", "C", "major", ["V7/vi", "V7/ii", "V7/V", "V7", "I"]],
        ["gospel", "C", "major", ["I", "I7", "IV", "iv"]],
        ["backdoor", "C", "major", ["Imaj7", "iv7", "♭VII7", "Imaj7"]],
        ["phrygian", "E", "minor", ["i", "♭II", "♭III", "♭II"]],
        ["dorianVamp", "A", "minor", ["i7", "IV", "i7", "IV"]],
    ] as const)("labels the %s progression in %s %s", (id, tonic, mode, romans) => {
        const preset = PROGRESSION_PRESETS.find(item => item.id === id)!
        const labels = presetSteps(preset, tonic).map(step => chordRoman(tonic, mode, resolveStep(tonic, step), step.type))
        expect(labels).toEqual(romans)
    })

    it("uses the major V from harmonic minor in the Andalusian cadence", () => {
        const andalusian = PROGRESSION_PRESETS.find(preset => preset.id === "andalusian")!
        const last = presetSteps(andalusian, "A").at(-1)!
        expect(resolveStep("A", last)).toBe("E")
        expect(last.type).toBe("M")
    })
})

describe("chordAlternatives", () => {
    it("keeps diatonic alternatives inside the key", () => {
        const scale = keyScale("D", "major").map(chroma)
        const diatonic = chordAlternatives("D", "major", "A").filter(chord => chord.source === "diatonic")
        expect(diatonic.map(chord => chord.type)).toEqual(expect.arrayContaining(["M", "7", "sus4", "9"]))
        for (const chord of diatonic) {
            for (const note of Chord.getChord(chord.type, chord.root).notes) expect(scale).toContain(chroma(note))
        }
    })

    it("offers the borrowed iv in a major key", () => {
        const iv = chordAlternatives("C", "major", "F").find(chord => chord.type === "m")
        expect(iv).toMatchObject({source: "borrowed", roman: "iv"})
    })

    it("offers a secondary dominant on vi", () => {
        const a7 = chordAlternatives("C", "major", "A").find(chord => chord.type === "7")
        expect(a7).toMatchObject({source: "secondary", roman: "V7/ii"})
    })

    it("offers the harmonic-minor V7 in a minor key", () => {
        const e7 = chordAlternatives("A", "minor", "E").find(chord => chord.type === "7")
        expect(e7?.source).toBe("harmonic")
    })
})

describe("chromaticChords", () => {
    it("lists secondary dominants and borrowed chords of C major", () => {
        const romans = chromaticChords("C", "major").map(chord => chord.roman)
        expect(romans).toEqual(expect.arrayContaining(["V7/V", "V7/vi", "iv", "♭VII", "♭VI"]))
        expect(romans).not.toContain("IV")
    })

    it("lists the harmonic V and vii°7 in A minor", () => {
        const romans = chromaticChords("A", "minor").map(chord => chord.roman)
        expect(romans).toEqual(expect.arrayContaining(["V", "V7", "vii°7"]))
    })
})

describe("slash chords in a key", () => {
    it("labels inversions with the bass degree", () => {
        expect(chordRoman("C", "major", "G", "M", "B")).toBe("V/3")
        expect(chordRoman("A", "minor", "A", "m", "G")).toBe("i/♭7")
    })

    it("reads a 7th on the tonic as I7, as in the blues", () => {
        expect(chordRoman("C", "major", "C", "7")).toBe("I7")
    })

    it("offers the inversions of a step", () => {
        expect(slashAlternatives("C", "major", "C", "M").map(chord => chord.bass)).toEqual(["E", "G"])
    })

    it("round-trips a slash chord through a step", () => {
        const step = stepFor("C", {root: "G", type: "M", bass: "B"})
        expect(resolveStep("C", step)).toBe("G")
        expect(resolveBass("C", step)).toBe("B")
    })
})

describe("harmonicFunction", () => {
    it.each([
        ["C", "major", "C", "M", "tonic"],
        ["C", "major", "A", "m", "tonic"],
        ["C", "major", "F", "M", "subdominant"],
        ["C", "major", "D", "m", "subdominant"],
        ["C", "major", "G", "7", "dominant"],
        ["C", "major", "E", "7", "dominant"],
        ["C", "major", "C", "7", "tonic"],
        ["A", "minor", "F", "M", "subdominant"],
        ["A", "minor", "E", "M", "dominant"],
    ] as const)("%s %s: %s%s → %s", (tonic, mode, root, type, fn) => {
        expect(harmonicFunction(tonic, mode, root, type)).toBe(fn)
    })
})
