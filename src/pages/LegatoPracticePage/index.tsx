import {useMemo, useState, type ReactNode} from "react"
import {useTranslation} from "react-i18next"
import {ChevronLeft, ChevronRight} from "lucide-react"
import {Button} from "@/components/ui/button"
import {Card} from "@/components/ui/card"
import {Segmented} from "@/components/ui/segmented"
import {Select} from "@/components/ui/select"
import {Switch} from "@/components/ui/switch"
import {SCALE_GROUPS, SCALES} from "@/constants/scales"
import {useSettings} from "@/hooks/useSettings"
import {
    LEGATO_MOVES,
    LEGATO_PATTERNS,
    legatoExercise,
    PATTERN_FINGERS,
    positionStrings,
    SCALE_RUNS,
    scaleRun,
    type LegatoGroup,
    type LegatoMove,
    type LegatoPattern,
    type ScaleRun,
} from "@/lib/practice/legato"
import type {FretMarker} from "@/lib/theory/fretboard"
import {formatNote, pitchAt} from "@/lib/theory/notes"
import {scalePositions} from "@/lib/theory/positions"
import {getScaleInfo} from "@/lib/theory/scales"
import {Fretboard} from "@/widgets/Fretboard"
import {LegatoTab} from "@/widgets/LegatoTab"
import {PageHeader} from "@/widgets/PageHeader"
import {RootNotePicker} from "@/widgets/RootNotePicker"

type Section = "patterns" | "scales"

/** First-finger frets offered as start and end points. */
const FRETS = Array.from({length: 12}, (_, index) => index + 1)
/** The diagonal from the 12th fret reaches the 20th. */
const MAX_FRET_COUNT = 24

/** Seven-note scales only: three notes per string is where the 1-3-4 grip lives. */
const SEVEN_NOTE_GROUPS = SCALE_GROUPS.filter(group => group !== "pentatonic")

const GRIP_FILL = {fillClass: "fill-brand-600", textClass: "fill-on-brand"}
const OTHER_FILL = {fillClass: "fill-brand-100 stroke-brand-400 dark:fill-brand-900 dark:stroke-brand-500", textClass: "fill-brand-900 dark:fill-brand-100"}
const FAINT_FILL = {fillClass: "fill-base-300/80 dark:fill-base-700/80", textClass: "fill-base-600 dark:fill-base-300"}

const pitchClass = (pitch: string) => pitch.replace(/-?\d+$/, "")

function Field({label, children}: {label: string, children: ReactNode}) {
    return (
        <div className="space-y-2">
            <span aria-hidden="true" className="block text-xs font-semibold tracking-wide text-base-500 uppercase">{label}</span>
            {children}
        </div>
    )
}

/** 1-3-4 legato: the grip moved around the neck in set patterns, and inside three-notes-per-string scales. */
export default function LegatoPracticePage() {
    const {t} = useTranslation()
    const {t: tTheory} = useTranslation("theory")
    const {tuning, notation} = useSettings()
    const stringCount = tuning.strings.length
    const [section, setSection] = useState<Section>("patterns")

    // Patterns along the neck.
    const [pattern, setPattern] = useState<LegatoPattern>("upDown")
    const [move, setMove] = useState<LegatoMove>("alongString")
    const [string, setString] = useState(0)
    const [from, setFrom] = useState(1)
    const [to, setTo] = useState(12)

    // Inside a scale.
    const [root, setRoot] = useState("A")
    const [scaleId, setScaleId] = useState("minor")
    const [positionNumber, setPositionNumber] = useState(1)
    const [run, setRun] = useState<ScaleRun>("up")
    const [onlyGrip, setOnlyGrip] = useState(false)

    const [step, setStep] = useState(0)

    const scale = useMemo(() => getScaleInfo(root, scaleId), [root, scaleId])
    const positions = useMemo(() => (scale ? scalePositions(scale, tuning) : []), [scale, tuning])
    const position = positions[positionNumber - 1] ?? positions[0]
    const strings = useMemo(() => (position ? positionStrings(position) : []), [position])
    const gripStrings = strings.filter(item => item.isGrip)
    const isGripString = (at: number) => gripStrings.some(item => item.string === at)

    const groups: LegatoGroup[] = useMemo(() => {
        if (section === "scales") return scaleRun(onlyGrip ? gripStrings : strings, run)
        return legatoExercise(pattern, move, {string, from, to, stringCount})
        // eslint-disable-next-line react-hooks/exhaustive-deps -- gripStrings is derived from strings
    }, [section, onlyGrip, strings, run, pattern, move, string, from, to, stringCount])

    const current = Math.min(step, Math.max(groups.length - 1, 0))
    const selected = groups[current] ?? []
    // Any change of exercise starts again from its first step.
    const reset = <T, >(setter: (value: T) => void) => (value: T) => {
        setter(value)
        setStep(0)
    }

    const allNotes = groups.flat()
    const fretCount = Math.min(MAX_FRET_COUNT, Math.max(12, ...allNotes.map(note => note.fret)))

    const markers = useMemo(() => {
        const byPlace = new Map<string, FretMarker>()
        const place = (at: number, fret: number, marker: Omit<FretMarker, "string" | "fret" | "note" | "isRoot">) => {
            byPlace.set(`${at}-${fret}`, {string: at, fret, note: pitchClass(pitchAt(tuning.strings[at] ?? "E2", fret)), isRoot: false, ...marker})
        }
        if (section === "scales") {
            // The whole position in small dots, the selected string full size; 1-3-4 strings stand out.
            strings.forEach(item => item.notes.forEach(note => place(item.string, note.fret, {label: String(note.finger), small: true, ...(item.isGrip ? GRIP_FILL : OTHER_FILL)})))
        } else {
            // The rest of the route as faint dots, so the path up the neck shows.
            allNotes.forEach(note => place(note.string, note.fret, {label: "", small: true, ...FAINT_FILL}))
        }
        selected.forEach(note => {
            const grip = section === "patterns" ? note.finger >= 3 : isGripString(note.string)
            place(note.string, note.fret, {label: String(note.finger), ...(grip ? GRIP_FILL : OTHER_FILL)})
        })
        return [...byPlace.values()]
        // eslint-disable-next-line react-hooks/exhaustive-deps -- isGripString and allNotes follow strings and groups
    }, [section, strings, groups, selected, tuning])

    const stringNumber = (at: number) => stringCount - at
    const stringNames = tuning.strings.map(open => formatNote(pitchClass(open), notation))
    const first = selected[0]

    return (
        <div className="space-y-6">
            <PageHeader title={t("legato.title")} description={t("legato.description")}/>

            <Segmented
                label={t("legato.title")}
                value={section}
                onChange={reset(setSection)}
                options={[
                    {value: "patterns", label: t("legato.sections.patterns")},
                    {value: "scales", label: t("legato.sections.scales")},
                ]}
            />

            {section === "patterns" ? (
                <Card className="space-y-5">
                    <Field label={t("legato.pattern")}>
                        <Segmented
                            label={t("legato.pattern")}
                            value={pattern}
                            onChange={reset(setPattern)}
                            options={LEGATO_PATTERNS.map(id => ({value: id, label: PATTERN_FINGERS[id].join("‑")}))}
                        />
                    </Field>
                    <Field label={t("legato.move")}>
                        <Segmented
                            label={t("legato.move")}
                            value={move}
                            onChange={reset(setMove)}
                            options={LEGATO_MOVES.map(id => ({value: id, label: t(`legato.moves.${id}`)}))}
                        />
                    </Field>
                    <div className="flex flex-wrap items-end gap-x-6 gap-y-5">
                        {move === "alongString" && (
                            <Field label={t("legato.string")}>
                                <Segmented
                                    label={t("legato.string")}
                                    value={String(string)}
                                    onChange={value => reset(setString)(Number(value))}
                                    options={tuning.strings.map((_, at) => ({value: String(at), label: String(stringNumber(at))})).reverse()}
                                />
                            </Field>
                        )}
                        <Field label={move === "alongString" || move === "zigzag" ? t("legato.from") : t("legato.fret")}>
                            <Select
                                label={t("legato.from")}
                                value={String(from)}
                                onChange={value => reset(setFrom)(Number(value))}
                                options={FRETS.map(fret => ({value: String(fret), label: String(fret)}))}
                                className="w-24"
                            />
                        </Field>
                        {(move === "alongString" || move === "zigzag") && (
                            <Field label={t("legato.to")}>
                                <Select
                                    label={t("legato.to")}
                                    value={String(to)}
                                    onChange={value => reset(setTo)(Number(value))}
                                    options={FRETS.map(fret => ({value: String(fret), label: String(fret)}))}
                                    className="w-24"
                                />
                            </Field>
                        )}
                    </div>
                </Card>
            ) : (
                <Card className="space-y-5">
                    <div className="flex flex-wrap items-end gap-x-6 gap-y-5">
                        <Field label={tTheory("scale")}>
                            <Select
                                label={tTheory("scale")}
                                value={scaleId}
                                onChange={reset(setScaleId)}
                                groups={SEVEN_NOTE_GROUPS.map(group => ({
                                    label: tTheory(`scaleGroups.${group}`),
                                    options: SCALES.filter(item => item.group === group).map(item => ({value: item.id, label: tTheory(`scales.${item.id}`)})),
                                }))}
                                className="w-56"
                            />
                        </Field>
                        <Field label={t("legato.position")}>
                            <Segmented
                                label={t("legato.position")}
                                value={String(positionNumber)}
                                onChange={value => reset(setPositionNumber)(Number(value))}
                                options={positions.map(item => ({value: String(item.number), label: String(item.number)}))}
                            />
                        </Field>
                    </div>
                    <RootNotePicker value={root} onChange={reset(setRoot)}/>
                    <Field label={t("legato.run")}>
                        <Segmented
                            label={t("legato.run")}
                            value={run}
                            onChange={reset(setRun)}
                            options={SCALE_RUNS.map(id => ({value: id, label: t(`legato.runs.${id}`)}))}
                        />
                    </Field>
                    <label className="flex items-center gap-3 text-sm font-medium">
                        <Switch checked={onlyGrip} onChange={reset(setOnlyGrip)} aria-label={t("legato.onlyGrip")}/>
                        {t("legato.onlyGrip")}
                    </label>
                    <p className="text-sm text-base-600 dark:text-base-400">
                        {gripStrings.length > 0
                            ? t("legato.gripStrings", {list: gripStrings.map(item => stringNumber(item.string)).reverse().join(", ")})
                            : t("legato.noGrip")}
                    </p>
                </Card>
            )}

            <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-medium text-base-600 tabular-nums dark:text-base-400">
                        {t("legato.step", {current: groups.length ? current + 1 : 0, total: groups.length})}
                        {first && <> · {t("legato.at", {string: stringNumber(first.string), fret: Math.min(...selected.map(note => note.fret))})}</>}
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setStep(current - 1)} disabled={current === 0} aria-label={t("legato.prev")}>
                            <ChevronLeft/> {t("legato.prev")}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setStep(current + 1)} disabled={current >= groups.length - 1} aria-label={t("legato.next")}>
                            {t("legato.next")} <ChevronRight/>
                        </Button>
                    </div>
                </div>
                <Fretboard markers={markers} fretCount={fretCount} ariaLabel={t("legato.title")}/>
            </section>

            <Card className="space-y-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="text-lg font-semibold tracking-tight">{t("legato.tab")}</h2>
                    <p className="text-xs text-base-500">{t("legato.legend")}</p>
                </div>
                {groups.length > 0
                    ? <LegatoTab groups={groups} stringCount={stringCount} stringNames={stringNames} selected={current} onSelect={setStep} label={t("legato.tab")}/>
                    : <p className="text-sm text-base-500">{t("legato.noGrip")}</p>}
            </Card>
        </div>
    )
}
