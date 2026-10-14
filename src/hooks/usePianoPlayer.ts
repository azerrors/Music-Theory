import {useCallback, useState} from "react"
import {playArpeggio, playChord, playChordSequence, playNote} from "@/lib/audio/pianoSampler"

/** Wraps the piano sampler with a loading flag: the first play downloads Tone.js and the samples. */
export function usePianoPlayer() {
    const [isLoading, setIsLoading] = useState(false)

    const run = useCallback(async (play: () => Promise<void>) => {
        setIsLoading(true)
        try {
            await play()
        } catch (error) {
            console.error("Piano samples failed to load", error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    return {
        isLoading,
        chord: useCallback((midi: number[]) => run(() => playChord(midi)), [run]),
        arpeggio: useCallback((midi: number[]) => run(() => playArpeggio(midi)), [run]),
        note: useCallback((midi: number) => run(() => playNote(midi)), [run]),
        sequence: useCallback((chords: number[][]) => run(() => playChordSequence(chords)), [run]),
    }
}
