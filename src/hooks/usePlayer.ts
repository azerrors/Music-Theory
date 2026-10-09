import {useCallback, useState} from "react"
import {arpeggiate, pluck, strum, strumSequence} from "@/lib/audio/guitarSynth"

/** Wraps the synth with a loading flag for the first, lazy Tone.js import. */
export function usePlayer() {
    const [isLoading, setIsLoading] = useState(false)

    const run = useCallback(async (play: () => Promise<void>) => {
        setIsLoading(true)
        try {
            await play()
        } finally {
            setIsLoading(false)
        }
    }, [])

    return {
        isLoading,
        strum: useCallback((midi: number[]) => run(() => strum(midi)), [run]),
        arpeggiate: useCallback((midi: number[]) => run(() => arpeggiate(midi)), [run]),
        pluck: useCallback((midi: number) => run(() => pluck(midi)), [run]),
        strumSequence: useCallback((chords: number[][]) => run(() => strumSequence(chords)), [run]),
    }
}
