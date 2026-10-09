import {useState} from "react"
import {Link, useSearchParams} from "react-router"
import {useTranslation} from "react-i18next"
import {ArrowLeft, ArrowRight, GitCompareArrows, Loader2, Volume2, X} from "lucide-react"
import {Button} from "@/components/ui/button"
import {Card, CardTitle} from "@/components/ui/card"
import {Segmented} from "@/components/ui/segmented"
import {usePlayer} from "@/hooks/usePlayer"
import {useSettings} from "@/hooks/useSettings"
import {
    BUILDER_SLOTS,
    BUILDER_TOURS,
    buildChord,
    builderMidi,
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
import {markersForTones, zipTones} from "@/lib/theory/fretboard"
import {formatNote, rootToSlug, slugToRoot} from "@/lib/theory/notes"
import {getVoicings} from "@/lib/theory/voicings"
import {cn} from "@/lib/utils"
import {PATHS} from "@/router/paths"
import type {Notation, NoteName} from "@/types/music"
import {ChordDiagram} from "@/widgets/ChordDiagram"
import {Fretboard} from "@/widgets/Fretboard"
import {PageHeader} from "@/widgets/PageHeader"
import {RootNotePicker} from "@/widgets/RootNotePicker"
import {Term, TermText} from "@/widgets/Term"
import {ToneTable} from "@/widgets/ToneTable"

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
function optionLabel(value: string, none: string): string {
    if (value === NONE) return none
    if (value === "2M") return "sus2"
    if (value === "4P") return "sus4"
    return intervalToDegree(value)
}

function chordTitle(root: NoteName, chord: BuiltChord, notation: Notation, t: (key: string) => string): string {
    if (chord.type) return formatNote(root, notation) + chord.type.suffix + (chord.impliedFifth ? ` (${t("builder.impliedFifth")})` : "")
    return chord.detected ?? t("builder.unnamed")
}

interface Change {
    slot: BuilderSlot
    value: string
}

export default function BuilderPage() {
    const {t} = useTranslation("theory")
    const {t: tCommon} = useTranslation()
    const {notation, tuning} = useSettings()
    const player = usePlayer()
    const [params, setParams] = useSearchParams()

    const root = slugToRoot(params.get("root") ?? "") ?? "C"
    const intervalsParam = params.get("i")
    const state = intervalsParam !== null ? stateFromIntervals(intervalsParam.split(",").filter(Boolean)) : DEFAULT_STATE

    // The previous chord and what changed live outside the URL: they only explain the last click.
    const [previous, setPrevious] = useState<BuilderState | null>(null)
    const [change, setChange] = useState<Change | null>(null)
    const [tour, setTour] = useState<{id: string; index: number} | null>(null)

    const apply = (next: BuilderState, nextChange: Change | null) => {
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
        const steps = BUILDER_TOURS.find(item => item.id === id)?.steps ?? []
        const target = steps[index]
        if (!target) return
        setTour({id, index})
        apply(target.state, null)
    }

    const chord = buildChord(root, state)
    const title = chordTitle(root, chord, notation, t)
    const voicing = chord.type ? getVoicings(root, chord.type.symbol)[0] : undefined
    const markers = markersForTones(tuning, 15, zipTones(chord.notes, chord.degrees))
    const activeTour = tour ? BUILDER_TOURS.find(item => item.id === tour.id) : undefined

    return (
        <div className="space-y-8">
            <PageHeader title={tCommon("nav.builder")} description={<TermText text={t("builder.description")}/>}/>

            <Card className="space-y-3">
                <CardTitle>{t("builder.tours.title")}</CardTitle>
                <div className="flex flex-wrap gap-2">
                    {BUILDER_TOURS.map(item => (
                        <Button
                            key={item.id}
                            variant={tour?.id === item.id ? "primary" : "outline"}
                            size="sm"
                            onClick={() => startTourStep(item.id, 0)}
                        >
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
                            <button type="button" onClick={() => setTour(null)} aria-label={t("builder.tours.close")} className="rounded-md p-1 text-stone-500 hover:bg-white/60 dark:hover:bg-stone-800">
                                <X className="size-4"/>
                            </button>
                        </div>
                        <p className="text-sm leading-relaxed">
                            <TermText text={t(`builder.tours.${activeTour.id}.steps.${tour.index}`, {name: title})}/>
                        </p>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" disabled={tour.index === 0} onClick={() => startTourStep(activeTour.id, tour.index - 1)}>
                                <ArrowLeft/> {t("builder.tours.prev")}
                            </Button>
                            {tour.index < activeTour.steps.length - 1
                                ? <Button size="sm" onClick={() => startTourStep(activeTour.id, tour.index + 1)}>{t("builder.tours.next")} <ArrowRight/></Button>
                                : <Button size="sm" onClick={() => setTour(null)}>{t("builder.tours.finish")}</Button>}
                        </div>
                    </div>
                )}
            </Card>

            <div className="grid items-start gap-6 lg:grid-cols-[1fr_20rem]">
                <div className="min-w-0 space-y-6">
                    <Card className="space-y-4 lg:sticky lg:top-20 lg:z-10">
                        <div className="flex flex-wrap items-end justify-between gap-3">
                            <div>
                                <p className="text-4xl font-bold tracking-tight">{title}</p>
                                <p className="text-sm text-stone-500">
                                    {chord.type ? t(`chordTypes.${chord.type.symbol}`) : t("builder.unnamedHint")}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button size="sm" onClick={() => void player.strum(builderMidi(root, state))}>
                                    {player.isLoading ? <Loader2 className="animate-spin"/> : <Volume2/>} {t("builder.playChord")}
                                </Button>
                                <Button variant="secondary" size="sm" onClick={() => void player.arpeggiate(builderMidi(root, state))}>
                                    {t("builder.playNotes")}
                                </Button>
                                {previous && (
                                    <Button variant="secondary" size="sm" onClick={() => void player.strumSequence([builderMidi(root, previous), builderMidi(root, state)])}>
                                        <GitCompareArrows/> {t("builder.compare")}
                                    </Button>
                                )}
                            </div>
                        </div>
                        <ToneTable notes={chord.notes} degrees={chord.degrees}/>
                    </Card>

                    <Card className="space-y-5">
                        <RootNotePicker value={root} onChange={setRoot}/>
                        {BUILDER_SLOTS.map(slot => (
                            <div key={slot} className="space-y-2">
                                <p className="text-xs font-semibold tracking-wide text-stone-500 uppercase">
                                    <Term id={SLOT_TERMS[slot]}>{t(`builder.slots.${slot}`)}</Term>
                                </p>
                                <Segmented
                                    label={t(`builder.slots.${slot}`)}
                                    value={state[slot]}
                                    onChange={value => apply({...state, [slot]: value}, {slot, value})}
                                    options={SLOT_OPTIONS[slot].map(value => ({value, label: optionLabel(value, t("builder.none"))}))}
                                />
                            </div>
                        ))}
                    </Card>
                </div>

                <aside className="space-y-6">
                    <ThirdsLadder root={root} state={state}/>

                    <Card className="space-y-2">
                        <CardTitle>{t("builder.change.title")}</CardTitle>
                        <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">
                            {change ? t(`builder.hints.${change.slot}.${change.value}`) : t("builder.change.empty")}
                        </p>
                        {change && previous && (
                            <p className="text-sm font-semibold">
                                {chordTitle(root, buildChord(root, previous), notation, t)} → {title}
                            </p>
                        )}
                    </Card>

                    <Card className="flex flex-col items-center gap-3">
                        {voicing && chord.type
                            ? (
                                <>
                                    <ChordDiagram voicing={voicing} root={root} chordNotes={chord.notes} title={title}/>
                                    {chord.impliedFifth && <p className="text-center text-xs text-stone-500">{t("builder.diagramWithFifth")}</p>}
                                    <Link to={PATHS.chord(root, chord.type.symbol)} className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline dark:text-brand-400">
                                        {t("builder.openChord")} <ArrowRight className="size-4"/>
                                    </Link>
                                </>
                            )
                            : <p className="py-6 text-center text-sm text-stone-500">{t("builder.noDiagram")}</p>}
                    </Card>
                </aside>
            </div>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold tracking-tight">{t("onFretboard")}</h2>
                <Fretboard markers={markers} ariaLabel={`${title} — ${t("onFretboard")}`}/>
            </section>
        </div>
    )
}

/** The chord as a tower of thirds, 13 at the top and the root at the bottom; unused floors are dimmed. */
function ThirdsLadder({root, state}: {root: NoteName; state: BuilderState}) {
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
