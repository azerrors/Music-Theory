import type * as ToneNamespace from "tone"

type ToneModule = typeof ToneNamespace

/**
 * Salamander Grand Piano samples hosted by the Tone.js project. One sample every minor third;
 * the sampler pitch-shifts the notes in between.
 */
const SAMPLE_BASE_URL = "https://tonejs.github.io/audio/salamander/"
const SAMPLED_NOTES = ["A1", "C2", "D#2", "F#2", "A2", "C3", "D#3", "F#3", "A3", "C4", "D#4", "F#4", "A4", "C5", "D#5", "F#5", "A5", "C6"]

/** A chord on the piano is struck together; the tiny roll keeps it from sounding like one click. */
const ROLL_SECONDS = 0.012
const CHORD_SECONDS = 2.2
const ARPEGGIO_STEP_SECONDS = 0.3
const NOTE_SECONDS = 1.2

let samplerPromise: Promise<{Tone: ToneModule; sampler: ToneNamespace.Sampler}> | null = null

/** Tone.js and the samples load on the first play, after a user gesture. */
function ensureSampler(): Promise<{Tone: ToneModule; sampler: ToneNamespace.Sampler}> {
    samplerPromise ??= (async () => {
        const Tone = await import("tone")
        await Tone.start()
        const sampler = new Tone.Sampler({
            urls: Object.fromEntries(SAMPLED_NOTES.map(note => [note, `${note.replace("#", "s")}.mp3`])),
            baseUrl: SAMPLE_BASE_URL,
            release: 1,
        }).connect(new Tone.Volume(-4).toDestination())
        await Tone.loaded()
        return {Tone, sampler}
    })().catch(error => {
        // Let the next click try again, e.g. after the network comes back.
        samplerPromise = null
        throw error
    })
    return samplerPromise
}

function noteName(Tone: ToneModule, midi: number): string {
    return Tone.Frequency(midi, "midi").toNote()
}

/** Strikes all keys at once. */
export async function playChord(midiNotes: number[]): Promise<void> {
    const {Tone, sampler} = await ensureSampler()
    const now = Tone.now()
    midiNotes.forEach((midi, index) => {
        sampler.triggerAttackRelease(noteName(Tone, midi), CHORD_SECONDS, now + index * ROLL_SECONDS)
    })
}

/** Plays the keys one after another, low → high. */
export async function playArpeggio(midiNotes: number[], stepSeconds = ARPEGGIO_STEP_SECONDS): Promise<void> {
    const {Tone, sampler} = await ensureSampler()
    const now = Tone.now()
    midiNotes.forEach((midi, index) => {
        sampler.triggerAttackRelease(noteName(Tone, midi), NOTE_SECONDS, now + index * stepSeconds)
    })
}

export async function playNote(midi: number): Promise<void> {
    const {Tone, sampler} = await ensureSampler()
    sampler.triggerAttackRelease(noteName(Tone, midi), NOTE_SECONDS, Tone.now())
}

export const SEQUENCE_STEP_SECONDS = 1.4

/** Strikes each chord in turn, `stepSeconds` apart — e.g. the previous chord, then the new one. */
export async function playChordSequence(chords: number[][], stepSeconds = SEQUENCE_STEP_SECONDS): Promise<void> {
    const {Tone, sampler} = await ensureSampler()
    const now = Tone.now()
    chords.forEach((midiNotes, step) => {
        midiNotes.forEach((midi, index) => {
            sampler.triggerAttackRelease(noteName(Tone, midi), stepSeconds, now + step * stepSeconds + index * ROLL_SECONDS)
        })
    })
}
