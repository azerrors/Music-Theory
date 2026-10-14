import {describe, expect, it} from "vitest"
import {bassMidi, commonTones, movement, rightHandCandidates, soloKeys, voiceProgression} from "@/lib/piano/progressions"
import {getChordInfo} from "@/lib/theory/chords"

const chord = (root: string, type: string, bass?: string) => getChordInfo(root, type, bass)!

describe("voiceProgression", () => {
    it("voices I – IV – V the textbook way: C E G → C F A → B D G", () => {
        const voiced = voiceProgression([chord("C", "M"), chord("F", "M"), chord("G", "M")], "smooth")
        expect(voiced.map(item => item.right)).toEqual([[60, 64, 67], [60, 65, 69], [59, 62, 67]])
    })

    it("keeps every chord in root position when asked", () => {
        const voiced = voiceProgression([chord("C", "M"), chord("F", "M"), chord("G", "M")], "root")
        expect(voiced.map(item => item.right)).toEqual([[60, 64, 67], [65, 69, 72], [55, 59, 62]])
    })

    it("moves the hand less with smooth voicing", () => {
        const chords = [chord("A", "m"), chord("F", "M"), chord("C", "M"), chord("G", "M")]
        const total = (style: "smooth" | "root") => {
            const voiced = voiceProgression(chords, style)
            return voiced.slice(1).reduce((sum, item, index) => sum + movement(voiced[index]!.right, item.right), 0)
        }
        expect(total("smooth")).toBeLessThan(total("root"))
    })

    it("plays the root, or the slash bass, in the left hand", () => {
        const voiced = voiceProgression([chord("C", "M"), chord("C", "M", "E")], "smooth")
        expect(voiced.map(item => item.left)).toEqual([[48], [40]])
    })

    it("leaves the root of big chords to the left hand", () => {
        const [voiced] = voiceProgression([chord("C", "9")], "smooth")
        expect(voiced!.right.map(note => note % 12).sort((a, b) => a - b)).toEqual([2, 4, 7, 10])
    })
})

describe("rightHandCandidates", () => {
    it("lists every inversion inside the right hand's range", () => {
        const candidates = rightHandCandidates(chord("C", "M"))
        expect(candidates).toContainEqual([60, 64, 67])
        expect(candidates).toContainEqual([64, 67, 72])
        expect(candidates).toContainEqual([55, 60, 64])
        expect(candidates.every(voicing => voicing[0]! >= 53 && voicing[voicing.length - 1]! <= 81)).toBe(true)
    })
})

describe("commonTones", () => {
    it("finds the keys held over", () => {
        expect(commonTones([60, 64, 67], [60, 65, 69])).toEqual([60])
        expect(commonTones(undefined, [60, 64, 67])).toEqual([])
    })
})

describe("bassMidi", () => {
    it("keeps the bass between E2 and E♭3", () => {
        expect(bassMidi(chord("E", "M"))).toBe(40)
        expect(bassMidi(chord("D", "M"))).toBe(50)
    })
})

describe("soloKeys", () => {
    it("tags chord tones, outside notes and passing scale notes", () => {
        // E7 over A minor: G♯ is a chord tone that isn't in the scale.
        const keys = soloKeys(["A", "B", "C", "D", "E", "F", "G"], chord("E", "7"), 64, 71)
        expect(keys.map(key => key.role)).toEqual(["chordRoot", "scale", "scale", "outside", "scale", "chordTone"])
    })
})
