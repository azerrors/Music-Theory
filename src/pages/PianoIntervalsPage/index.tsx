import {useState} from "react"
import {useTranslation} from "react-i18next"
import {Interval, Note} from "tonal"
import {Card} from "@/components/ui/card"
import {ROOT_NOTES} from "@/constants/notes"
import {usePianoPlayer} from "@/hooks/usePianoPlayer"
import {useSettings} from "@/hooks/useSettings"
import {chordFingering} from "@/lib/piano/fingering"
import {keyboardRange} from "@/lib/piano/voicings"
import {INTERVALS, type IntervalDef} from "@/lib/theory/intervals"
import {formatNote, mod12} from "@/lib/theory/notes"
import type {NoteName} from "@/types/music"
import {INTERVAL_COLOURS, INTERVAL_PRESETS, IntervalPicker, IntervalTable} from "@/widgets/IntervalPicker"
import {PageHeader} from "@/widgets/PageHeader"
import {PianoKeyboard, type KeyMarker} from "@/widgets/PianoKeyboard"
import {TermText} from "@/widgets/Term"

/** C3 to B5: room for an octave above any reference the user is likely to pick. */
const BASE_RANGE = [48, 83]
const LETTERS = ["C", "D", "E", "F", "G", "A", "B"]

/** The letters an interval passes through, counted inclusively: C → E is C, D, E. */
function letterSpan(from: NoteName, interval: IntervalDef): string[] {
    const start = LETTERS.indexOf(Note.get(from).letter)
    const count = Interval.get(interval.id).num ?? 1
    return Array.from({length: count}, (_, index) => LETTERS[(start + index) % 7]!)
}

export default function PianoIntervalsPage() {
    const {t} = useTranslation("theory")
    const {t: tPiano} = useTranslation("piano")
    const {t: tCommon} = useTranslation()
    const {notation} = useSettings()
    const player = usePianoPlayer()

    const [reference, setReference] = useState(60)
    const [selected, setSelected] = useState<string[]>(INTERVAL_PRESETS.basics!)

    // Spell the reference the way the root picker does (E♭, not D♯), then every target from it.
    const referenceNote = ROOT_NOTES[mod12(reference)] ?? "C"
    const referenceOctave = Math.floor(reference / 12) - 1
    const referenceName = formatNote(referenceNote, notation)
    const targetOf = (interval: IntervalDef) => Note.transpose(referenceNote, interval.id)

    const wanted = INTERVALS.filter(interval => interval.id !== "1P" && selected.includes(interval.id))
    // With one interval on show, the keys carry its fingering too; with several it would be ambiguous.
    const single = wanted.length === 1 ? wanted[0] : undefined
    const singleFingers = single ? chordFingering([reference, reference + single.semitones], "right") : null

    const markers: KeyMarker[] = [
        {midi: reference, label: "1", isRoot: true, finger: singleFingers?.[0]},
        ...wanted.map(interval => ({
            midi: reference + interval.semitones,
            label: interval.label,
            fillClass: INTERVAL_COLOURS[interval.id]?.fill,
            finger: singleFingers?.[1],
        })),
    ]
    const {from, to} = keyboardRange([...BASE_RANGE, reference + 12], 3)

    const noteCell = (interval: IntervalDef) => {
        const letters = letterSpan(referenceNote, interval)
        const shown = letters.length <= 5 ? letters.join("–") : `${letters[0]} … ${letters[letters.length - 1]}`
        const pair = [reference, reference + interval.semitones]
        return (
            <span className="space-y-0.5">
                <span className="block">
                    <strong className="text-sm">{formatNote(targetOf(interval), notation)}</strong>
                    {" · "}{tPiano("intervals.letters", {letters: shown, count: letters.length})}
                </span>
                <span className="block text-stone-500">
                    {tPiano("intervals.fingers", {
                        right: chordFingering(pair, "right")?.join("–") ?? "—",
                        left: chordFingering(pair, "left")?.join("–") ?? "—",
                    })}
                </span>
            </span>
        )
    }

    return (
        <div className="space-y-8">
            <PageHeader title={tCommon("nav.intervals")} description={<TermText text={tPiano("intervals.description")}/>}/>

            <Card className="space-y-4">
                <p className="text-sm">
                    {t("intervals.reference")}{" "}
                    <strong className="text-lg">{referenceName}</strong>{" "}
                    <span className="text-stone-500">({referenceNote}{referenceOctave})</span>
                </p>
                <IntervalPicker selected={selected} onChange={setSelected}/>
                <p className="text-xs text-stone-500">{tPiano("intervals.clickHint")}</p>
            </Card>

            <Card className="min-w-0 space-y-3">
                <PianoKeyboard
                    from={from}
                    to={to}
                    markers={markers}
                    onKeyClick={midi => {
                        setReference(midi)
                        void player.note(midi)
                    }}
                    ariaLabel={t("intervals.boardLabel", {note: referenceName})}
                />
                {single && <p className="text-xs text-stone-500">{tPiano("fingers.legend")}</p>}
            </Card>

            <IntervalTable
                selected={selected}
                extraTitle={tPiano("intervals.noteColumn")}
                extraCell={noteCell}
                onMelodic={interval => void player.arpeggio([reference, reference + interval.semitones])}
                onHarmonic={interval => void player.chord([reference, reference + interval.semitones])}
                footnote={<TermText text={tPiano("intervals.lettersHint")}/>}
            />
        </div>
    )
}
