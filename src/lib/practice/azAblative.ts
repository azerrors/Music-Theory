/**
 * The Azerbaijani "from" suffix for a note name: "-dan" after a back vowel, "-dən" after a front
 * one, by how the note is said aloud (A = "a", C = "si", B♭ = "bi bemol", Sol…). Other languages
 * ignore it.
 */

const BACK_VOWELS = /[aıou]/

/** How each letter and solfège name is said, for its last vowel. */
const SPOKEN: Record<string, string> = {
    C: "si", D: "di", E: "i", F: "ef", G: "ci", A: "a", B: "bi",
    Do: "do", Re: "re", Mi: "mi", Fa: "fa", Sol: "sol", La: "la", Si: "si",
}

export function azAblative(label: string): string {
    // An accidental is said last: "diyez" (front) or "bemol" (back).
    if (label.endsWith("♯") || label.endsWith("#")) return "-dən"
    if (label.endsWith("♭") || label.endsWith("b") && label.length > 1) return "-dan"
    const spoken = SPOKEN[label] ?? label.toLowerCase()
    const lastVowel = [...spoken].reverse().find(letter => /[aıoueəiöü]/.test(letter))
    return lastVowel && BACK_VOWELS.test(lastVowel) ? "-dan" : "-dən"
}
