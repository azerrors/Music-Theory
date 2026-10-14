import {usePianoPlayer} from "@/hooks/usePianoPlayer"
import {useSettings} from "@/hooks/useSettings"
import {fingerMap} from "@/lib/piano/fingering"
import {keyboardRange, voicingNotes, type PianoVoicing} from "@/lib/piano/voicings"
import type {ChordInfo} from "@/lib/theory/chords"
import {chroma, formatNote, mod12} from "@/lib/theory/notes"
import {PianoKeyboard, type KeyMarker} from "@/widgets/PianoKeyboard"

interface PianoChordKeysProps {
    chord: ChordInfo
    voicing: Pick<PianoVoicing, "left" | "right">
    /** Keys to draw; defaults to the voicing's own range. Share one range to line several keyboards up. */
    range?: {from: number; to: number}
    /** Clicking a key plays it. */
    playable?: boolean
    title?: string
    className?: string
}

/** A chord voicing drawn on the keys, labelled with notes or degrees as chosen in settings. */
export function PianoChordKeys({chord, voicing, range, playable, title, className}: PianoChordKeysProps) {
    const {notation, labelMode} = useSettings()
    const player = usePianoPlayer()
    const rootChroma = chroma(chord.root)

    const tones = chord.notes.map((note, index) => ({note, degree: chord.degrees[index] ?? ""}))
    if (chord.bass) tones.push({note: chord.bass, degree: chord.bassDegree ?? ""})
    const toneOf = (midi: number) => tones.find(tone => chroma(tone.note) === mod12(midi))

    const leftFingers = fingerMap(voicing.left, "left")
    const rightFingers = fingerMap(voicing.right, "right")
    const marker = (midi: number, isLeftHand: boolean): KeyMarker => {
        const tone = toneOf(midi)
        const label = tone ? (labelMode === "degree" ? tone.degree : formatNote(tone.note, notation)) : ""
        const finger = (isLeftHand ? leftFingers : rightFingers).get(midi)
        return {midi, label, isLeftHand, isRoot: mod12(midi) === rootChroma, finger}
    }
    const markers = [...voicing.left.map(midi => marker(midi, true)), ...voicing.right.map(midi => marker(midi, false))]
    const {from, to} = range ?? keyboardRange(voicingNotes(voicing))

    return (
        <PianoKeyboard
            from={from}
            to={to}
            markers={markers}
            onKeyClick={playable ? midi => void player.note(midi) : undefined}
            ariaLabel={title}
            className={className}
        />
    )
}
