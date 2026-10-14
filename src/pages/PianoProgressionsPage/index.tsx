import {useState} from "react"
import {useSearchParams} from "react-router"
import {useTranslation} from "react-i18next"
import {Loader2, Play, RotateCcw, Volume2, X} from "lucide-react"
import {Button} from "@/components/ui/button"
import {Card} from "@/components/ui/card"
import {Segmented} from "@/components/ui/segmented"
import {usePianoPlayer} from "@/hooks/usePianoPlayer"
import {useSettings} from "@/hooks/useSettings"
import {SEQUENCE_STEP_SECONDS} from "@/lib/audio/pianoSampler"
import {commonTones, soloKeys, voiceProgression, VOICING_STYLES, type HandsVoicing, type SoloRole, type VoicingStyle} from "@/lib/piano/progressions"
import {chordFingering, fingerMap} from "@/lib/piano/fingering"
import {handScaleMidi} from "@/lib/piano/scales"
import {keyboardRange, voicingNotes} from "@/lib/piano/voicings"
import {getChordInfo, type ChordInfo} from "@/lib/theory/chords"
import {chroma, formatNote, mod12} from "@/lib/theory/notes"
import type {KeyMode, ProgressionPreset} from "@/lib/theory/progressions"
import {getScaleInfo} from "@/lib/theory/scales"
import {SOLO_SCALE_KINDS, soloScaleId, type SoloScaleKind} from "@/lib/theory/solo"
import {cn} from "@/lib/utils"
import {PIANO_PATHS} from "@/router/paths"
import type {NoteName} from "@/types/music"
import {FUNCTION_STYLES} from "@/widgets/FunctionStyles"
import {PageHeader} from "@/widgets/PageHeader"
import {PianoKeyboard, type KeyMarker} from "@/widgets/PianoKeyboard"
import {PlayButton} from "@/widgets/PlayButton"
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

/** Two octaves from middle C: where the right hand improvises over the chords. */
const SOLO_FROM = 60
const SOLO_TO = 83

interface PianoStep extends ResolvedStep {
    info: ChordInfo | null
    hands: HandsVoicing
}

/** Note name of a key, spelled the way the chord spells it. */
function keyLabel(midi: number, chord: ChordInfo | null, notation: "letter" | "solfege"): string {
    const spelled = chord && [...chord.notes, ...(chord.bass ? [chord.bass] : [])].find(note => chroma(note) === mod12(midi))
    return spelled ? formatNote(spelled, notation) : ""
}

function handMarkers(step: PianoStep, notation: "letter" | "solfege", withLabels: boolean): KeyMarker[] {
    const leftFingers = fingerMap(step.hands.left, "left")
    const rightFingers = fingerMap(step.hands.right, "right")
    const rootChroma = chroma(step.root)
    const marker = (midi: number, isLeftHand: boolean): KeyMarker => ({
        midi,
        label: withLabels ? keyLabel(midi, step.info, notation) : "",
        isLeftHand,
        isRoot: !isLeftHand && mod12(midi) === rootChroma,
        finger: withLabels ? (isLeftHand ? leftFingers : rightFingers).get(midi) : undefined,
    })
    return [...step.hands.left.map(midi => marker(midi, true)), ...step.hands.right.map(midi => marker(midi, false))]
}

interface StepTileProps {
    index: number
    step: PianoStep
    /** Shared by every tile, so the right hand's moves line up from tile to tile. */
    range: {from: number; to: number}
    isSelected: boolean
    isPlaying: boolean
    canRemove: boolean
    onSelect: () => void
    onRemove: () => void
}

function StepTile({index, step, range, isSelected, isPlaying, canRemove, onSelect, onRemove}: StepTileProps) {
    const {t} = useTranslation("theory")
    const {t: tPiano} = useTranslation("piano")
    const {notation} = useSettings()
    const player = usePianoPlayer()
    // Tiles show the right hand only: it is the hand that moves between inversions.
    const markers = handMarkers({...step, hands: {left: [], right: step.hands.right}}, notation, false)

    return (
        <div
            className={cn(
                "relative flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-colors dark:bg-stone-900",
                isSelected ? "border-brand-500 ring-2 ring-brand-500/30" : "border-stone-200 dark:border-stone-800",
                isPlaying && "ring-4 ring-brand-400/60",
            )}
        >
            <span className={cn("h-1.5 w-full", FUNCTION_STYLES[step.fn].bar)} title={t(`progressions.functions.${step.fn}`)}/>
            <button type="button" onClick={onSelect} aria-pressed={isSelected} className="flex flex-col items-center gap-1 px-3 pt-2 pb-2">
                <span className="self-start text-[11px] font-medium text-stone-400 tabular-nums">{index + 1}</span>
                <span className="text-sm font-semibold text-brand-700 dark:text-brand-400">{step.roman}</span>
                <span className="text-lg leading-tight font-bold tracking-tight">{step.name}</span>
                <PianoKeyboard from={range.from} to={range.to} markers={markers} minKeyWidth={6} showOctaves={false} ariaLabel={step.name} className="mt-1"/>
                <span className="text-xs text-stone-500">
                    {step.hands.right.map(midi => keyLabel(midi, step.info, notation)).join(" ")}
                    {" · "}{tPiano("progressions.bass")} {keyLabel(step.hands.left[0] ?? 0, step.info, notation)}
                </span>
                <span className="text-xs font-semibold text-stone-700 tabular-nums dark:text-stone-300">
                    {tPiano("fingers.tile")}: {chordFingering(step.hands.right, "right")?.join(" ") ?? "—"}
                    {" · "}<span className="text-sky-600 dark:text-sky-400">{chordFingering(step.hands.left, "left")?.join(" ") ?? "—"}</span>
                </span>
            </button>
            <div className="mt-auto flex items-center justify-center gap-1 border-t border-stone-100 p-1.5 dark:border-stone-800">
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => void player.chord(voicingNotes(step.hands))}
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

/** The selected (or sounding) chord on a full keyboard with both hands, and what it keeps from the chord before. */
function HandsPanel({step, previous, range, isPlaying}: {step: PianoStep; previous?: PianoStep; range: {from: number; to: number}; isPlaying: boolean}) {
    const {t} = useTranslation("theory")
    const {t: tPiano} = useTranslation("piano")
    const {notation} = useSettings()
    const player = usePianoPlayer()
    const held = commonTones(previous?.hands.right, step.hands.right)

    return (
        <Card className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-0.5">
                    <p className="text-xs font-semibold tracking-wide text-stone-500 uppercase">{tPiano("progressions.onKeys")}</p>
                    <p className="text-sm">
                        <span className="text-stone-500">{t(isPlaying ? "progressions.solo.playing" : "progressions.solo.selected")}</span>{" "}
                        <strong className="text-lg">{step.name}</strong>{" "}
                        <span className="font-semibold text-brand-700 dark:text-brand-400">{step.roman}</span>
                    </p>
                    <p className="text-sm text-stone-600 dark:text-stone-400">
                        {!previous
                            ? tPiano("progressions.first")
                            : held.length > 0
                                ? tPiano("progressions.held", {count: held.length, notes: held.map(midi => keyLabel(midi, step.info, notation)).join(", ")})
                                : tPiano("progressions.noneHeld")}
                    </p>
                </div>
                <PlayButton instrument="piano" midi={voicingNotes(step.hands)}/>
            </div>
            <PianoKeyboard
                from={range.from}
                to={range.to}
                markers={handMarkers(step, notation, true)}
                onKeyClick={midi => void player.note(midi)}
                ariaLabel={`${step.name} — ${tPiano("progressions.onKeys")}`}
                className="mx-auto max-w-3xl"
            />
            <div className="flex flex-wrap gap-4 text-xs text-stone-600 dark:text-stone-400">
                <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-full bg-brand-600"/>{tPiano("legend.root")}</span>
                <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-full bg-stone-800 ring-1 ring-stone-500"/>{tPiano("legend.right")}</span>
                <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-full bg-sky-600"/>{tPiano("legend.left")}</span>
                <span className="basis-full">{tPiano("fingers.legend")}</span>
            </div>
        </Card>
    )
}

const SOLO_FILL: Record<SoloRole, string | undefined> = {
    chordRoot: undefined,
    chordTone: undefined,
    outside: "fill-rose-600",
    scale: undefined,
}

const SOLO_LEGEND: {role: SoloRole; swatch: string}[] = [
    {role: "chordRoot", swatch: "bg-brand-600"},
    {role: "chordTone", swatch: "bg-stone-800 ring-1 ring-stone-500"},
    {role: "outside", swatch: "bg-rose-600"},
    {role: "scale", swatch: "bg-stone-300"},
]

/** Right-hand improvising over the selected (or sounding) chord: the key's scale, the chord's notes on top. */
function SoloKeys({tonic, mode, step, isPlaying}: {tonic: NoteName; mode: KeyMode; step: PianoStep; isPlaying: boolean}) {
    const {t} = useTranslation("theory")
    const {t: tPiano} = useTranslation("piano")
    const {notation} = useSettings()
    const player = usePianoPlayer()
    const [kind, setKind] = useState<SoloScaleKind>("pentatonic")

    const scale = getScaleInfo(tonic, soloScaleId(mode, kind))
    const chord = getChordInfo(step.root, step.type)
    if (!scale || !chord) return null

    const markers: KeyMarker[] = soloKeys(scale.notes, chord, SOLO_FROM, SOLO_TO).map(key => ({
        midi: key.midi,
        label: key.degree ?? formatNote(key.note, notation),
        isRoot: key.role === "chordRoot",
        subtle: key.role === "scale",
        fillClass: SOLO_FILL[key.role],
    }))
    const scaleName = `${formatNote(tonic, notation)} ${t(`scales.${scale.def.id}`)}`

    return (
        <section className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight">{t("progressions.solo.title")}</h2>
                    <p className="text-sm text-stone-600 dark:text-stone-400"><TermText text={tPiano("progressions.soloHint", {scale: scaleName})}/></p>
                </div>
                <Segmented
                    label={t("progressions.solo.title")}
                    value={kind}
                    onChange={setKind}
                    options={SOLO_SCALE_KINDS.map(value => ({value, label: t(`progressions.solo.kinds.${value}`)}))}
                />
            </div>
            <p className="text-sm">
                <span className="text-stone-500">{t(isPlaying ? "progressions.solo.playing" : "progressions.solo.selected")}</span>{" "}
                <strong className="text-lg">{step.name}</strong>{" "}
                <span className="font-semibold text-brand-700 dark:text-brand-400">{step.roman}</span>
            </p>
            <Card className="min-w-0">
                <PianoKeyboard
                    from={SOLO_FROM}
                    to={SOLO_TO}
                    markers={markers}
                    onKeyClick={midi => void player.note(midi)}
                    ariaLabel={`${t("progressions.solo.title")}: ${step.name}`}
                    className="mx-auto max-w-3xl"
                />
            </Card>
            <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-stone-600 dark:text-stone-400">
                {SOLO_LEGEND.map(item => (
                    <li key={item.role} className="flex items-center gap-1.5">
                        <span className={cn("size-3 rounded-full", item.swatch)}/> {t(`progressions.solo.roles.${item.role}`)}
                    </li>
                ))}
            </ul>
        </section>
    )
}

interface ProgressionEditorProps {
    tonic: NoteName
    mode: KeyMode
    preset: ProgressionPreset
    style: VoicingStyle
    onStyleChange: (style: VoicingStyle) => void
}

/** Holds the editable steps; remounted (via `key`) whenever the mode or preset changes. */
function ProgressionEditor({tonic, mode, preset, style, onStyleChange}: ProgressionEditorProps) {
    const {t} = useTranslation("theory")
    const {t: tPiano} = useTranslation("piano")
    const {notation} = useSettings()
    const player = usePianoPlayer()
    const {steps, selected, setSelected, replace, remove, append, reset} = useProgressionSteps(tonic, preset)
    const {playing, follow} = usePlayingIndex()

    const resolvedSteps = steps.map(step => resolve(tonic, mode, step, notation))
    const infos = resolvedSteps.map(step => getChordInfo(step.root, step.type, step.bass))
    // Voice the whole progression at once: each right hand depends on the one before it.
    const voiced = voiceProgression(infos.filter((info): info is ChordInfo => info !== null), style)
    let voicedIndex = 0
    const resolved: PianoStep[] = resolvedSteps.map((step, index) => {
        const info = infos[index] ?? null
        return {...step, info, hands: info ? voiced[voicedIndex++]! : {left: [], right: []}}
    })

    const tileRange = keyboardRange(resolved.flatMap(step => step.hands.right), 1)
    const handsRange = keyboardRange(resolved.flatMap(step => voicingNotes(step.hands)), 3)
    const selectedIndex = Math.min(selected, resolved.length - 1)
    const shownIndex = playing ?? selectedIndex
    const shown = resolved[shownIndex]

    const playAll = async () => {
        await player.sequence(resolved.map(step => voicingNotes(step.hands)))
        // Light up each chord while it rings.
        follow(resolved.length, SEQUENCE_STEP_SECONDS)
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
                <p className="text-sm text-stone-600 dark:text-stone-400">
                    <strong className="font-semibold text-stone-900 dark:text-stone-100">{t(`progressions.presets.${preset.id}`)}.</strong>{" "}
                    <TermText text={t(`progressions.presetHints.${preset.id}`)}/> {t("progressions.editHint")}
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                    <div className="space-y-2">
                        <p className="text-xs font-semibold tracking-wide text-stone-500 uppercase">{tPiano("progressions.voicingStyle")}</p>
                        <Segmented
                            label={tPiano("progressions.voicingStyle")}
                            value={style}
                            onChange={onStyleChange}
                            options={VOICING_STYLES.map(value => ({value, label: tPiano(`progressions.styles.${value}`)}))}
                        />
                    </div>
                    <p className="min-w-0 flex-1 basis-72 text-sm text-stone-600 dark:text-stone-400"><TermText text={tPiano(`progressions.styleHints.${style}`)}/></p>
                </div>

                <FunctionLegend/>

                <div className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-3">
                    {resolved.map((step, index) => (
                        <StepTile
                            key={index}
                            index={index}
                            step={step}
                            range={tileRange}
                            isSelected={index === selectedIndex}
                            isPlaying={index === playing}
                            canRemove={steps.length > 1}
                            onSelect={() => setSelected(index)}
                            onRemove={() => remove(index)}
                        />
                    ))}
                    <AddChordTile tonic={tonic} mode={mode} onAdd={append}/>
                </div>

                {shown && <HandsPanel step={shown} previous={resolved[shownIndex - 1]} range={handsRange} isPlaying={playing !== null}/>}

                {resolved[selectedIndex] && (
                    <StepEditor
                        key={selectedIndex}
                        index={selectedIndex}
                        step={resolved[selectedIndex]}
                        tonic={tonic}
                        mode={mode}
                        canRemove={steps.length > 1}
                        chordPath={PIANO_PATHS.chord(resolved[selectedIndex].root, resolved[selectedIndex].type, resolved[selectedIndex].bass)}
                        onPick={chord => replace(selectedIndex, chord)}
                        onRemove={() => remove(selectedIndex)}
                    />
                )}
            </section>

            {shown && <SoloKeys tonic={tonic} mode={mode} step={shown} isPlaying={playing !== null}/>}

            <KeyChordsSection tonic={tonic} mode={mode} onAdd={append}/>
        </>
    )
}

export default function PianoProgressionsPage() {
    const {t} = useTranslation("theory")
    const {t: tCommon} = useTranslation()
    const {tonic, mode, presets, preset, update} = useProgressionKey()
    const [params, setParams] = useSearchParams()

    const styleParam = params.get("voicing") as VoicingStyle | null
    const style: VoicingStyle = styleParam && VOICING_STYLES.includes(styleParam) ? styleParam : "smooth"
    const setStyle = (value: VoicingStyle) => {
        const next = new URLSearchParams(params)
        if (value === "smooth") next.delete("voicing")
        else next.set("voicing", value)
        setParams(next, {replace: true})
    }

    const scale = getScaleInfo(tonic, mode)!
    const scaleMidi = handScaleMidi(scale, "right")

    return (
        <div className="space-y-10">
            <PageHeader title={tCommon("nav.progressions")} description={<TermText text={t("progressions.description")}/>}/>
            <KeySection tonic={tonic} mode={mode} instrument="piano" scaleMidi={scaleMidi} onChange={update}/>
            <PresetSection tonic={tonic} presets={presets} active={preset} onSelect={id => update({preset: id})}/>
            <ProgressionEditor key={`${mode}-${preset.id}`} tonic={tonic} mode={mode} preset={preset} style={style} onStyleChange={setStyle}/>
        </div>
    )
}
