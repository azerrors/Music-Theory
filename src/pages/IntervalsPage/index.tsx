import {useState} from "react"
import {useTranslation} from "react-i18next"
import {Volume2} from "lucide-react"
import {Button} from "@/components/ui/button"
import {Card} from "@/components/ui/card"
import {usePlayer} from "@/hooks/usePlayer"
import {useSettings} from "@/hooks/useSettings"
import type {FretMarker} from "@/lib/theory/fretboard"
import {INTERVALS, intervalPositions, intervalShapes, type IntervalShape, type Position} from "@/lib/theory/intervals"
import {formatNote, midiAt, pitchAt} from "@/lib/theory/notes"
import {cn} from "@/lib/utils"
import {Fretboard} from "@/widgets/Fretboard"
import {PageHeader} from "@/widgets/PageHeader"
import {Term, TermText} from "@/widgets/Term"

const FRET_COUNT = 15

/** One colour per interval: `fill` for the fretboard dot, `bg` for chips and the table. */
const INTERVAL_COLOURS: Record<string, {fill: string; bg: string}> = {
    "1P": {fill: "fill-brand-600", bg: "bg-brand-600"},
    "2m": {fill: "fill-rose-700", bg: "bg-rose-700"},
    "2M": {fill: "fill-orange-600", bg: "bg-orange-600"},
    "3m": {fill: "fill-sky-600", bg: "bg-sky-600"},
    "3M": {fill: "fill-emerald-600", bg: "bg-emerald-600"},
    "4P": {fill: "fill-lime-700", bg: "bg-lime-700"},
    "4A": {fill: "fill-red-600", bg: "bg-red-600"},
    "5P": {fill: "fill-violet-600", bg: "bg-violet-600"},
    "6m": {fill: "fill-cyan-700", bg: "bg-cyan-700"},
    "6M": {fill: "fill-teal-600", bg: "bg-teal-600"},
    "7m": {fill: "fill-indigo-600", bg: "bg-indigo-600"},
    "7M": {fill: "fill-fuchsia-600", bg: "bg-fuchsia-600"},
    "8P": {fill: "fill-brand-800", bg: "bg-brand-800"},
}

const PRESETS: Record<string, string[]> = {
    triad: ["3m", "3M", "5P"],
    basics: ["3M", "5P", "8P"],
    all: INTERVALS.map(interval => interval.id).filter(id => id !== "1P"),
}

export default function IntervalsPage() {
    const {t} = useTranslation("theory")
    const {t: tCommon} = useTranslation()
    const {tuning, notation} = useSettings()
    const player = usePlayer()

    // C on the A string: a comfortable spot with room in every direction.
    const [reference, setReference] = useState<Position>({string: 1, fret: 3})
    const [selected, setSelected] = useState<string[]>(PRESETS.basics!)

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

    const toggle = (id: string) =>
        setSelected(current => (current.includes(id) ? current.filter(item => item !== id) : [...current, id]))

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
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm">
                        {t("intervals.reference")}{" "}
                        <strong className="text-lg">{referenceName}</strong>{" "}
                        <span className="text-stone-500">{t("intervals.position", {string: t(`intervals.strings.${reference.string}`), fret: reference.fret})}</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {Object.keys(PRESETS).map(preset => (
                            <Button key={preset} variant="outline" size="sm" onClick={() => setSelected(PRESETS[preset]!)}>
                                {t(`intervals.presets.${preset}`)}
                            </Button>
                        ))}
                        <Button variant="ghost" size="sm" onClick={() => setSelected([])}>{t("intervals.presets.none")}</Button>
                    </div>
                </div>

                <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("intervals.show")}>
                    {INTERVALS.filter(interval => interval.id !== "1P").map(interval => {
                        const isOn = selected.includes(interval.id)
                        return (
                            <button
                                key={interval.id}
                                type="button"
                                aria-pressed={isOn}
                                onClick={() => toggle(interval.id)}
                                title={t(`intervals.names.${interval.id}`)}
                                className={cn(
                                    "inline-flex h-8 min-w-10 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-sm font-semibold transition-colors",
                                    isOn
                                        ? cn("border-transparent text-white", INTERVAL_COLOURS[interval.id]?.bg)
                                        : "border-stone-300 text-stone-500 hover:border-stone-500 dark:border-stone-700",
                                )}
                            >
                                {interval.label}
                            </button>
                        )
                    })}
                </div>

                <p className="text-xs text-stone-500">{t("intervals.clickHint")}</p>
            </Card>

            <Fretboard
                markers={markers}
                fretCount={FRET_COUNT}
                onPositionClick={(string, fret) => setReference({string, fret})}
                ariaLabel={t("intervals.boardLabel", {note: referenceName})}
            />

            <section className="space-y-3">
                <h2 className="text-xl font-semibold tracking-tight"><Term id="interval">{t("intervals.tableTitle")}</Term></h2>
                <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
                    <table className="w-full text-left text-sm">
                        <thead className="text-xs tracking-wide text-stone-500 uppercase">
                            <tr className="border-b border-stone-200 dark:border-stone-800">
                                <th className="px-3 py-2.5">{t("intervals.columns.interval")}</th>
                                <th className="px-3 py-2.5">{t("intervals.columns.semitones")}</th>
                                <th className="px-3 py-2.5">{t("intervals.columns.feel")}</th>
                                <th className="px-3 py-2.5">{t("intervals.columns.shape", {string: t(`intervals.strings.${reference.string}`)})}</th>
                                <th className="px-3 py-2.5"><span className="sr-only">{t("intervals.columns.listen")}</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                            {INTERVALS.filter(interval => interval.id !== "1P").map(interval => {
                                const target = referenceMidi + interval.semitones
                                return (
                                    <tr key={interval.id} className={cn(!selected.includes(interval.id) && "text-stone-400")}>
                                        <td className="px-3 py-2">
                                            <span className="flex items-center gap-2">
                                                <span className={cn("grid h-6 min-w-8 place-items-center rounded-md px-1 text-xs font-bold text-white", INTERVAL_COLOURS[interval.id]?.bg)}>
                                                    {interval.label}
                                                </span>
                                                <span className="font-medium">{t(`intervals.names.${interval.id}`)}</span>
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 tabular-nums">{interval.semitones}</td>
                                        <td className="px-3 py-2">{t(`intervals.feel.${interval.id}`)}</td>
                                        <td className="px-3 py-2 text-xs">
                                            {intervalShapes(tuning, reference.string, interval.semitones).map(shapeText).join(" · ")}
                                        </td>
                                        <td className="px-3 py-2">
                                            <span className="flex gap-1">
                                                <Button variant="ghost" size="sm" onClick={() => void player.arpeggiate([referenceMidi, target])} aria-label={`${t("intervals.melodic")}: ${t(`intervals.names.${interval.id}`)}`}>
                                                    <Volume2/> {t("intervals.melodic")}
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => void player.strum([referenceMidi, target])} aria-label={`${t("intervals.harmonic")}: ${t(`intervals.names.${interval.id}`)}`}>
                                                    {t("intervals.harmonic")}
                                                </Button>
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
                <p className="text-xs text-stone-500">{t("intervals.gbHint")}</p>
            </section>
        </div>
    )
}
