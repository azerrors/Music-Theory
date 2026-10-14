import {useState} from "react"
import {useSearchParams} from "react-router"
import {useTranslation} from "react-i18next"
import {ArrowLeft, ArrowRight, X} from "lucide-react"
import {Button} from "@/components/ui/button"
import {Card, CardTitle} from "@/components/ui/card"
import {Segmented} from "@/components/ui/segmented"
import {useSettings} from "@/hooks/useSettings"
import {
    BUILDER_SLOTS,
    BUILDER_TOURS,
    buildChord,
    DEFAULT_STATE,
    NONE,
    SLOT_OPTIONS,
    stateFromIntervals,
    stateIntervals,
    type BuilderSlot,
    type BuilderState,
    type BuiltChord,
} from "@/lib/theory/builder"
import {intervalToDegree} from "@/lib/theory/chords"
import {formatNote, rootToSlug, slugToRoot} from "@/lib/theory/notes"
import {cn} from "@/lib/utils"
import type {Notation, NoteName} from "@/types/music"
import {RootNotePicker} from "@/widgets/RootNotePicker"
import {Term, TermText} from "@/widgets/Term"

/** Glossary entry behind each floor's heading. */
const SLOT_TERMS: Record<BuilderSlot, string> = {
    third: "third",
    fifth: "fifth",
    seventh: "seventh",
    ninth: "extension",
    eleventh: "extension",
    thirteenth: "extension",
}

/** Short label of a choice: "♭3", "sus4", "9". */
export function optionLabel(value: string, none: string): string {
    if (value === NONE) return none
    if (value === "2M") return "sus2"
    if (value === "4P") return "sus4"
    return intervalToDegree(value)
}

export function chordTitle(root: NoteName, chord: BuiltChord, notation: Notation, t: (key: string) => string): string {
    if (chord.type) return formatNote(root, notation) + chord.type.suffix + (chord.impliedFifth ? ` (${t("builder.impliedFifth")})` : "")
    return chord.detected ?? t("builder.unnamed")
}

export interface BuilderChange {
    slot: BuilderSlot
    value: string
}

/**
 * The builder's state: root and floors live in the URL so a chord can be shared; the previous
 * chord, the last change and the tour only explain the last click, so they stay in memory.
 */
export function useChordBuilder() {
    const [params, setParams] = useSearchParams()
    const root = slugToRoot(params.get("root") ?? "") ?? "C"
    const intervalsParam = params.get("i")
    const state = intervalsParam !== null ? stateFromIntervals(intervalsParam.split(",").filter(Boolean)) : DEFAULT_STATE

    const [previous, setPrevious] = useState<BuilderState | null>(null)
    const [change, setChange] = useState<BuilderChange | null>(null)
    const [tour, setTour] = useState<{id: string; index: number} | null>(null)

    const apply = (next: BuilderState, nextChange: BuilderChange | null) => {
        setPrevious(state)
        setChange(nextChange)
        const nextParams = new URLSearchParams(params)
        nextParams.set("i", stateIntervals(next).slice(1).join(","))
        setParams(nextParams, {replace: true})
    }
    const setRoot = (note: NoteName) => {
        const nextParams = new URLSearchParams(params)
        nextParams.set("root", rootToSlug(note))
        setParams(nextParams, {replace: true})
    }
    const startTourStep = (id: string, index: number) => {
        const target = BUILDER_TOURS.find(item => item.id === id)?.steps[index]
        if (!target) return
        setTour({id, index})
        apply(target.state, null)
    }

    return {root, state, previous, change, tour, apply, setRoot, startTourStep, closeTour: () => setTour(null)}
}

interface TourCardProps {
    tour: {id: string; index: number} | null
    /** Text of a tour step; lets an instrument reword steps that mention the other one. */
    stepText: (tourId: string, index: number) => string
    onStep: (id: string, index: number) => void
    onClose: () => void
}

export function TourCard({tour, stepText, onStep, onClose}: TourCardProps) {
    const {t} = useTranslation("theory")
    const activeTour = tour ? BUILDER_TOURS.find(item => item.id === tour.id) : undefined

    return (
        <Card className="space-y-3">
            <CardTitle>{t("builder.tours.title")}</CardTitle>
            <div className="flex flex-wrap gap-2">
                {BUILDER_TOURS.map(item => (
                    <Button key={item.id} variant={tour?.id === item.id ? "primary" : "outline"} size="sm" onClick={() => onStep(item.id, 0)}>
                        {t(`builder.tours.${item.id}.title`)}
                    </Button>
                ))}
            </div>
            {activeTour && tour && (
                <div className="space-y-3 rounded-xl bg-brand-50 p-4 dark:bg-brand-950/40">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold tracking-wide text-brand-800 uppercase dark:text-brand-300">
                            {t("builder.tours.stepOf", {n: tour.index + 1, total: activeTour.steps.length})}
                        </p>
                        <button type="button" onClick={onClose} aria-label={t("builder.tours.close")} className="rounded-md p-1 text-stone-500 hover:bg-white/60 dark:hover:bg-stone-800">
                            <X className="size-4"/>
                        </button>
                    </div>
                    <p className="text-sm leading-relaxed"><TermText text={stepText(activeTour.id, tour.index)}/></p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={tour.index === 0} onClick={() => onStep(activeTour.id, tour.index - 1)}>
                            <ArrowLeft/> {t("builder.tours.prev")}
                        </Button>
                        {tour.index < activeTour.steps.length - 1
                            ? <Button size="sm" onClick={() => onStep(activeTour.id, tour.index + 1)}>{t("builder.tours.next")} <ArrowRight/></Button>
                            : <Button size="sm" onClick={onClose}>{t("builder.tours.finish")}</Button>}
                    </div>
                </div>
            )}
        </Card>
    )
}

interface SlotControlsProps {
    root: NoteName
    state: BuilderState
    onRoot: (root: NoteName) => void
    onChange: (next: BuilderState, change: BuilderChange) => void
}

/** Root picker plus one row of choices per floor. */
export function SlotControls({root, state, onRoot, onChange}: SlotControlsProps) {
    const {t} = useTranslation("theory")

    return (
        <Card className="space-y-5">
            <RootNotePicker value={root} onChange={onRoot}/>
            {BUILDER_SLOTS.map(slot => (
                <div key={slot} className="space-y-2">
                    <p className="text-xs font-semibold tracking-wide text-stone-500 uppercase">
                        <Term id={SLOT_TERMS[slot]}>{t(`builder.slots.${slot}`)}</Term>
                    </p>
                    <Segmented
                        label={t(`builder.slots.${slot}`)}
                        value={state[slot]}
                        onChange={value => onChange({...state, [slot]: value}, {slot, value})}
                        options={SLOT_OPTIONS[slot].map(value => ({value, label: optionLabel(value, t("builder.none"))}))}
                    />
                </div>
            ))}
        </Card>
    )
}

interface ChangeCardProps {
    root: NoteName
    title: string
    change: BuilderChange | null
    previous: BuilderState | null
    /** Explanation of a change; lets an instrument reword hints that mention the other one. */
    hintText: (change: BuilderChange) => string
}

export function ChangeCard({root, title, change, previous, hintText}: ChangeCardProps) {
    const {t} = useTranslation("theory")
    const {notation} = useSettings()

    return (
        <Card className="space-y-2">
            <CardTitle>{t("builder.change.title")}</CardTitle>
            <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">
                {change ? hintText(change) : t("builder.change.empty")}
            </p>
            {change && previous && (
                <p className="text-sm font-semibold">
                    {chordTitle(root, buildChord(root, previous), notation, t)} → {title}
                </p>
            )}
        </Card>
    )
}

/** The chord as a tower of thirds, 13 at the top and the root at the bottom; unused floors are dimmed. */
export function ThirdsLadder({root, state}: {root: NoteName; state: BuilderState}) {
    const {t} = useTranslation("theory")
    const {notation} = useSettings()
    const floors: {key: string; label: string; value: string}[] = [
        ...[...BUILDER_SLOTS].reverse().map(slot => ({key: slot, label: t(`builder.ladder.${slot}`), value: state[slot]})),
        {key: "root", label: "1", value: "1P"},
    ]
    const chord = buildChord(root, state)

    return (
        <Card className="space-y-3">
            <CardTitle>{t("builder.ladder.title")}</CardTitle>
            <ol className="space-y-1">
                {floors.map(floor => {
                    const isOn = floor.value !== NONE
                    const index = isOn ? chord.intervals.indexOf(floor.value) : -1
                    const note = index >= 0 ? chord.notes[index] : undefined
                    return (
                        <li
                            key={floor.key}
                            className={cn(
                                "grid grid-cols-[3rem_1fr_auto] items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors",
                                isOn
                                    ? floor.key === "root" ? "bg-brand-600 text-white" : "bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900"
                                    : "border border-dashed border-stone-300 text-stone-400 dark:border-stone-700",
                            )}
                        >
                            <span className="font-semibold tabular-nums">{isOn ? optionLabel(floor.value, "") || "1" : floor.label}</span>
                            <span className="truncate text-xs opacity-80">{floor.key === "root" ? t("builder.ladder.root") : t(`builder.slots.${floor.key}`)}</span>
                            <span className="font-bold">{note ? formatNote(note, notation) : "—"}</span>
                        </li>
                    )
                })}
            </ol>
            <p className="text-xs leading-relaxed text-stone-500"><TermText text={t("builder.ladder.hint")}/></p>
        </Card>
    )
}
