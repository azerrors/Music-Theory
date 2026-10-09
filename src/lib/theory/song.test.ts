import {
    analyzeChords,
    capoOptions,
    chordFit,
    detectKeys,
    findPreset,
    parseChordList,
    semitoneShift,
    transposeChords,
    uniqueChords,
    type SongChord,
} from "@/lib/theory/song"

function chords(text: string): SongChord[] {
    return parseChordList(text).flatMap(token => token.chord ?? [])
}

function topKey(text: string): string {
    const [best] = detectKeys(chords(text))
    return `${best!.tonic} ${best!.mode}`
}

describe("parseChordList", () => {
    it("reads common separators and slash chords", () => {
        const parsed = parseChordList("Am | F, C – G/B")
        expect(parsed.map(token => token.chord)).toEqual([
            {root: "A", type: "m", bass: undefined},
            {root: "F", type: "M", bass: undefined},
            {root: "C", type: "M", bass: undefined},
            {root: "G", type: "M", bass: "B"},
        ])
    })

    it("accepts lower case and unicode accidentals", () => {
        expect(parseChordList("am B♭maj7 f♯m")[1]!.chord).toEqual({root: "Bb", type: "maj7", bass: undefined})
        expect(parseChordList("am")[0]!.chord?.type).toBe("m")
    })

    it("flags unknown tokens", () => {
        const [token] = parseChordList("Hello")
        expect(token!.chord).toBeUndefined()
    })

    it("simplifies symbols outside the catalogue", () => {
        const [token] = parseChordList("C7b13")
        expect(token!.chord?.type).toBe("7")
        expect(token!.simplifiedFrom).toBe("C7b13")
    })
})

describe("detectKeys", () => {
    it.each([
        ["G Em C D", "G major"],
        ["C G Am F", "C major"],
        ["Am F C G", "A minor"],
        ["Am G F E", "A minor"],
        ["Em C G D Em", "E minor"],
        ["D A Bm G", "D major"],
        ["Dm7 G7 Cmaj7", "C major"],
        ["E7 A7 E7 B7 A7 E7", "E major"],
        ["F#m D A E", "F# minor"],
        ["Bb F Gm Eb", "Bb major"],
        ["Am7 G Em C D", "G major"],
        ["Em Am B7 Em", "E minor"],
    ])("%s → %s", (song, key) => {
        expect(topKey(song)).toBe(key)
    })

    it("tolerates a borrowed chord", () => {
        expect(topKey("C F Fm C")).toBe("C major")
    })
})

describe("chordFit", () => {
    it("labels chords by where they come from", () => {
        expect(chordFit("C", "major", {root: "D", type: "m"})).toBe("diatonic")
        expect(chordFit("C", "major", {root: "A", type: "7"})).toBe("secondary")
        expect(chordFit("C", "major", {root: "Bb", type: "M"})).toBe("borrowed")
        expect(chordFit("A", "minor", {root: "E", type: "7"})).toBe("harmonic")
        expect(chordFit("C", "major", {root: "F#", type: "M"})).toBe("outside")
        expect(chordFit("E", "major", {root: "A", type: "7"})).toBe("blues")
    })
})

describe("analyzeChords", () => {
    it("gives numerals and functions", () => {
        const result = analyzeChords("G", "major", chords("G Em C D/F#"))
        expect(result.map(item => item.roman)).toEqual(["I", "vi", "IV", "V/3"])
        expect(result.map(item => item.fn)).toEqual(["tonic", "tonic", "subdominant", "dominant"])
    })
})

describe("findPreset", () => {
    it("recognises a rotated progression", () => {
        expect(findPreset("C", "major", chords("Am F C G"))?.id).toBe("sensitive")
        expect(findPreset("G", "major", chords("G D Em C"))?.id).toBe("pop")
    })

    it("ignores chord colours", () => {
        expect(findPreset("C", "major", chords("Dm7 G7 Cmaj7"))?.id).toBe("jazzTwoFiveOne")
    })

    it("returns nothing for an unknown progression", () => {
        expect(findPreset("C", "major", chords("C Dm Em F"))).toBeUndefined()
    })
})

describe("transposition", () => {
    it("moves every chord and the bass", () => {
        expect(transposeChords(chords("G D/F# Em C"), "G", "A")).toEqual([
            {root: "A", type: "M", bass: undefined},
            {root: "E", type: "M", bass: "G#"},
            {root: "F#", type: "m", bass: undefined},
            {root: "D", type: "M", bass: undefined},
        ])
    })

    it("measures the shortest shift", () => {
        expect(semitoneShift("G", "A")).toBe(2)
        expect(semitoneShift("C", "A")).toBe(-3)
    })
})

describe("capoOptions", () => {
    it("finds G shapes for a song in A", () => {
        const [best] = capoOptions(chords("A E F#m D"))
        expect(best!.capo).toBe(2)
        expect(best!.shapes.map(chord => chord.root + chord.type)).toEqual(["GM", "DM", "Em", "CM"])
        expect(best!.openCount).toBe(4)
    })

    it("prefers no capo when the chords are already open", () => {
        expect(capoOptions(chords("C G Am F"))[0]!.capo).toBe(0)
    })

    it("names shapes with chart spellings", () => {
        const option = capoOptions(chords("Eb"))[0]!
        expect(["C", "D", "E", "G", "A"]).toContain(option.shapes[0]!.root)
    })
})

describe("uniqueChords", () => {
    it("keeps the first of each chord", () => {
        expect(uniqueChords(chords("C G C Am G")).map(chord => chord.root)).toEqual(["C", "G", "A"])
    })
})
