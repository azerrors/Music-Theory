import {useState} from "react"
import {useTranslation} from "react-i18next"
import {Card} from "@/components/ui/card"
import {usePlayer} from "@/hooks/usePlayer"
import {useSettings} from "@/hooks/useSettings"
import type {FretMarker} from "@/lib/theory/fretboard"
import {intervalPositions, intervalShapes, type IntervalShape, type Position} from "@/lib/theory/intervals"
import {formatNote, midiAt, pitchAt} from "@/lib/theory/notes"
import {Fretboard} from "@/widgets/Fretboard"
import {INTERVAL_COLOURS, INTERVAL_PRESETS, IntervalPicker, IntervalTable} from "@/widgets/IntervalPicker"
import {PageHeader} from "@/widgets/PageHeader"
import {TermText} from "@/widgets/Term"

const FRET_COUNT = 15

export default function IntervalsPage() {
    const {t} = useTranslation("theory")
    const {t: tCommon} = useTranslation()
    const {tuning, notation} = useSettings()
    const player = usePlayer()

    // C on the A string: a comfortable spot with room in every direction.
    const [reference, setReference] = useState<Position>({string: 1, fret: 3})
    const [selected, setSelected] = useState<string[]>(INTERVAL_PRESETS.basics!)

    const openString = tuning.strings[reference.string] ?? "E2"
    const referencePitch = pitchAt(openString, reference.fret)
    const referenceMidi = midiAt(openString, reference.fret)
    const referenceName = formatNote(referencePitch.replace(/\d+$/, ""), notation)

    const markers: FretMarker[] = [
        ...intervalPositions(tuning, reference, FRET_COUNT, selected).map(position => ({
            string: position.string,
            fret: position.fret,
            note: position.pitch,
            label: position.interval.label,
            isRoot: false,
            fillClass: INTERVAL_COLOURS[position.interval.id]?.fill,
            textClass: "fill-white",
        })),
        {string: reference.string, fret: reference.fret, note: referencePitch, label: "1", isRoot: true},
    ]

    const shapeText = (shape: IntervalShape) => {
        const frets = shape.fretOffset === 0
            ? t("intervals.shape.sameFret")
            : t(shape.fretOffset > 0 ? "intervals.shape.fretsUp" : "intervals.shape.fretsDown", {count: Math.abs(shape.fretOffset)})
        return shape.stringsUp === 0
            ? t("intervals.shape.sameString", {frets})
            : t(`intervals.shape.stringsUp${shape.stringsUp}`, {frets})
    }

    return (
        <div className="space-y-8">
            <PageHeader title={tCommon("nav.intervals")} description={<TermText text={t("intervals.description")}/>}/>

            <Card className="space-y-4">
                <p className="text-sm">
                    {t("intervals.reference")}{" "}
                    <strong className="text-lg">{referenceName}</strong>{" "}
                    <span className="text-stone-500">{t("intervals.position", {string: t(`intervals.strings.${reference.string}`), fret: reference.fret})}</span>
                </p>
                <IntervalPicker selected={selected} onChange={setSelected}/>
                <p className="text-xs text-stone-500">{t("intervals.clickHint")}</p>
            </Card>

            <Fretboard
                markers={markers}
                fretCount={FRET_COUNT}
                onPositionClick={(string, fret) => setReference({string, fret})}
                ariaLabel={t("intervals.boardLabel", {note: referenceName})}
            />

            <IntervalTable
                selected={selected}
                extraTitle={t("intervals.columns.shape", {string: t(`intervals.strings.${reference.string}`)})}
                extraCell={interval => intervalShapes(tuning, reference.string, interval.semitones).map(shapeText).join(" · ")}
                onMelodic={interval => void player.arpeggiate([referenceMidi, referenceMidi + interval.semitones])}
                onHarmonic={interval => void player.strum([referenceMidi, referenceMidi + interval.semitones])}
                footnote={t("intervals.gbHint")}
            />
        </div>
    )
}
