import {useEffect, useRef, useState} from "react"
import {Link, useSearchParams} from "react-router"
import {useTranslation} from "react-i18next"
import {ChevronRight, Plus, Trash2} from "lucide-react"
import {Button, buttonVariants} from "@/components/ui/button"
import {Card} from "@/components/ui/card"
import {Segmented} from "@/components/ui/segmented"
import type {Instrument} from "@/hooks/useInstrument"
import {useSettings} from "@/hooks/useSettings"
import {formatChordName, getChordInfo} from "@/lib/theory/chords"
import {chroma, formatNote, rootToSlug, slugToRoot} from "@/lib/theory/notes"
import {
    chordAlternatives,
    chordRoman,
    chromaticChords,
    diatonicChords,
    harmonicFunction,
    KEY_MODES,
    presetsForMode,
    presetSteps,
    resolveBass,
    resolveStep,
    slashAlternatives,
    stepFor,
    type ChordSource,
    type HarmonicFunction,
    type KeyChord,
    type KeyMode,
    type ProgressionPreset,
    type ProgressionStep,
} from "@/lib/theory/progressions"
import {getScaleInfo} from "@/lib/theory/scales"
import {cn} from "@/lib/utils"
import type {Notation, NoteName} from "@/types/music"
import {FUNCTION_STYLES, FUNCTIONS} from "@/widgets/FunctionStyles"
import {PlayButton} from "@/widgets/PlayButton"
import {RootNotePicker} from "@/widgets/RootNotePicker"
import {StepHeading} from "@/widgets/StepHeading"
import {Term, TermText} from "@/widgets/Term"
import {ToneTable} from "@/widgets/ToneTable"

export const OUTSIDE_SOURCES: ChordSource[] = ["secondary", "harmonic", "borrowed"]

/** Outside the key only the everyday chord types are offered; exotic colours there are more noise than help. */
const CORE_OUTSIDE_TYPES = new Set(["M", "m", "7", "maj7", "m7", "dim", "dim7", "m7b5", "m6"])

export interface ChordRef {
    root: NoteName
    type: string
    bass?: NoteName
}

/** A step with its notes worked out for the current key. */
export interface ResolvedStep extends ChordRef {
    name: string
    roman: string
    fn: HarmonicFunction
}

export function resolve(tonic: NoteName, mode: KeyMode, step: ProgressionStep, notation: Notation): ResolvedStep {
    const root = resolveStep(tonic, step)
    const bass = resolveBass(tonic, step)
    const chord = getChordInfo(root, step.type, bass)
    return {
        root,
        type: step.type,
        bass,
        name: chord ? formatChordName(chord, notation) : root + step.type,
        roman: chordRoman(tonic, mode, root, step.type, bass),
        fn: harmonicFunction(tonic, mode, root, step.type),
    }
}

function sameChord(a: ChordRef, b: ChordRef): boolean {
    return chroma(a.root) === chroma(b.root) && a.type === b.type && (a.bass ? chroma(a.bass) : -1) === (b.bass ? chroma(b.bass) : -1)
}

/** Key, mode and preset live in the URL so a progression can be shared. */
export function useProgressionKey() {
    const [params, setParams] = useSearchParams()

    const tonic = slugToRoot(params.get("key") ?? "") ?? "C"
    const modeParam = params.get("mode") as KeyMode | null
    const mode: KeyMode = modeParam && KEY_MODES.includes(modeParam) ? modeParam : "major"
    const presets = presetsForMode(mode)
    const preset = presets.find(item => item.id === params.get("preset")) ?? presets[0]!

    const update = (patch: {key?: NoteName; mode?: KeyMode; preset?: string}) => {
        const next = new URLSearchParams(params)
        if (patch.key) next.set("key", rootToSlug(patch.key))
        if (patch.mode) {
            next.set("mode", patch.mode)
            next.delete("preset")
        }
        if (patch.preset) next.set("preset", patch.preset)
        setParams(next, {replace: true})
    }

    return {tonic, mode, presets, preset, update}
}

/** The editable chord list. Mount it under a `key` of mode + preset so a new preset starts fresh. */
export function useProgressionSteps(tonic: NoteName, preset: ProgressionPreset) {
    const [steps, setSteps] = useState<ProgressionStep[]>(() => presetSteps(preset, tonic))
    const [selected, setSelected] = useState(0)

    const replace = (index: number, chord: ChordRef) =>
        setSteps(current => current.map((item, i) => (i === index ? stepFor(tonic, chord) : item)))
    const remove = (index: number) => {
        setSteps(current => current.filter((_, i) => i !== index))
        setSelected(current => Math.max(0, current >= index ? current - 1 : current))
    }
    const append = (chord: ChordRef) => {
        setSteps(current => [...current, stepFor(tonic, chord)])
        setSelected(steps.length)
    }
    const reset = () => setSteps(presetSteps(preset, tonic))

    return {steps, selected, setSelected, replace, remove, append, reset}
}

/** Which chord is sounding during "play all", so its tile can light up. */
export function usePlayingIndex() {
    const [playing, setPlaying] = useState<number | null>(null)
    const timers = useRef<number[]>([])

    const clear = () => {
        timers.current.forEach(window.clearTimeout)
        timers.current = []
    }
    useEffect(() => clear, [])

    const follow = (count: number, stepSeconds: number) => {
        clear()
        for (let index = 0; index < count; index++) {
            timers.current.push(window.setTimeout(() => setPlaying(index), index * stepSeconds * 1000))
        }
        timers.current.push(window.setTimeout(() => setPlaying(null), count * stepSeconds * 1000))
    }

    return {playing, follow}
}

interface KeySectionProps {
    tonic: NoteName
    mode: KeyMode
    instrument: Instrument
    /** The scale to play, one octave up. */
    scaleMidi: number[]
    onChange: (patch: {key?: NoteName; mode?: KeyMode}) => void
}

/** Step 1: mode and tonic, with the key's scale. */
export function KeySection({tonic, mode, instrument, scaleMidi, onChange}: KeySectionProps) {
    const {t} = useTranslation("theory")
    const {notation} = useSettings()
    const scale = getScaleInfo(tonic, mode)!
    const keyName = `${formatNote(tonic, notation)} ${t(`progressions.modes.${mode}`)}`

    return (
        <section className="space-y-4">
            <StepHeading number={1} title={t("progressions.steps.key")}/>
            <Card className="space-y-5">
                <div className="space-y-2">
                    <p className="text-xs font-semibold tracking-wide text-stone-500 uppercase"><Term id="mode">{t("progressions.mode")}</Term></p>
                    <Segmented
                        label={t("progressions.mode")}
                        value={mode}
                        onChange={value => onChange({mode: value})}
                        options={KEY_MODES.map(value => ({value, label: `${t(`progressions.modes.${value}`)} · ${t(`progressions.modeHints.${value}`)}`}))}
                    />
                </div>
                <RootNotePicker value={tonic} onChange={value => onChange({key: value})}/>
                <div className="space-y-3 border-t border-stone-200 pt-4 dark:border-stone-800">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-lg font-bold tracking-tight">{keyName}</p>
                        <PlayButton instrument={instrument} midi={scaleMidi} mode="arpeggio" label={t("progressions.playScale")}/>
                    </div>
                    <ToneTable notes={scale.notes} degrees={scale.degrees}/>
                </div>
            </Card>
        </section>
    )
}

function PresetCard({preset, tonic, isActive, onSelect}: {preset: ProgressionPreset; tonic: NoteName; isActive: boolean; onSelect: () => void}) {
    const {t} = useTranslation("theory")
    const {notation} = useSettings()
    const steps = presetSteps(preset, tonic).map(step => resolve(tonic, preset.mode, step, notation))

    return (
        <button
            type="button"
            onClick={onSelect}
            aria-pressed={isActive}
            className={cn(
                "flex flex-col gap-1 rounded-xl border p-3 text-left transition-colors",
                isActive
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-950/40"
                    : "border-stone-200 bg-white hover:border-stone-400 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-600",
            )}
        >
            <span className="font-semibold">{t(`progressions.presets.${preset.id}`)}</span>
            <span className="text-xs font-medium text-brand-700 dark:text-brand-400">{steps.map(step => step.roman).join(" – ")}</span>
            <span className="text-xs text-stone-500">{steps.map(step => step.name).join(" – ")}</span>
        </button>
    )
}

/** Step 2: the ready-made progressions of the mode. */
export function PresetSection({tonic, presets, active, onSelect}: {tonic: NoteName; presets: ProgressionPreset[]; active: ProgressionPreset; onSelect: (id: string) => void}) {
    const {t} = useTranslation("theory")

    return (
        <section className="space-y-4">
            <StepHeading number={2} title={t("progressions.steps.preset")}/>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {presets.map(item => (
                    <PresetCard key={item.id} preset={item} tonic={tonic} isActive={item.id === active.id} onSelect={() => onSelect(item.id)}/>
                ))}
            </div>
        </section>
    )
}

export function FunctionLegend() {
    const {t} = useTranslation("theory")
    return (
        <div className="space-y-2 rounded-xl border border-stone-200 bg-white p-4 text-sm dark:border-stone-800 dark:bg-stone-900">
            <div className="grid gap-2 sm:grid-cols-3">
                {FUNCTIONS.map(fn => (
                    <div key={fn} className="flex items-start gap-2">
                        <span className={cn("mt-1 h-3 w-6 shrink-0 rounded-full", FUNCTION_STYLES[fn].bar)}/>
                        <p className="text-stone-600 dark:text-stone-400">
                            <strong className="font-semibold text-stone-900 dark:text-stone-100"><Term id={fn}>{t(`progressions.functions.${fn}`)}</Term></strong>
                            {" — "}{t(`progressions.functionHints.${fn}`)}
                        </p>
                    </div>
                ))}
            </div>
            <p className="text-xs text-stone-500"><TermText text={t("progressions.howToRead")}/></p>
        </div>
    )
}

interface OptionGroupProps {
    title: string
    hint: string
    options: KeyChord[]
    current: ResolvedStep
    onPick: (chord: KeyChord) => void
    /** Splits the options under small headings by source (secondary dominant, borrowed…). */
    bySource?: boolean
}

function OptionChips({options, current, onPick}: Pick<OptionGroupProps, "options" | "current" | "onPick">) {
    const {notation} = useSettings()
    return (
        <div className="flex flex-wrap gap-1.5">
            {options.map(option => {
                const isCurrent = sameChord(option, current)
                const name = formatChordName({root: option.root, type: getChordInfo(option.root, option.type)!.type, bass: option.bass}, notation)
                return (
                    <button
                        key={`${option.root}-${option.type}-${option.bass ?? ""}`}
                        type="button"
                        onClick={() => onPick(option)}
                        aria-pressed={isCurrent}
                        className={cn(
                            "flex items-baseline gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm transition-colors pointer-coarse:py-2.5",
                            isCurrent
                                ? "border-brand-600 bg-brand-600 text-white"
                                : "border-stone-300 bg-white hover:border-stone-500 dark:border-stone-700 dark:bg-stone-900 dark:hover:border-stone-500",
                        )}
                    >
                        <span className="font-semibold">{name}</span>
                        <span className={cn("text-xs", isCurrent ? "text-brand-100" : "text-stone-500")}>{option.roman}</span>
                    </button>
                )
            })}
        </div>
    )
}

function OptionGroup({title, hint, options, current, onPick, bySource}: OptionGroupProps) {
    const {t} = useTranslation("theory")
    if (options.length === 0) return null

    return (
        <div className="space-y-2">
            <div>
                <h4 className="text-sm font-semibold">{title}</h4>
                <p className="text-xs text-stone-500"><TermText text={hint}/></p>
            </div>
            {bySource
                ? OUTSIDE_SOURCES.map(source => {
                    const items = options.filter(option => option.source === source)
                    if (items.length === 0) return null
                    return (
                        <div key={source} className="space-y-1">
                            <p className="text-[11px] font-semibold tracking-wide text-stone-400 uppercase">{t(`progressions.sources.${source}`)}</p>
                            <OptionChips options={items} current={current} onPick={onPick}/>
                        </div>
                    )
                })
                : <OptionChips options={options} current={current} onPick={onPick}/>}
        </div>
    )
}

interface StepEditorProps {
    index: number
    step: ResolvedStep
    tonic: NoteName
    mode: KeyMode
    canRemove: boolean
    /** The chord's page in the current instrument's section. */
    chordPath: string
    onPick: (chord: ChordRef) => void
    onRemove: () => void
}

/** The panel under the timeline: "what else could go here?" for the selected chord. */
export function StepEditor({index, step, tonic, mode, canRemove, chordPath, onPick, onRemove}: StepEditorProps) {
    const {t} = useTranslation("theory")
    const {notation} = useSettings()
    const chord = getChordInfo(step.root, step.type, step.bass)

    const keyChords = diatonicChords(tonic, mode)
    const sameRoot = chordAlternatives(tonic, mode, step.root)
    const colours = sameRoot.filter(option => option.source === "diatonic")
    const outside = sameRoot.filter(option => OUTSIDE_SOURCES.includes(option.source) && CORE_OUTSIDE_TYPES.has(option.type))
    const basses = slashAlternatives(tonic, mode, step.root, step.type)
    const plain: KeyChord = {root: step.root, type: step.type, roman: chordRoman(tonic, mode, step.root, step.type), source: "diatonic"}

    return (
        <Card className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                    <p className="text-xs font-semibold tracking-wide text-stone-500 uppercase">{t("progressions.selected", {n: index + 1})}</p>
                    <p className="text-2xl font-bold tracking-tight">
                        {step.name} <span className="text-lg font-semibold text-brand-700 dark:text-brand-400">{step.roman}</span>
                    </p>
                    {chord && (
                        <p className="text-sm text-stone-600 dark:text-stone-400">
                            {t("notes")}: {chord.notes.map(note => formatNote(note, notation)).join(" · ")}
                            {chord.bass && <> · {t("slash.bass")} {formatNote(chord.bass, notation)}</>}
                        </p>
                    )}
                    <p className="flex items-center gap-2 text-sm">
                        <span className={cn("rounded-md px-2 py-0.5 text-xs font-semibold", FUNCTION_STYLES[step.fn].chip)}>
                            <Term id={step.fn}>{t(`progressions.functions.${step.fn}`)}</Term>
                        </span>
                        <span className="text-stone-600 dark:text-stone-400">{t(`progressions.functionHints.${step.fn}`)}</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link to={chordPath} className={buttonVariants({variant: "outline", size: "md"})}>
                        {t("progressions.openChord")} <ChevronRight/>
                    </Link>
                    {canRemove && (
                        <Button variant="ghost" size="md" onClick={onRemove}>
                            <Trash2/> {t("progressions.removeShort")}
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
                <OptionGroup title={t("progressions.groups.key.title")} hint={t("progressions.groups.key.hint")} options={keyChords} current={step} onPick={onPick}/>
                <OptionGroup title={t("progressions.groups.colour.title")} hint={t("progressions.groups.colour.hint")} options={colours} current={step} onPick={onPick}/>
                <OptionGroup
                    title={t("progressions.groups.bass.title")}
                    hint={t("progressions.groups.bass.hint")}
                    options={basses.length > 0 ? [plain, ...basses] : []}
                    current={step}
                    onPick={onPick}
                />
                <OptionGroup title={t("progressions.groups.outside.title")} hint={t("progressions.groups.outside.hint")} options={outside} current={step} onPick={onPick} bySource/>
            </div>
        </Card>
    )
}

function KeyChordTable({tonic, mode, onAdd}: {tonic: NoteName; mode: KeyMode; onAdd: (chord: KeyChord) => void}) {
    const {t} = useTranslation("theory")
    const {notation} = useSettings()
    const triads = diatonicChords(tonic, mode)
    const sevenths = diatonicChords(tonic, mode, true)

    const cell = (chord: KeyChord) => {
        const name = formatChordName({root: chord.root, type: getChordInfo(chord.root, chord.type)!.type}, notation)
        return (
            <button
                type="button"
                onClick={() => onAdd(chord)}
                title={t("progressions.add", {chord: name})}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium hover:bg-stone-100 pointer-coarse:py-2.5 dark:hover:bg-stone-800"
            >
                {name} <Plus className="size-3 text-stone-400"/>
            </button>
        )
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
            <table className="w-full text-center text-sm">
                <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                    <tr>
                        <th scope="row" className="px-4 py-2.5 text-left font-medium text-stone-500"><Term id="romanNumerals">{t("progressions.keyTable.degree")}</Term></th>
                        {triads.map(chord => <td key={chord.roman} className="px-2 py-2.5 font-semibold">{chord.roman}</td>)}
                    </tr>
                    <tr>
                        <th scope="row" className="px-4 py-2.5 text-left font-medium text-stone-500"><Term id="harmonicFunction">{t("progressions.keyTable.function")}</Term></th>
                        {triads.map(chord => {
                            const fn = harmonicFunction(tonic, mode, chord.root, chord.type)
                            return (
                                <td key={chord.roman} className="px-2 py-2.5">
                                    <span className={cn("rounded-md px-1.5 py-0.5 text-xs font-semibold", FUNCTION_STYLES[fn].chip)}>
                                        {t(`progressions.functionShort.${fn}`)}
                                    </span>
                                </td>
                            )
                        })}
                    </tr>
                    <tr>
                        <th scope="row" className="px-4 py-2.5 text-left font-medium text-stone-500"><Term id="triad">{t("diatonic.triad")}</Term></th>
                        {triads.map(chord => <td key={chord.roman} className="px-1 py-1.5">{cell(chord)}</td>)}
                    </tr>
                    <tr>
                        <th scope="row" className="px-4 py-2.5 text-left font-medium text-stone-500"><Term id="seventhChord">{t("diatonic.seventh")}</Term></th>
                        {sevenths.map(chord => <td key={chord.roman} className="px-1 py-1.5">{cell(chord)}</td>)}
                    </tr>
                </tbody>
            </table>
        </div>
    )
}

function ChromaticChords({tonic, mode, onAdd}: {tonic: NoteName; mode: KeyMode; onAdd: (chord: KeyChord) => void}) {
    const {t} = useTranslation("theory")
    const {notation} = useSettings()
    const chords = chromaticChords(tonic, mode)

    return (
        <details className="group rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
            <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold">
                <ChevronRight className="size-4 transition-transform group-open:rotate-90"/>
                {t("progressions.chromatic.title")}
                <span className="text-xs font-normal text-stone-500">{t("progressions.chromatic.badge")}</span>
            </summary>
            <div className="mt-4 space-y-4">
                <p className="text-sm text-stone-600 dark:text-stone-400"><TermText text={t(`progressions.chromatic.hint.${mode}`)}/></p>
                {OUTSIDE_SOURCES.map(source => {
                    const items = chords.filter(chord => chord.source === source)
                    if (items.length === 0) return null
                    return (
                        <div key={source} className="space-y-2">
                            <h4 className="text-sm font-semibold">
                                {t(`progressions.sources.${source}`)}
                                <span className="ml-2 font-normal text-stone-500">{t(`progressions.sourceHints.${source}`)}</span>
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                                {items.map(chord => {
                                    const name = formatChordName({root: chord.root, type: getChordInfo(chord.root, chord.type)!.type}, notation)
                                    return (
                                        <button
                                            key={`${chroma(chord.root)}-${chord.type}`}
                                            type="button"
                                            onClick={() => onAdd(chord)}
                                            title={t("progressions.add", {chord: name})}
                                            className="flex items-baseline gap-1.5 rounded-lg border border-stone-300 px-2.5 py-1.5 text-sm hover:border-stone-500 pointer-coarse:py-2.5 dark:border-stone-700"
                                        >
                                            <span className="font-semibold">{name}</span>
                                            <span className="text-xs text-stone-500">{chord.roman}</span>
                                            <Plus className="size-3 self-center text-stone-400"/>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>
        </details>
    )
}

/** The key's chords to add from, plus the chromatic ones behind a disclosure. */
export function KeyChordsSection({tonic, mode, onAdd}: {tonic: NoteName; mode: KeyMode; onAdd: (chord: KeyChord) => void}) {
    const {t} = useTranslation("theory")

    return (
        <section className="space-y-3">
            <div>
                <h2 className="text-xl font-semibold tracking-tight">{t("progressions.keyTable.title")}</h2>
                <p className="text-sm text-stone-600 dark:text-stone-400"><TermText text={t("progressions.keyTable.hint")}/></p>
            </div>
            <KeyChordTable tonic={tonic} mode={mode} onAdd={onAdd}/>
            <ChromaticChords tonic={tonic} mode={mode} onAdd={onAdd}/>
        </section>
    )
}

/** Dashed tile at the end of the timeline that appends the key's tonic chord. */
export function AddChordTile({tonic, mode, onAdd, className}: {tonic: NoteName; mode: KeyMode; onAdd: (chord: KeyChord) => void; className?: string}) {
    const {t} = useTranslation("theory")
    return (
        <button
            type="button"
            onClick={() => onAdd(diatonicChords(tonic, mode)[0]!)}
            className={cn(
                "flex min-h-40 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-stone-300 text-sm font-medium text-stone-500 hover:border-brand-400 hover:text-brand-700 dark:border-stone-700 dark:hover:text-brand-400",
                className,
            )}
        >
            <Plus className="size-5"/>
            {t("progressions.addChord")}
        </button>
    )
}
