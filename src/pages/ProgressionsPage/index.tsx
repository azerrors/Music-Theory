import {useState} from "react"
import {useTranslation} from "react-i18next"
import {Loader2, Play, RotateCcw, Volume2, X} from "lucide-react"
import {Button} from "@/components/ui/button"
import {Segmented} from "@/components/ui/segmented"
import {usePlayer} from "@/hooks/usePlayer"
import {useSettings} from "@/hooks/useSettings"
import {PROGRESSION_STEP_SECONDS} from "@/lib/audio/guitarSynth"
import {getChordInfo} from "@/lib/theory/chords"
import {formatNote} from "@/lib/theory/notes"
import type {KeyMode, ProgressionPreset} from "@/lib/theory/progressions"
import type {FretMarker} from "@/lib/theory/fretboard"
import {getScaleInfo, scaleMidi} from "@/lib/theory/scales"
import {SOLO_SCALE_KINDS, soloPositions, soloScaleId, type SoloRole, type SoloScaleKind} from "@/lib/theory/solo"
import {slashVoicings} from "@/lib/theory/slash"
import {getVoicings, voicingMidi} from "@/lib/theory/voicings"
import {cn} from "@/lib/utils"
import {PATHS} from "@/router/paths"
import type {NoteName, Voicing} from "@/types/music"
import {ChordDiagram} from "@/widgets/ChordDiagram"
import {Fretboard} from "@/widgets/Fretboard"
import {FUNCTION_STYLES} from "@/widgets/FunctionStyles"
import {PageHeader} from "@/widgets/PageHeader"
import {
    AddChordTile,
    FunctionLegend,
    KeyChordsSection,
    KeySection,
    PresetSection,
    resolve,
    StepEditor,
    useProgressionKey,
    usePlayingIndex,
    useProgressionSteps,
    type ResolvedStep,
} from "@/widgets/Progression"
import {StepHeading} from "@/widgets/StepHeading"
import {TermText} from "@/widgets/Term"

/** A resolved step with the chord shape a guitarist would grab first. */
interface GuitarStep extends ResolvedStep {
    voicing?: Voicing
}

function withVoicing(step: ResolvedStep): GuitarStep {
    return {...step, voicing: (step.bass ? slashVoicings(step.root, step.type, step.bass) : getVoicings(step.root, step.type))[0]}
}

interface StepTileProps {
    index: number
    step: GuitarStep
    isSelected: boolean
    isPlaying: boolean
    canRemove: boolean
    onSelect: () => void
    onRemove: () => void
}

function StepTile({index, step, isSelected, isPlaying, canRemove, onSelect, onRemove}: StepTileProps) {
    const {t} = useTranslation("theory")
    const player = usePlayer()
    const chordNotes = getChordInfo(step.root, step.type)?.notes ?? []

    return (
        <div
            className={cn(
                "relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-colors dark:bg-base-900",
                isSelected ? "border-brand-500 ring-2 ring-brand-500/30" : "border-base-200 dark:border-base-800",
                isPlaying && "ring-4 ring-brand-400/60",
            )}
        >
            <span className={cn("h-1.5 w-full", FUNCTION_STYLES[step.fn].bar)} title={t(`progressions.functions.${step.fn}`)}/>
            <button type="button" onClick={onSelect} aria-pressed={isSelected} className="flex flex-col items-center gap-1 px-3 pt-2 pb-1">
                <span className="self-start text-[11px] font-medium text-base-400 tabular-nums">{index + 1}</span>
                <span className="text-sm font-semibold text-brand-700 dark:text-brand-400">{step.roman}</span>
                <span className="text-lg leading-tight font-bold tracking-tight">{step.name}</span>
                {step.voicing && (
                    <ChordDiagram
                        voicing={step.voicing}
                        root={step.root}
                        chordNotes={step.bass ? [...chordNotes, step.bass] : chordNotes}
                        title={step.name}
                        className="max-w-36"
                    />
                )}
            </button>
            <div className="mt-auto flex items-center justify-center gap-1 border-t border-base-100 p-1.5 dark:border-base-800">
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    disabled={!step.voicing}
                    onClick={() => step.voicing && void player.strum(voicingMidi(step.voicing))}
                    aria-label={`${t("progressions.listen")} ${step.name}`}
                >
                    <Volume2/>
                </Button>
                {canRemove && (
                    <Button variant="ghost" size="icon" className="size-8" onClick={onRemove} aria-label={t("progressions.remove", {chord: step.name})}>
                        <X/>
                    </Button>
                )}
            </div>
        </div>
    )
}

const SOLO_STYLES: Record<SoloRole, Pick<FretMarker, "fillClass" | "textClass" | "small">> = {
    chordRoot: {fillClass: "fill-brand-600", textClass: "fill-on-brand"},
    chordTone: {fillClass: "fill-brand-100 stroke-brand-400 dark:fill-brand-900 dark:stroke-brand-500", textClass: "fill-brand-900 dark:fill-brand-100"},
    outside: {fillClass: "fill-rose-600", textClass: "fill-white"},
    scale: {fillClass: "fill-base-300 dark:fill-base-700", textClass: "fill-base-700 dark:fill-base-200", small: true},
}

const SOLO_LEGEND: {role: SoloRole; swatch: string}[] = [
    {role: "chordRoot", swatch: "bg-brand-600"},
    {role: "chordTone", swatch: "bg-base-800 dark:bg-base-100"},
    {role: "outside", swatch: "bg-rose-600"},
    {role: "scale", swatch: "bg-base-300 dark:bg-base-700"},
]

/**
 * Where to play over the chord that is selected (or sounding): the key's scale in the
 * background, the chord's own notes on top — the notes a solo is safest landing on.
 */
function SoloMap({tonic, mode, step, isPlaying}: {tonic: NoteName; mode: KeyMode; step: ResolvedStep; isPlaying: boolean}) {
    const {t} = useTranslation("theory")
    const {tuning, notation} = useSettings()
    const [kind, setKind] = useState<SoloScaleKind>("pentatonic")

    const scale = getScaleInfo(tonic, soloScaleId(mode, kind))
    const chord = getChordInfo(step.root, step.type)
    if (!scale || !chord) return null

    const markers: FretMarker[] = soloPositions(tuning, 15, scale.notes, chord.notes, chord.degrees).map(position => ({
        string: position.string,
        fret: position.fret,
        note: position.note,
        isRoot: position.role === "chordRoot",
        label: position.degree ?? formatNote(position.note, notation),
        ...SOLO_STYLES[position.role],
    }))
    const scaleName = `${formatNote(tonic, notation)} ${t(`scales.${scale.def.id}`)}`

    return (
        <section className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight">{t("progressions.solo.title")}</h2>
                    <p className="text-sm text-base-600 dark:text-base-400"><TermText text={t("progressions.solo.hint", {scale: scaleName})}/></p>
                </div>
                <Segmented
                    label={t("progressions.solo.title")}
                    value={kind}
                    onChange={setKind}
                    options={SOLO_SCALE_KINDS.map(value => ({value, label: t(`progressions.solo.kinds.${value}`)}))}
                />
            </div>
            <p className="text-sm">
                <span className="text-base-500">{t(isPlaying ? "progressions.solo.playing" : "progressions.solo.selected")}</span>{" "}
                <strong className="text-lg">{step.name}</strong>{" "}
                <span className="font-semibold text-brand-700 dark:text-brand-400">{step.roman}</span>
            </p>
            <Fretboard markers={markers} ariaLabel={`${t("progressions.solo.title")}: ${step.name}`}/>
            <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-base-600 dark:text-base-400">
                {SOLO_LEGEND.map(item => (
                    <li key={item.role} className="flex items-center gap-1.5">
                        <span className={cn("size-3 rounded-full", item.swatch)}/> {t(`progressions.solo.roles.${item.role}`)}
                    </li>
                ))}
            </ul>
        </section>
    )
}

/** Holds the editable steps; remounted (via `key`) whenever the mode or preset changes. */
function ProgressionEditor({tonic, mode, preset}: {tonic: NoteName; mode: KeyMode; preset: ProgressionPreset}) {
    const {t} = useTranslation("theory")
    const {notation} = useSettings()
    const player = usePlayer()
    const {steps, selected, setSelected, replace, remove, append, reset} = useProgressionSteps(tonic, preset)
    const {playing, follow} = usePlayingIndex()

    const resolved = steps.map(step => withVoicing(resolve(tonic, mode, step, notation)))
    const selectedIndex = Math.min(selected, resolved.length - 1)
    const selectedStep = resolved[selectedIndex]

    const playAll = async () => {
        const chords = resolved.map(step => (step.voicing ? voicingMidi(step.voicing) : []))
        await player.strumSequence(chords)
        // Light up each chord while it rings.
        follow(chords.length, PROGRESSION_STEP_SECONDS)
    }

    return (
        <>
            <section className="space-y-4">
                <StepHeading number={3} title={t("progressions.steps.play")}>
                    <div className="flex gap-2">
                        <Button variant="outline" size="md" onClick={reset}>
                            <RotateCcw/> {t("progressions.reset")}
                        </Button>
                        <Button size="md" onClick={() => void playAll()} disabled={steps.length === 0}>
                            {player.isLoading ? <Loader2 className="animate-spin"/> : <Play/>}
                            {t("progressions.playAll")}
                        </Button>
                    </div>
                </StepHeading>
                <p className="text-sm text-base-600 dark:text-base-400">
                    <strong className="font-semibold text-base-900 dark:text-base-100">{t(`progressions.presets.${preset.id}`)}.</strong>{" "}
                    <TermText text={t(`progressions.presetHints.${preset.id}`)}/> {t("progressions.editHint")}
                </p>

                <FunctionLegend/>

                <div className="grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-3">
                    {resolved.map((step, index) => (
                        <StepTile
                            key={index}
                            index={index}
                            step={step}
                            isSelected={index === selectedIndex}
                            isPlaying={index === playing}
                            canRemove={steps.length > 1}
                            onSelect={() => setSelected(index)}
                            onRemove={() => remove(index)}
                        />
                    ))}
                    <AddChordTile tonic={tonic} mode={mode} onAdd={append}/>
                </div>

                {selectedStep && (
                    <StepEditor
                        key={selectedIndex}
                        index={selectedIndex}
                        step={selectedStep}
                        tonic={tonic}
                        mode={mode}
                        canRemove={steps.length > 1}
                        chordPath={PATHS.chord(selectedStep.root, selectedStep.type, selectedStep.bass)}
                        onPick={chord => replace(selectedIndex, chord)}
                        onRemove={() => remove(selectedIndex)}
                    />
                )}
            </section>

            {selectedStep && (
                <SoloMap tonic={tonic} mode={mode} step={resolved[playing ?? selectedIndex] ?? selectedStep} isPlaying={playing !== null}/>
            )}

            <KeyChordsSection tonic={tonic} mode={mode} onAdd={append}/>
        </>
    )
}

export default function ProgressionsPage() {
    const {t} = useTranslation("theory")
    const {t: tCommon} = useTranslation()
    const {tonic, mode, presets, preset, update} = useProgressionKey()

    return (
        <div className="space-y-10">
            <PageHeader title={tCommon("nav.progressions")} description={<TermText text={t("progressions.description")}/>}/>
            <KeySection tonic={tonic} mode={mode} instrument="guitar" scaleMidi={scaleMidi(getScaleInfo(tonic, mode)!)} onChange={update}/>
            <PresetSection tonic={tonic} presets={presets} active={preset} onSelect={id => update({preset: id})}/>
            <ProgressionEditor key={`${mode}-${preset.id}`} tonic={tonic} mode={mode} preset={preset}/>
        </div>
    )
}
