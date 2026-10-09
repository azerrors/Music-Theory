import type * as ToneNamespace from "tone"

type ToneModule = typeof ToneNamespace

/** One voice per string, plus one so the chord builder can sound a full 13th chord (7 notes). */
const VOICE_COUNT = 7
const STRUM_GAP_SECONDS = 0.045
const SCALE_STEP_SECONDS = 0.32

let tonePromise: Promise<ToneModule> | null = null
let voices: ToneNamespace.PluckSynth[] = []

/**
 * Tone.js is ~300 kB and can only start after a user gesture, so it is loaded
 * on the first play and reused afterwards.
 */
async function ensureVoices(): Promise<{Tone: ToneModule; voices: ToneNamespace.PluckSynth[]}> {
    tonePromise ??= import("tone")
    const Tone = await tonePromise
    await Tone.start()

    if (voices.length === 0) {
        const output = new Tone.Volume(-6).toDestination()
        // One Karplus-Strong voice per string, so a strum lets earlier strings ring.
        voices = Array.from({length: VOICE_COUNT}, () =>
            new Tone.PluckSynth({attackNoise: 1.2, dampening: 3800, resonance: 0.96}).connect(output),
        )
    }

    return {Tone, voices}
}

function midiToFrequency(Tone: ToneModule, midi: number): number {
    return Tone.Frequency(midi, "midi").toFrequency()
}

/** Strums the given pitches low → high, like a downstroke. */
export async function strum(midiNotes: number[]): Promise<void> {
    const {Tone, voices} = await ensureVoices()
    const now = Tone.now()
    midiNotes.slice(0, VOICE_COUNT).forEach((midi, index) => {
        voices[index]?.triggerAttack(midiToFrequency(Tone, midi), now + index * STRUM_GAP_SECONDS)
    })
}

/** Plays the pitches one after another, e.g. a scale run. */
export async function arpeggiate(midiNotes: number[], stepSeconds = SCALE_STEP_SECONDS): Promise<void> {
    const {Tone, voices} = await ensureVoices()
    const now = Tone.now()
    midiNotes.forEach((midi, index) => {
        // Alternate voices so each note rings into the next one.
        voices[index % 2]?.triggerAttack(midiToFrequency(Tone, midi), now + index * stepSeconds)
    })
}

export async function pluck(midi: number): Promise<void> {
    const {Tone, voices} = await ensureVoices()
    voices[0]?.triggerAttack(midiToFrequency(Tone, midi), Tone.now())
}

export const PROGRESSION_STEP_SECONDS = 1.4

/** Strums each chord in turn, `stepSeconds` apart — one bar per chord. */
export async function strumSequence(chords: number[][], stepSeconds = PROGRESSION_STEP_SECONDS): Promise<void> {
    const {Tone, voices} = await ensureVoices()
    const now = Tone.now()
    chords.forEach((midiNotes, step) => {
        const start = now + step * stepSeconds
        midiNotes.slice(0, VOICE_COUNT).forEach((midi, index) => {
            voices[index]?.triggerAttack(midiToFrequency(Tone, midi), start + index * STRUM_GAP_SECONDS)
        })
    })
}
