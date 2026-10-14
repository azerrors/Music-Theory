import type * as ToneNamespace from "tone"
import {PIANO_SAMPLE_NOTES, sampleBaseUrl, sampleUrls} from "@/lib/audio/samples"

type ToneModule = typeof ToneNamespace

/** What the playback code needs from an instrument: the recorded piano, or the fallback synth. */
interface Instrument {
    triggerAttackRelease: (note: string, duration: number, time: number) => void
}

/** A chord on the piano is struck together; the tiny roll keeps it from sounding like one click. */
const ROLL_SECONDS = 0.012
const CHORD_SECONDS = 2.2
const ARPEGGIO_STEP_SECONDS = 0.3
const NOTE_SECONDS = 1.2

let samplerPromise: Promise<{Tone: ToneModule; sampler: Instrument}> | null = null

/**
 * Tone.js and the samples load on the first play, after a user gesture. If the recordings can't
 * be loaded the site still plays, with a soft synth instead of the piano.
 */
function ensureSampler(): Promise<{Tone: ToneModule; sampler: Instrument}> {
    samplerPromise ??= (async () => {
        const Tone = await import("tone")
        await Tone.start()
        const output = new Tone.Volume(-4).toDestination()
        try {
            const sampler = new Tone.Sampler({urls: sampleUrls(PIANO_SAMPLE_NOTES), baseUrl: sampleBaseUrl("piano"), release: 1}).connect(output)
            await Tone.loaded()
            return {Tone, sampler}
        } catch (error) {
            console.warn("Piano samples failed to load, using the synth instead", error)
            const synth = new Tone.PolySynth(Tone.Synth, {envelope: {attack: 0.005, decay: 0.8, sustain: 0.2, release: 1}}).connect(output)
            return {Tone, sampler: synth}
        }
    })()
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
