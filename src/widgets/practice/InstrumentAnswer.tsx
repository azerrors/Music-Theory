import {useEffect, useMemo, useRef} from "react"
import type {Instrument} from "@/hooks/useInstrument"
import {useSettings} from "@/hooks/useSettings"
import {guitarSpots, pianoSpots, spellingOf, type Spot} from "@/lib/practice/questions"
import type {FretMarker} from "@/lib/theory/fretboard"
import {chroma, formatNote, mod12} from "@/lib/theory/notes"
import type {NoteName} from "@/types/music"
import {Fretboard} from "@/widgets/Fretboard"
import {PianoKeyboard, type KeyMarker} from "@/widgets/PianoKeyboard"

/** The whole instrument: a 22-fret neck, or all 88 keys (A0 to C8). */
export const FRET_COUNT = 22
export const PIANO_FROM = 21
export const PIANO_TO = 108

/** Keys stay this wide at least, so a fingertip can hit one; the keyboard scrolls instead. */
const MIN_KEY_WIDTH = 20

const RIGHT = "fill-emerald-600"
const WRONG = "fill-rose-600"

interface InstrumentAnswerProps {
    instrument: Instrument
    /** After an answer: every place the right note sits, in green. */
    correctNote?: NoteName
    /** With `correctNote`: only places at this exact pitch count, not the note's other octaves. */
    correctMidi?: number
    /** After a wrong answer: the place that was picked, in red. */
    wrongSpot?: Spot
    /** A place lit in the accent colour (a question's first note, or the spot to name); its name shows once revealed. */
    litSpot?: Spot
    revealLit?: boolean
    /** What the lit place shows until revealed. */
    litLabel?: string
    onPick?: (spot: Spot) => void
    ariaLabel: string
}

/** The guitar neck or the piano keyboard as an answer pad, with right/wrong colouring. */
export function InstrumentAnswer({instrument, correctNote, correctMidi, wrongSpot, litSpot, revealLit, litLabel = "?", onPick, ariaLabel}: InstrumentAnswerProps) {
    const {tuning, notation, leftHanded} = useSettings()
    const wrapper = useRef<HTMLDivElement>(null)

    // On a narrow screen the neck or keys scroll: bring the lit place into view with each question.
    useEffect(() => {
        const scroller = wrapper.current?.querySelector<HTMLElement>(".overflow-x-auto")
        if (!litSpot || !scroller || scroller.scrollWidth <= scroller.clientWidth) return
        let at = litSpot.string === undefined
            ? (litSpot.midi - PIANO_FROM) / (PIANO_TO - PIANO_FROM)
            : litSpot.fret === 0 ? 0 : (litSpot.fret! - 0.5) / FRET_COUNT
        if (litSpot.string !== undefined && leftHanded) at = 1 - at
        scroller.scrollTo({left: at * scroller.scrollWidth - scroller.clientWidth / 2, behavior: "smooth"})
    }, [litSpot, leftHanded])
    const label = (midi: number) => formatNote(spellingOf(midi), notation)
    const spots = useMemo(() => (instrument === "guitar" ? guitarSpots(tuning, FRET_COUNT) : pianoSpots(PIANO_FROM, PIANO_TO)), [instrument, tuning])

    // Later marks draw over earlier ones: the lit place first, then right and wrong on top.
    const marked: {spot: Spot; fill: string; text: string}[] = []
    if (litSpot) marked.push({spot: litSpot, fill: instrument === "guitar" ? "fill-brand-600" : "fill-brand-strong", text: revealLit ? label(litSpot.midi) : litLabel})
    if (correctNote) {
        spots
            .filter(spot => (correctMidi === undefined ? mod12(spot.midi) === chroma(correctNote) : spot.midi === correctMidi))
            .forEach(spot => marked.push({spot, fill: RIGHT, text: label(spot.midi)}))
    }
    if (wrongSpot) marked.push({spot: wrongSpot, fill: WRONG, text: label(wrongSpot.midi)})
    const placeOf = (spot: Spot) => (spot.string === undefined ? `${spot.midi}` : `${spot.string}-${spot.fret}`)
    const marks = [...new Map(marked.map(mark => [placeOf(mark.spot), mark])).values()]

    if (instrument === "guitar") {
        const markers: FretMarker[] = marks.map(({spot, fill, text}) => ({
            string: spot.string!,
            fret: spot.fret!,
            note: spellingOf(spot.midi),
            isRoot: false,
            label: text,
            fillClass: fill,
            textClass: fill === "fill-brand-600" ? "fill-on-brand" : "fill-white",
        }))
        return (
            <div ref={wrapper}>
                <Fretboard
                    markers={markers}
                    fretCount={FRET_COUNT}
                    ariaLabel={ariaLabel}
                    onPositionClick={onPick ? (string, fret) => onPick(spots.find(spot => spot.string === string && spot.fret === fret)!) : undefined}
                />
            </div>
        )
    }

    const markers: KeyMarker[] = marks.map(({spot, fill, text}) => ({midi: spot.midi, label: text, fillClass: fill}))
    return (
        <div ref={wrapper}>
            <PianoKeyboard
                from={PIANO_FROM}
                to={PIANO_TO}
                markers={markers}
                minKeyWidth={MIN_KEY_WIDTH}
                ariaLabel={ariaLabel}
                onKeyClick={onPick ? midi => onPick({midi}) : undefined}
            />
        </div>
    )
}
