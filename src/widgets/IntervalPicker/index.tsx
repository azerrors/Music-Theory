import type {ReactNode} from "react"
import {useTranslation} from "react-i18next"
import {Volume2} from "lucide-react"
import {Button} from "@/components/ui/button"
import {INTERVALS, type IntervalDef} from "@/lib/theory/intervals"
import {cn} from "@/lib/utils"
import {Term} from "@/widgets/Term"

/** One colour per interval: `fill` for dots on the neck or keys, `bg` for chips and the table. */
export const INTERVAL_COLOURS: Record<string, {fill: string; bg: string}> = {
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

export const INTERVAL_PRESETS: Record<string, string[]> = {
    triad: ["3m", "3M", "5P"],
    basics: ["3M", "5P", "8P"],
    all: INTERVALS.map(interval => interval.id).filter(id => id !== "1P"),
}

/** Everything above the unison: the intervals one can show or play. */
export const SHOWN_INTERVALS = INTERVALS.filter(interval => interval.id !== "1P")

/** Preset buttons plus one toggle chip per interval. */
export function IntervalPicker({selected, onChange}: {selected: string[]; onChange: (selected: string[]) => void}) {
    const {t} = useTranslation("theory")
    const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter(item => item !== id) : [...selected, id])

    return (
        <>
            <div className="flex flex-wrap gap-1.5">
                {Object.keys(INTERVAL_PRESETS).map(preset => (
                    <Button key={preset} variant="outline" size="sm" onClick={() => onChange(INTERVAL_PRESETS[preset]!)}>
                        {t(`intervals.presets.${preset}`)}
                    </Button>
                ))}
                <Button variant="ghost" size="sm" onClick={() => onChange([])}>{t("intervals.presets.none")}</Button>
            </div>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("intervals.show")}>
                {SHOWN_INTERVALS.map(interval => {
                    const isOn = selected.includes(interval.id)
                    return (
                        <button
                            key={interval.id}
                            type="button"
                            aria-pressed={isOn}
                            onClick={() => toggle(interval.id)}
                            title={t(`intervals.names.${interval.id}`)}
                            className={cn(
                                "inline-flex h-8 min-w-10 items-center justify-center gap-1.5 rounded-lg border px-2.5 text-sm font-semibold transition-colors pointer-coarse:h-10 pointer-coarse:min-w-11",
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
        </>
    )
}

interface IntervalTableProps {
    selected: string[]
    /** Heading of the instrument's own column: a shape on the strings, or the note on the keys. */
    extraTitle: string
    extraCell: (interval: IntervalDef) => ReactNode
    onMelodic: (interval: IntervalDef) => void
    onHarmonic: (interval: IntervalDef) => void
    footnote?: ReactNode
}

/** Every interval with its size, sound and a play button; unselected rows are dimmed. */
export function IntervalTable({selected, extraTitle, extraCell, onMelodic, onHarmonic, footnote}: IntervalTableProps) {
    const {t} = useTranslation("theory")

    return (
        <section className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight"><Term id="interval">{t("intervals.tableTitle")}</Term></h2>
            {/* `relative` keeps the visually hidden header inside the scroller; without it the page itself scrolls sideways on phones. */}
            <div className="relative overflow-x-auto rounded-xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
                <table className="w-full text-left text-sm">
                    <thead className="text-xs tracking-wide text-stone-500 uppercase">
                        <tr className="border-b border-stone-200 dark:border-stone-800">
                            <th className="px-3 py-2.5">{t("intervals.columns.interval")}</th>
                            <th className="px-3 py-2.5">{t("intervals.columns.semitones")}</th>
                            <th className="px-3 py-2.5">{t("intervals.columns.feel")}</th>
                            <th className="px-3 py-2.5">{extraTitle}</th>
                            <th className="px-3 py-2.5"><span className="sr-only">{t("intervals.columns.listen")}</span></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                        {SHOWN_INTERVALS.map(interval => (
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
                                <td className="px-3 py-2 text-xs">{extraCell(interval)}</td>
                                <td className="px-3 py-2">
                                    <span className="flex gap-1">
                                        <Button variant="ghost" size="sm" onClick={() => onMelodic(interval)} aria-label={`${t("intervals.melodic")}: ${t(`intervals.names.${interval.id}`)}`}>
                                            <Volume2/> {t("intervals.melodic")}
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => onHarmonic(interval)} aria-label={`${t("intervals.harmonic")}: ${t(`intervals.names.${interval.id}`)}`}>
                                            {t("intervals.harmonic")}
                                        </Button>
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {footnote && <p className="text-xs text-stone-500">{footnote}</p>}
        </section>
    )
}
