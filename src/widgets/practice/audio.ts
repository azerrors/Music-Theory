import type {Instrument} from "@/hooks/useInstrument"
import {arpeggiate, pluck, strum, strumSequence} from "@/lib/audio/guitarSynth"
import {playArpeggio, playChord, playChordSequence, playNote} from "@/lib/audio/pianoSampler"

/** Gap between the reference note and the question note: long enough to hear them apart. */
const REFERENCE_GAP_SECONDS = 0.9

/** One chord after another in a puzzle progression: a little brisker than the progressions page. */
const CHORD_STEP_SECONDS = 1.1

/** The practice sounds on the instrument being practised. Errors (no audio) are logged, not thrown. */
export const practiceAudio = (instrument: Instrument) => ({
    note: (midi: number) => void (instrument === "guitar" ? pluck(midi) : playNote(midi)).catch(console.error),
    sequence: (midi: number[]) => void (instrument === "guitar" ? arpeggiate(midi, REFERENCE_GAP_SECONDS) : playArpeggio(midi, REFERENCE_GAP_SECONDS)).catch(console.error),
    chord: (midi: number[]) => void (instrument === "guitar" ? strum(midi) : playChord(midi)).catch(console.error),
    progression: (chords: number[][]) => void (instrument === "guitar" ? strumSequence(chords, CHORD_STEP_SECONDS) : playChordSequence(chords, CHORD_STEP_SECONDS)).catch(console.error),
})
