import type {Instrument} from "@/hooks/useInstrument"
import {arpeggiate, pluck, strum} from "@/lib/audio/guitarSynth"
import {playArpeggio, playChord, playNote} from "@/lib/audio/pianoSampler"

/** Gap between the reference note and the question note: long enough to hear them apart. */
const REFERENCE_GAP_SECONDS = 0.9

/** The practice sounds on the instrument being practised. Errors (no audio) are logged, not thrown. */
export const practiceAudio = (instrument: Instrument) => ({
    note: (midi: number) => void (instrument === "guitar" ? pluck(midi) : playNote(midi)).catch(console.error),
    sequence: (midi: number[]) => void (instrument === "guitar" ? arpeggiate(midi, REFERENCE_GAP_SECONDS) : playArpeggio(midi, REFERENCE_GAP_SECONDS)).catch(console.error),
    chord: (midi: number[]) => void (instrument === "guitar" ? strum(midi) : playChord(midi)).catch(console.error),
})
