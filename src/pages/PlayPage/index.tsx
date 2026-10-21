import {useCallback, useEffect, useLayoutEffect, useRef, useState} from "react"
import {useTranslation} from "react-i18next"
import {Note} from "tonal"
import {Card} from "@/components/ui/card"
import {useInstrument} from "@/hooks/useInstrument"
import {usePianoPlayer} from "@/hooks/usePianoPlayer"
import {usePlayer} from "@/hooks/usePlayer"
import {useSettings} from "@/hooks/useSettings"
import type {FretMarker} from "@/lib/theory/fretboard"
import {formatNote, midiAt} from "@/lib/theory/notes"
import {Fretboard} from "@/widgets/Fretboard"
import {PageHeader} from "@/widgets/PageHeader"
import {PianoKeyboard, type KeyMarker} from "@/widgets/PianoKeyboard"

/** How long a played note stays lit. */
const FLASH_MS = 700
/** A full guitar neck and a full 88-key piano, A0 to C8. */
const FRET_COUNT = 24
const PIANO_FROM = 21
const PIANO_TO = 108
/** The computer keyboard plays C4 … E5, laid out like a piano: the home row is white, the row above black. */
const KEY_TO_MIDI: Record<string, number> = {
    a: 60, w: 61, s: 62, e: 63, d: 64, f: 65, t: 66, g: 67, y: 68, h: 69, u: 70, j: 71, k: 72, o: 73, l: 74, p: 75, ";": 76,
}

const pitchClassOf = (midi: number) => Note.pitchClass(Note.fromMidiSharps(midi))

/** Notes lit up for a moment after they are played, keyed by an id of the caller's choice. */
function useFlashes<T>() {
    const [lit, setLit] = useState<Map<string, T>>(new Map())
    const timers = useRef(new Map<string, number>())

    useEffect(() => {
        const pending = timers.current
        return () => pending.forEach(timer => window.clearTimeout(timer))
    }, [])

    const flash = useCallback((id: string, value: T) => {
        setLit(current => new Map(current).set(id, value))
        window.clearTimeout(timers.current.get(id))
        timers.current.set(id, window.setTimeout(() => {
            timers.current.delete(id)
            setLit(current => {
                const next = new Map(current)
                next.delete(id)
                return next
            })
        }, FLASH_MS))
    }, [])

    return {lit: [...lit.values()], flash}
}

function LastNote({midi}: {midi: number | null}) {
    const {t} = useTranslation()
    const {notation} = useSettings()

    return (
        <Card className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-base-500">{t("play.lastNote")}</p>
            <p className="text-2xl font-bold tabular-nums">
                {midi === null ? "—" : `${formatNote(pitchClassOf(midi), notation)}${Math.floor(midi / 12) - 1}`}
            </p>
        </Card>
    )
}

function GuitarPlay() {
    const {t} = useTranslation()
    const {tuning} = useSettings()
    const {pluck} = usePlayer()
    const {lit, flash} = useFlashes<FretMarker>()
    const [last, setLast] = useState<number | null>(null)

    const play = (string: number, fret: number) => {
        const midi = midiAt(tuning.strings[string] ?? "E2", fret)
        void pluck(midi)
        setLast(midi)
        flash(`${string}-${fret}`, {string, fret, note: pitchClassOf(midi), isRoot: true})
    }

    return (
        <div className="space-y-6">
            <PageHeader title={t("instrument.guitar")} description={t("play.guitarHint")}/>
            <Fretboard markers={lit} onPositionClick={play} fretCount={FRET_COUNT} ariaLabel={t("instrument.guitar")}/>
            <LastNote midi={last}/>
        </div>
    )
}

function PianoPlay() {
    const {t} = useTranslation()
    const {notation} = useSettings()
    const {note} = usePianoPlayer()
    const {lit, flash} = useFlashes<KeyMarker>()
    const [last, setLast] = useState<number | null>(null)
    const keyboardRef = useRef<HTMLDivElement>(null)

    // 88 keys don't fit a narrow screen, so the keyboard scrolls; it opens centred on middle C.
    useLayoutEffect(() => {
        const scroller = keyboardRef.current?.firstElementChild
        if (!(scroller instanceof HTMLElement) || scroller.scrollWidth <= scroller.clientWidth) return
        const whiteKeys = 52
        const whiteBeforeMiddleC = 23 // A0, B0 and three octaves C1–B3
        const middleC = (whiteBeforeMiddleC + 0.5) / whiteKeys * scroller.scrollWidth
        scroller.scrollLeft = middleC - scroller.clientWidth / 2
    }, [])

    const play = useCallback((midi: number) => {
        void note(midi)
        setLast(midi)
        flash(String(midi), {midi, label: formatNote(pitchClassOf(midi), notation), isRoot: true})
    }, [note, flash, notation])

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return
            if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select, [contenteditable]")) return
            const midi = KEY_TO_MIDI[event.key.toLowerCase()]
            if (midi === undefined) return
            event.preventDefault()
            play(midi)
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [play])

    return (
        <div className="space-y-6">
            <PageHeader title={t("instrument.piano")} description={t("play.pianoHint")}/>
            <div ref={keyboardRef} className="rounded-xl border border-base-200 bg-white p-3 dark:border-base-800 dark:bg-base-900">
                <PianoKeyboard from={PIANO_FROM} to={PIANO_TO} markers={lit} onKeyClick={play} minKeyWidth={20} ariaLabel={t("instrument.piano")}/>
            </div>
            <LastNote midi={last}/>
        </div>
    )
}

/** Free play: tap the neck or the keys and hear the instrument, nothing to answer. */
export default function PlayPage() {
    return useInstrument() === "piano" ? <PianoPlay/> : <GuitarPlay/>
}
