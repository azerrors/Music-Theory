/**
 * Recorded instrument notes served from `public/samples` (see SOURCES.md there). One note every
 * minor third is enough: Tone.Sampler pitch-shifts the keys in between.
 */
export const GUITAR_SAMPLE_NOTES = ["E2", "G2", "A#2", "C#3", "E3", "G3", "A#3", "C#4", "E4", "G4", "A#4", "C#5"]
export const PIANO_SAMPLE_NOTES = ["A1", "C2", "D#2", "F#2", "A2", "C3", "D#3", "F#3", "A3", "C4", "D#4", "F#4", "A4", "C5", "D#5", "F#5", "A5", "C6", "D#6"]

/** Base URL of an instrument's folder; respects Vite's `base` if the site is served from a sub-path. */
export function sampleBaseUrl(folder: "guitar-acoustic" | "piano"): string {
    return `${import.meta.env.BASE_URL}samples/${folder}/`
}

/** Tone.Sampler `urls`: "C#4" → "Cs4.mp3", the file naming the sample set uses. */
export function sampleUrls(notes: string[]): Record<string, string> {
    return Object.fromEntries(notes.map(note => [note, `${note.replace("#", "s")}.mp3`]))
}
