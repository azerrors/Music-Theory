/**
 * Translated texts mark glossary terms as `[[termId|shown text]]`, e.g.
 * "built from a [[third|third]] and a [[fifth|fifth]]". `TermText` turns them into
 * hover explanations; anywhere plain text is needed (titles, aria labels) use `stripTerms`.
 */
const TERM_PATTERN = /\[\[(\w+)\|([^\]]+)\]\]/g

export type TextPart = {kind: "text"; text: string} | {kind: "term"; id: string; text: string}

export function parseTerms(text: string): TextPart[] {
    const parts: TextPart[] = []
    let last = 0
    for (const match of text.matchAll(TERM_PATTERN)) {
        const index = match.index ?? 0
        if (index > last) parts.push({kind: "text", text: text.slice(last, index)})
        parts.push({kind: "term", id: match[1]!, text: match[2]!})
        last = index + match[0].length
    }
    if (last < text.length) parts.push({kind: "text", text: text.slice(last)})
    return parts
}

export function stripTerms(text: string): string {
    return text.replace(TERM_PATTERN, "$2")
}

/** Every term id referenced in `text`. */
export function termIds(text: string): string[] {
    return [...text.matchAll(TERM_PATTERN)].map(match => match[1]!)
}
