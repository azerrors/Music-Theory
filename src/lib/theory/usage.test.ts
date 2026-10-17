import {chordUsage} from "@/lib/theory/usage"

const keyName = (usage: {tonic: string; mode: string}) => `${usage.tonic} ${usage.mode}`

describe("chordUsage", () => {
    it("lists C major first as the I of C major, then V of F and IV of G", () => {
        const usages = chordUsage("C", "M")
        expect(usages.slice(0, 3).map(item => [keyName(item), item.roman])).toEqual([
            ["C major", "I"],
            ["F major", "V"],
            ["G major", "IV"],
        ])
    })

    it("gives the usual neighbours: V goes home, IV and ii lead into it", () => {
        const g = chordUsage("G", "M").find(item => keyName(item) === "C major")!
        expect(g.after.map(chord => chord.root)).toEqual(["C", "A"])
        expect(g.before.map(chord => chord.root)).toEqual(expect.arrayContaining(["F", "D"]))
    })

    it("finds the progressions that use the chord", () => {
        const am = chordUsage("A", "m").find(item => keyName(item) === "C major")!
        expect(am.roman).toBe("vi")
        expect(am.presets.map(item => item.preset.id)).toContain("pop")
        expect(am.presets.find(item => item.preset.id === "pop")!.matches).toEqual([2])
    })

    it("reads E7 in A minor as the harmonic-minor V7", () => {
        const e7 = chordUsage("E", "7").find(item => keyName(item) === "A minor")!
        expect(e7).toMatchObject({roman: "V7", source: "harmonic", fn: "dominant"})
        expect(e7.after.map(chord => chord.root)).toContain("A")
    })

    it("spells the root the way the key does", () => {
        const usage = chordUsage("F#", "M").find(item => keyName(item) === "Db major")!
        expect(usage.root).toBe("Gb")
        expect(usage.roman).toBe("IV")
    })
})
