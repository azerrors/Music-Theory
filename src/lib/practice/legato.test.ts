import {STANDARD_TUNING} from "@/constants/tunings"
import {gripGroup, legatoExercise, movePlacements, positionStrings, scaleRun, stringFingers} from "@/lib/practice/legato"
import {scalePositions} from "@/lib/theory/positions"
import {getScaleInfo} from "@/lib/theory/scales"

const options = {string: 0, from: 5, to: 7, stringCount: 6}

function cMajorStrings() {
    return positionStrings(scalePositions(getScaleInfo("C", "major")!, STANDARD_TUNING)[0]!)
}

describe("gripGroup", () => {
    it("puts fingers 1, 3 and 4 a whole step then a half step apart", () => {
        expect(gripGroup("up", 0, 5).map(note => note.fret)).toEqual([5, 7, 8])
    })

    it("picks the first note, hammers up and pulls down", () => {
        expect(gripGroup("upDown", 2, 5).map(note => note.technique)).toEqual(["pick", "hammer", "hammer", "pull", "pull"])
        expect(gripGroup("skip", 2, 5).map(note => [note.finger, note.technique])).toEqual([[1, "pick"], [4, "hammer"], [3, "pull"], [4, "hammer"]])
    })
})

describe("movePlacements", () => {
    it("walks along a string and back without repeating the turn", () => {
        expect(movePlacements("alongString", options).map(at => at.fret)).toEqual([5, 6, 7, 6, 5])
    })

    it("walks down the neck when the end is below the start", () => {
        expect(movePlacements("alongString", {...options, from: 7, to: 5}).map(at => at.fret)).toEqual([7, 6, 5, 6, 7])
    })

    it("crosses all strings at one fret and comes back", () => {
        expect(movePlacements("acrossStrings", options).map(at => at.string)).toEqual([0, 1, 2, 3, 4, 5, 4, 3, 2, 1, 0])
    })

    it("climbs one fret per string on the diagonal", () => {
        expect(movePlacements("diagonal", options).slice(0, 6).map(at => [at.string, at.fret])).toEqual([[0, 5], [1, 6], [2, 7], [3, 8], [4, 9], [5, 10]])
    })

    it("zigzags across the strings while moving up the neck", () => {
        const placements = movePlacements("zigzag", options)
        expect(placements).toHaveLength(18)
        expect(placements[5]).toEqual({string: 5, fret: 5})
        expect(placements[6]).toEqual({string: 5, fret: 6})
        expect(placements[11]).toEqual({string: 0, fret: 6})
    })
})

describe("legatoExercise", () => {
    it("plays the pattern at every placement", () => {
        const groups = legatoExercise("down", "alongString", {...options, to: 6})
        expect(groups.map(group => group.map(note => note.fret))).toEqual([[8, 7, 5], [9, 8, 6], [8, 7, 5]])
    })
})

describe("stringFingers", () => {
    it("uses 1-3-4 when the whole step comes first", () => {
        expect(stringFingers([10, 12, 13])).toEqual([1, 3, 4])
    })

    it("uses 1-2-4 for a half step first or two whole steps", () => {
        expect(stringFingers([9, 10, 12])).toEqual([1, 2, 4])
        expect(stringFingers([8, 10, 12])).toEqual([1, 2, 4])
    })

    it("uses 1-3-4 across the augmented second of harmonic minor", () => {
        expect(stringFingers([5, 8, 9])).toEqual([1, 3, 4])
    })
})

describe("scale runs", () => {
    it("finds the 1-3-4 strings of C major position 1", () => {
        expect(cMajorStrings().filter(item => item.isGrip).map(item => item.string)).toEqual([4, 5])
    })

    it("goes up string by string, picking each new string", () => {
        const groups = scaleRun(cMajorStrings(), "up")
        expect(groups).toHaveLength(6)
        expect(groups[5]!.map(note => [note.fret, note.finger, note.technique])).toEqual([[10, 1, "pick"], [12, 3, "hammer"], [13, 4, "hammer"]])
    })

    it("turns around on the top string in one group", () => {
        const groups = scaleRun(cMajorStrings(), "upDown")
        expect(groups).toHaveLength(11)
        expect(groups[5]!.map(note => note.fret)).toEqual([10, 12, 13, 12, 10])
        expect(groups[6]!.map(note => note.fret)).toEqual([13, 12, 10])
    })

    it("loops each string up and down", () => {
        const groups = scaleRun(cMajorStrings().filter(item => item.isGrip), "loop")
        expect(groups.map(group => group.map(note => note.technique))).toEqual([
            ["pick", "hammer", "hammer", "pull", "pull"],
            ["pick", "hammer", "hammer", "pull", "pull"],
        ])
    })
})
