import {Note} from "tonal"
import {GLOSSARY_TERMS} from "@/constants/glossary"
import {resources} from "@/i18n"
import {parseTerms, stripTerms, termIds} from "@/lib/terms"

function allStrings(value: unknown): string[] {
    if (typeof value === "string") return [value]
    if (value && typeof value === "object") return Object.values(value).flatMap(allStrings)
    return []
}

const termIdSet = new Set(GLOSSARY_TERMS.map(term => term.id))

describe("parseTerms", () => {
    it("splits text and term markers", () => {
        expect(parseTerms("A [[third|third]] and a [[fifth|fifth]].")).toEqual([
            {kind: "text", text: "A "},
            {kind: "term", id: "third", text: "third"},
            {kind: "text", text: " and a "},
            {kind: "term", id: "fifth", text: "fifth"},
            {kind: "text", text: "."},
        ])
    })

    it("leaves plain text alone", () => {
        expect(parseTerms("no terms")).toEqual([{kind: "text", text: "no terms"}])
    })

    it("strips markers for plain-text use", () => {
        expect(stripTerms("every [[fret|fret]] is a [[semitone|semitone]]")).toBe("every fret is a semitone")
    })
})

describe.each(Object.entries(resources))("%s locale", (_language, namespaces) => {
    it("only marks terms that exist in the glossary", () => {
        for (const text of allStrings(namespaces)) {
            for (const id of termIds(text)) expect(termIdSet, `unknown term "${id}" in: ${text}`).toContain(id)
        }
    })

    it("translates every glossary term", () => {
        const terms = namespaces.glossary.terms as Record<string, {title?: string; body?: string}>
        for (const {id} of GLOSSARY_TERMS) {
            expect(terms[id]?.title, `${id} title`).toBeTruthy()
            expect(terms[id]?.body, `${id} body`).toBeTruthy()
        }
        expect(Object.keys(terms).sort()).toEqual([...termIdSet].sort())
    })
})

describe("glossary examples", () => {
    it("use valid note names", () => {
        for (const term of GLOSSARY_TERMS) {
            if (!term.example) continue
            const notes = term.example.kind === "sequence" ? term.example.chords.flat() : term.example.notes
            for (const note of notes) expect(Note.midi(note), `${term.id}: ${note}`).not.toBeNull()
        }
    })
})
