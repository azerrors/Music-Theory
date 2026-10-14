import type * as ToneNamespace from "tone"
import {GUITAR_SAMPLE_NOTES, sampleBaseUrl, sampleUrls} from "@/lib/audio/samples"

type ToneModule = typeof ToneNamespace

/** One voice per string, plus one so the chord builder can sound a full 13th chord (7 notes). */
const VOICE_COUNT = 7
const STRUM_GAP_SECONDS = 0.045
const SCALE_STEP_SECONDS = 0.32
/** How long a recorded note rings before it is let go: about a bar at the progression tempo. */
const NOTE_SECONDS = 2.5

/**
 * Plays notes: recorded acoustic guitar when the samples load, otherwise a Karplus-Strong
 * pluck synth, so the site still makes a sound offline or if the files are missing.
 */
interface GuitarVoice {
    play: (midi: number, time: number) => void
}

let enginePromise: Promise<{Tone: ToneModule; voice: GuitarVoice}> | null = null

async function loadSampler(Tone: ToneModule, output: ToneNamespace.ToneAudioNode): Promise<GuitarVoice> {
    const sampler = new Tone.Sampler({urls: sampleUrls(GUITAR_SAMPLE_NOTES), baseUrl: sampleBaseUrl("guitar-acoustic"), release: 1})
    sampler.connect(output)
    await Tone.loaded()
    return {play: (midi, time) => sampler.triggerAttackRelease(Tone.Frequency(midi, "midi").toNote(), NOTE_SECONDS, time)}
}

function pluckVoices(Tone: ToneModule, output: ToneNamespace.ToneAudioNode): GuitarVoice {
    // One Karplus-Strong voice per string, so a strum lets earlier strings ring.
    const voices = Array.from({length: VOICE_COUNT}, () =>
        new Tone.PluckSynth({attackNoise: 1.2, dampening: 3800, resonance: 0.96}).connect(output),
    )
    let next = 0
    return {
        play: (midi, time) => {
            voices[next]?.triggerAttack(Tone.Frequency(midi, "midi").toFrequency(), time)
            next = (next + 1) % voices.length
        },
    }
}

/**
 * Tone.js is ~300 kB and can only start after a user gesture, so it and the samples are loaded
 * on the first play and reused afterwards.
 */
function ensureEngine(): Promise<{Tone: ToneModule; voice: GuitarVoice}> {
    enginePromise ??= (async () => {
        const Tone = await import("tone")
        await Tone.start()
        const output = new Tone.Volume(-6).toDestination()
        try {
            return {Tone, voice: await loadSampler(Tone, output)}
        } catch (error) {
            console.warn("Guitar samples failed to load, using the synth instead", error)
            return {Tone, voice: pluckVoices(Tone, output)}
        }
    })()
    return enginePromise
}

/** Strums the given pitches low → high, like a downstroke. */
export async function strum(midiNotes: number[]): Promise<void> {
    const {Tone, voice} = await ensureEngine()
    const now = Tone.now()
    midiNotes.slice(0, VOICE_COUNT).forEach((midi, index) => voice.play(midi, now + index * STRUM_GAP_SECONDS))
}

/** Plays the pitches one after another, e.g. a scale run. */
export async function arpeggiate(midiNotes: number[], stepSeconds = SCALE_STEP_SECONDS): Promise<void> {
    const {Tone, voice} = await ensureEngine()
    const now = Tone.now()
    midiNotes.forEach((midi, index) => voice.play(midi, now + index * stepSeconds))
}

export async function pluck(midi: number): Promise<void> {
    const {Tone, voice} = await ensureEngine()
    voice.play(midi, Tone.now())
}

export const PROGRESSION_STEP_SECONDS = 1.4

/** Strums each chord in turn, `stepSeconds` apart — one bar per chord. */
export async function strumSequence(chords: number[][], stepSeconds = PROGRESSION_STEP_SECONDS): Promise<void> {
    const {Tone, voice} = await ensureEngine()
    const now = Tone.now()
    chords.forEach((midiNotes, step) => {
        const start = now + step * stepSeconds
        midiNotes.slice(0, VOICE_COUNT).forEach((midi, index) => voice.play(midi, start + index * STRUM_GAP_SECONDS))
    })
}
