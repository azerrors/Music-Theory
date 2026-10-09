import {CHORD_TYPES} from "@/constants/chordTypes"
import {resources} from "@/i18n"
import {
    BUILDER_SLOTS,
    BUILDER_TOURS,
    buildChord,
    builderMidi,
    DEFAULT_STATE,
    EMPTY_STATE,
    SLOT_OPTIONS,
    stateFromIntervals,
    stateFromType,
    stateIntervals,
    type BuilderState,
} from "@/lib/theory/builder"

const state = (patch: Partial<BuilderState>): BuilderState => ({...EMPTY_STATE, ...patch})

describe("buildChord", () => {
    it.each([
        [{third: "3M", fifth: "5P"}, "M"],
        [{third: "3m", fifth: "5P"}, "m"],
        [{third: "3m", fifth: "5P", seventh: "7m"}, "m7"],
        [{third: "3m", fifth: "5P", seventh: "7m", ninth: "9M"}, "m9"],
        [{third: "3M", fifth: "5P", seventh: "7M"}, "maj7"],
        [{third: "3m", fifth: "5d", seventh: "7m"}, "m7b5"],
        [{third: "3m", fifth: "5d", seventh: "7d"}, "dim7"],
        [{third: "4P", fifth: "5P"}, "sus4"],
        [{third: "3M", fifth: "5P", seventh: "6M", ninth: "9M"}, "69"],
        [{third: "3M", fifth: "5P", ninth: "9M"}, "add9"],
        [{fifth: "5P"}, "5"],
    ] as [Partial<BuilderState>, string][])("%o → %s", (patch, symbol) => {
        expect(buildChord("C", state(patch)).type?.symbol).toBe(symbol)
    })

    it("tells 9sus4 from 11 by interval names, though they share notes", () => {
        expect(buildChord("C", state({third: "4P", fifth: "5P", seventh: "7m", ninth: "9M"})).type?.symbol).toBe("9sus4")
        expect(buildChord("C", state({fifth: "5P", seventh: "7m", ninth: "9M", eleventh: "11P"})).type?.symbol).toBe("11")
    })

    it("names a chord with the fifth left out", () => {
        const chord = buildChord("C", state({third: "3M", seventh: "7m"}))
        expect(chord.type?.symbol).toBe("7")
        expect(chord.impliedFifth).toBe(true)
    })

    it("spells notes and degrees from the root", () => {
        const chord = buildChord("A", state({third: "3m", fifth: "5P", seventh: "7m"}))
        expect(chord.notes).toEqual(["A", "C", "E", "G"])
        expect(chord.degrees).toEqual(["1", "♭3", "5", "♭7"])
    })

    it("falls back to tonal's detection for chords outside the catalogue", () => {
        const chord = buildChord("C", state({third: "3M", fifth: "5A", seventh: "7M"}))
        expect(chord.type).toBeUndefined()
        expect(chord.detected).toBeTruthy()
    })
})

describe("state round trips", () => {
    it.each(CHORD_TYPES.map(type => type.symbol))("%s survives intervals → state → chord", symbol => {
        expect(buildChord("C", stateFromType(symbol)).type?.symbol).toBe(symbol)
    })

    it("reads intervals back into floors", () => {
        expect(stateFromIntervals(stateIntervals(DEFAULT_STATE))).toEqual(DEFAULT_STATE)
    })
})

describe("builderMidi", () => {
    it("stacks upwards from the root", () => {
        expect(builderMidi("C", state({third: "3M", fifth: "5P", seventh: "7m", ninth: "9M"}))).toEqual([48, 52, 55, 58, 62])
    })
})

describe("tours", () => {
    it.each(BUILDER_TOURS)("$id ends on a named chord at every step after the second", tour => {
        tour.steps.slice(2).forEach(step => expect(buildChord("C", step.state).type, tour.id).toBeDefined())
    })
})

describe("translations", () => {
    it.each(Object.entries(resources))("%s explains every choice and tour step", (_language, namespaces) => {
        const builder = namespaces.theory.builder as unknown as {
            hints: Record<string, Record<string, string>>
            tours: Record<string, {steps?: Record<string, string>}>
        }
        for (const slot of BUILDER_SLOTS) {
            for (const value of SLOT_OPTIONS[slot]) expect(builder.hints[slot]?.[value], `${slot}.${value}`).toBeTruthy()
        }
        for (const tour of BUILDER_TOURS) {
            tour.steps.forEach((_, index) => expect(builder.tours[tour.id]?.steps?.[index], `${tour.id}.${index}`).toBeTruthy())
        }
    })
})
