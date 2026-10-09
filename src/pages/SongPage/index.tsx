import {useMemo, useState} from "react"
import {Link, useSearchParams} from "react-router"
import {useTranslation} from "react-i18next"
import {ArrowRight, Loader2, Play, Sparkles} from "lucide-react"
import {Button} from "@/components/ui/button"
import {Card} from "@/components/ui/card"
import {ROOT_NOTES} from "@/constants/notes"
import {usePlayer} from "@/hooks/usePlayer"
import {useSettings} from "@/hooks/useSettings"
import {formatChordName, getChordInfo} from "@/lib/theory/chords"
import {chroma, formatNote, mod12, rootToSlug, slugToRoot} from "@/lib/theory/notes"
import {KEY_MODES, presetSteps, resolveStep, chordRoman, type KeyMode} from "@/lib/theory/progressions"
import {slashVoicings} from "@/lib/theory/slash"
import {
    analyzeChords,
    capoOptions,
    detectKeys,
    findPreset,
    parseChordList,
    semitoneShift,
    transposeChords,
    uniqueChords,
    type ChordFit,
    type SongChord,
} from "@/lib/theory/song"
import {getVoicings, voicingMidi} from "@/lib/theory/voicings"
import {cn} from "@/lib/utils"
import {PATHS} from "@/router/paths"
import type {Notation, NoteName} from "@/types/music"
import {ChordDiagram} from "@/widgets/ChordDiagram"
import {FUNCTION_STYLES} from "@/widgets/FunctionStyles"
import {PageHeader} from "@/widgets/PageHeader"
import {RootNotePicker} from "@/widgets/RootNotePicker"
import {StepHeading} from "@/widgets/StepHeading"
import {Term, TermText} from "@/widgets/Term"

const EXAMPLES = ["G Em C D", "Am F C G", "C G/B Am F", "E7 A7 E7 B7 A7 E7", "Dm7 G7 Cmaj7", "Am G F E"]

const FIT_STYLES: Record<ChordFit, string> = {
    diatonic: "text-stone-500",
    harmonic: "text-rose-700 dark:text-rose-400",
    blues: "text-sky-700 dark:text-sky-400",
    secondary: "text-violet-700 dark:text-violet-400",
    borrowed: "text-amber-700 dark:text-amber-400",
    outside: "text-red-600 dark:text-red-400",
}

/** Glossary entry behind each fit label. */
const FIT_TERMS: Record<ChordFit, string | undefined> = {
    diatonic: "diatonic",
    harmonic: "harmonicMinor",
    blues: "dominant",
    secondary: "secondaryDominant",
    borrowed: "borrowedChord",
    outside: undefined,
}

function chordName(chord: SongChord, notation: Notation): string {
    const info = getChordInfo(chord.root, chord.type, chord.bass)
    return info ? formatChordName(info, notation) : chord.root + chord.type
}

/** First diagram for a chord: an open shape when there is one. */
function firstVoicing(chord: SongChord) {
    return (chord.bass ? slashVoicings(chord.root, chord.type, chord.bass) : getVoicings(chord.root, chord.type))[0]
}

function keyLabel(tonic: NoteName, mode: KeyMode, notation: Notation, t: (key: string) => string): string {
    return `${formatNote(tonic, notation)} ${t(`progressions.modes.${mode}`)}`
}

function ChordChips({chords, className}: {chords: SongChord[]; className?: string}) {
    const {notation} = useSettings()
    return (
        <div className={cn("flex flex-wrap gap-1.5", className)}>
            {chords.map((chord, index) => (
                <Link
                    key={index}
                    to={PATHS.chord(chord.root, chord.type, chord.bass)}
                    className="rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-sm font-semibold hover:border-brand-500 dark:border-stone-700 dark:bg-stone-900"
                >
                    {chordName(chord, notation)}
                </Link>
            ))}
        </div>
    )
}

/** Strums the chords one after another, `shift` semitones up (a capo raises every shape). */
function PlaySequence({chords, shift = 0}: {chords: SongChord[]; shift?: number}) {
    const {t} = useTranslation("theory")
    const player = usePlayer()
    const play = () => {
        const midi = chords.map(chord => {
            const voicing = firstVoicing(chord)
            return voicing ? voicingMidi(voicing).map(note => note + shift) : []
        })
        void player.strumSequence(midi)
    }
    return (
        <Button variant="secondary" size="sm" onClick={play}>
            {player.isLoading ? <Loader2 className="animate-spin"/> : <Play/>}
            {t("song.play")}
        </Button>
    )
}

export default function SongPage() {
    const {t} = useTranslation("theory")
    const {t: tCommon} = useTranslation()
    const {notation} = useSettings()
    const [params, setParams] = useSearchParams()
    // The chord text lives in the URL, so a link or the back button restores the whole analysis.
    const text = params.get("chords") ?? ""
    const [pickedCapo, setPickedCapo] = useState<number | null>(null)

    const parsed = useMemo(() => parseChordList(text), [text])
    const chords = useMemo(() => parsed.flatMap(token => token.chord ?? []), [parsed])
    const candidates = useMemo(() => detectKeys(chords), [chords])

    const keyParam = slugToRoot(params.get("key") ?? "")
    const modeParam = params.get("mode") as KeyMode | null
    const manual = keyParam && modeParam && KEY_MODES.includes(modeParam) ? {tonic: keyParam, mode: modeParam} : null
    const best = candidates[0]
    const key = manual ?? (best ? {tonic: best.tonic, mode: best.mode} : null)
    const target = slugToRoot(params.get("to") ?? "") ?? key?.tonic

    const updateText = (next: string) => {
        setPickedCapo(null)
        const nextParams = new URLSearchParams()
        if (next.trim()) nextParams.set("chords", next)
        // New chords → detect the key again and start the transposition from scratch.
        setParams(nextParams, {replace: true})
    }
    const update = (patch: Record<string, string | null>) => {
        const next = new URLSearchParams(params)
        for (const [name, value] of Object.entries(patch)) {
            if (value === null) next.delete(name)
            else next.set(name, value)
        }
        setParams(next, {replace: true})
        setPickedCapo(null)
    }

    const unknown = parsed.filter(token => !token.chord)
    const simplified = parsed.filter(token => token.simplifiedFrom)

    return (
        <div className="space-y-10">
            <PageHeader title={tCommon("nav.song")} description={<TermText text={t("song.description")}/>}/>

            <section className="space-y-4">
                <StepHeading number={1} title={t("song.steps.input")}/>
                <Card className="space-y-4">
                    <textarea
                        value={text}
                        onChange={event => updateText(event.target.value)}
                        placeholder={t("song.placeholder")}
                        aria-label={t("song.steps.input")}
                        rows={3}
                        className="w-full resize-y rounded-lg border border-stone-300 bg-white p-3 font-mono text-base hover:border-stone-400 dark:border-stone-700 dark:bg-stone-950"
                    />
                    <div className="flex flex-wrap items-center gap-1.5 text-sm">
                        <span className="text-stone-500">{t("song.examples")}</span>
                        {EXAMPLES.map(example => (
                            <button
                                key={example}
                                type="button"
                                onClick={() => updateText(example)}
                                className="rounded-md bg-stone-100 px-2 py-1 font-mono text-xs hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700"
                            >
                                {example}
                            </button>
                        ))}
                    </div>

                    {parsed.length > 0 && (
                        <div className="space-y-2 border-t border-stone-200 pt-4 dark:border-stone-800">
                            <div className="flex flex-wrap gap-1.5">
                                {parsed.map((token, index) => (
                                    <span
                                        key={index}
                                        title={token.simplifiedFrom ? t("song.simplified", {from: token.simplifiedFrom, to: chordName(token.chord!, notation)}) : undefined}
                                        className={cn(
                                            "rounded-md px-2 py-0.5 text-sm font-semibold",
                                            !token.chord && "bg-red-100 text-red-800 line-through dark:bg-red-950 dark:text-red-300",
                                            token.simplifiedFrom && "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
                                            token.chord && !token.simplifiedFrom && "bg-stone-100 dark:bg-stone-800",
                                        )}
                                    >
                                        {token.chord ? chordName(token.chord, notation) : token.token}
                                    </span>
                                ))}
                            </div>
                            {unknown.length > 0 && <p className="text-xs text-red-700 dark:text-red-400">{t("song.unknown", {tokens: unknown.map(token => token.token).join(", ")})}</p>}
                            {simplified.map(token => (
                                <p key={token.token} className="text-xs text-amber-800 dark:text-amber-300">
                                    {t("song.simplified", {from: token.simplifiedFrom, to: chordName(token.chord!, notation)})}
                                </p>
                            ))}
                        </div>
                    )}
                </Card>
            </section>

            {!key || !target
                ? <p className="text-sm text-stone-500">{t("song.empty")}</p>
                : (
                    <>
                        <KeySection
                            tonic={key.tonic}
                            mode={key.mode}
                            chords={chords}
                            isManual={!!manual}
                            alternatives={candidates
                                .filter(item => best && item.score >= best.score - 0.3)
                                .filter(item => !(chroma(item.tonic) === chroma(key.tonic) && item.mode === key.mode))
                                .slice(0, 3)}
                            onPick={(tonic, mode) => update({key: rootToSlug(tonic), mode, to: null})}
                            onAuto={() => update({key: null, mode: null, to: null})}
                        />

                        <TransposeSection
                            tonic={key.tonic}
                            mode={key.mode}
                            target={target}
                            chords={chords}
                            onTarget={note => update({to: rootToSlug(note)})}
                        />

                        <CapoSection
                            target={target}
                            mode={key.mode}
                            chords={transposeChords(chords, key.tonic, target)}
                            picked={pickedCapo}
                            onPick={setPickedCapo}
                        />
                    </>
                )}
        </div>
    )
}

interface KeySectionProps {
    tonic: NoteName
    mode: KeyMode
    chords: SongChord[]
    isManual: boolean
    alternatives: {tonic: NoteName; mode: KeyMode}[]
    onPick: (tonic: NoteName, mode: KeyMode) => void
    onAuto: () => void
}

function KeySection({tonic, mode, chords, isManual, alternatives, onPick, onAuto}: KeySectionProps) {
    const {t} = useTranslation("theory")
    const {notation} = useSettings()

    const distinct = uniqueChords(chords)
    const analysis = analyzeChords(tonic, mode, distinct)
    const inKey = analysis.filter(item => item.fit === "diatonic").length
    const preset = findPreset(tonic, mode, chords)
    const fitsShown = [...new Set(analysis.map(item => item.fit))].filter(fit => fit !== "diatonic")
    // G major and E minor share every chord; say so when the runner-up is the relative key.
    const relative = alternatives.find(item => item.mode !== mode && chroma(item.tonic) === mod12(chroma(tonic) + (mode === "major" ? 9 : 3)))

    return (
        <section className="space-y-4">
            <StepHeading number={2} title={t("song.steps.key")}/>
            <Card className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                        <p className="text-xs font-semibold tracking-wide text-stone-500 uppercase">
                            <Term id="key">{t("song.key.label")}</Term>
                            {isManual && <span className="ml-2 normal-case">· {t("song.key.manual")}</span>}
                        </p>
                        <p className="text-3xl font-bold tracking-tight">{keyLabel(tonic, mode, notation, t)}</p>
                        <p className="text-sm text-stone-600 dark:text-stone-400">{t("song.key.share", {count: distinct.length, inKey})}</p>
                    </div>
                    <Link
                        to={`${PATHS.progressions}?key=${rootToSlug(tonic)}&mode=${mode}${preset ? `&preset=${preset.id}` : ""}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline dark:text-brand-400"
                    >
                        {t("song.key.openProgressions")} <ArrowRight className="size-4"/>
                    </Link>
                </div>

                {preset && (
                    <p className="flex flex-wrap items-center gap-2 rounded-lg bg-brand-50 p-3 text-sm dark:bg-brand-950/50">
                        <Sparkles className="size-4 text-brand-600"/>
                        {t("song.key.preset")}
                        <strong className="font-semibold">{t(`progressions.presets.${preset.id}`)}</strong>
                        <span className="text-brand-700 dark:text-brand-400">
                            {presetSteps(preset, tonic).map(step => chordRoman(tonic, mode, resolveStep(tonic, step), step.type)).join(" – ")}
                        </span>
                    </p>
                )}

                {relative && !isManual && (
                    <p className="text-sm text-stone-600 dark:text-stone-400">
                        <TermText text={t("song.key.relative", {
                            first: keyLabel(tonic, mode, notation, t),
                            second: keyLabel(relative.tonic, relative.mode, notation, t),
                        })}/>
                    </p>
                )}

                {(alternatives.length > 0 || isManual) && (
                    <div className="flex flex-wrap items-center gap-1.5 text-sm">
                        <span className="text-stone-500">{t("song.key.alternatives")}</span>
                        {alternatives.map(item => (
                            <button
                                key={`${item.tonic}-${item.mode}`}
                                type="button"
                                onClick={() => onPick(item.tonic, item.mode)}
                                className="rounded-lg border border-stone-300 px-2.5 py-1 font-medium hover:border-stone-500 dark:border-stone-700"
                            >
                                {keyLabel(item.tonic, item.mode, notation, t)}
                            </button>
                        ))}
                        {isManual && (
                            <button type="button" onClick={onAuto} className="px-2 py-1 font-medium text-brand-700 hover:underline dark:text-brand-400">
                                {t("song.key.auto")}
                            </button>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-2">
                    {analysis.map(item => (
                        <Link
                            key={`${item.chord.root}-${item.chord.type}-${item.chord.bass ?? ""}`}
                            to={PATHS.chord(item.chord.root, item.chord.type, item.chord.bass)}
                            className="overflow-hidden rounded-xl border border-stone-200 bg-white hover:border-brand-400 dark:border-stone-800 dark:bg-stone-900"
                        >
                            <span className={cn("block h-1.5", FUNCTION_STYLES[item.fn].bar)}/>
                            <span className="block p-2.5 text-center">
                                <span className="block text-lg font-bold">{chordName(item.chord, notation)}</span>
                                <span className="block text-sm font-semibold text-brand-700 dark:text-brand-400">{item.roman}</span>
                                <span className={cn("block text-[11px] font-medium", FIT_STYLES[item.fit])}>{t(`song.fits.${item.fit}`)}</span>
                            </span>
                        </Link>
                    ))}
                </div>

                {fitsShown.length > 0 && (
                    <ul className="space-y-1 text-sm text-stone-600 dark:text-stone-400">
                        {fitsShown.map(fit => {
                            const term = FIT_TERMS[fit]
                            const label = t(`song.fits.${fit}`)
                            return (
                                <li key={fit}>
                                    <strong className={cn("font-semibold", FIT_STYLES[fit])}>{term ? <Term id={term}>{label}</Term> : label}</strong>
                                    {" — "}{t(`song.fitHints.${fit}`)}
                                </li>
                            )
                        })}
                    </ul>
                )}
            </Card>
        </section>
    )
}

interface TransposeSectionProps {
    tonic: NoteName
    mode: KeyMode
    target: NoteName
    chords: SongChord[]
    onTarget: (note: NoteName) => void
}

function TransposeSection({tonic, mode, target, chords, onTarget}: TransposeSectionProps) {
    const {t} = useTranslation("theory")
    const {notation} = useSettings()
    const shift = semitoneShift(tonic, target)
    const transposed = transposeChords(chords, tonic, target)
    // Going up a few semitones? The original shapes with a capo give the same result.
    const capoInstead = mod12(chroma(target) - chroma(tonic))

    return (
        <section className="space-y-4">
            <StepHeading number={3} title={<Term id="transposition">{t("song.steps.transpose")}</Term>}/>
            <Card className="space-y-4">
                <RootNotePicker value={target} onChange={onTarget} label={t("song.transpose.label")} term="key"/>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-4 dark:border-stone-800">
                    <p className="text-sm">
                        <strong className="font-semibold">{keyLabel(tonic, mode, notation, t)} → {keyLabel(target, mode, notation, t)}</strong>
                        <span className="ml-2 text-stone-500">
                            {shift === 0 ? t("song.transpose.same") : t(shift > 0 ? "song.transpose.up" : "song.transpose.down", {count: Math.abs(shift)})}
                        </span>
                    </p>
                    <PlaySequence chords={transposed}/>
                </div>
                <ChordChips chords={transposed}/>
                {capoInstead > 0 && capoInstead <= 7 && (
                    <p className="rounded-lg bg-stone-100 p-3 text-sm text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                        <TermText text={t("song.transpose.capoInstead", {count: capoInstead})}/>
                    </p>
                )}
            </Card>
        </section>
    )
}

interface CapoSectionProps {
    target: NoteName
    mode: KeyMode
    chords: SongChord[]
    picked: number | null
    onPick: (capo: number) => void
}

function CapoSection({target, mode, chords, picked, onPick}: CapoSectionProps) {
    const {t} = useTranslation("theory")
    const {notation} = useSettings()
    const options = capoOptions(chords).slice(0, 4)
    const total = uniqueChords(chords).length
    const selected = options.find(option => option.capo === picked) ?? options[0]!

    return (
        <section className="space-y-4">
            <StepHeading number={4} title={<Term id="capo">{t("song.steps.capo")}</Term>}/>
            <p className="text-sm text-stone-600 dark:text-stone-400">{t("song.capo.hint", {key: keyLabel(target, mode, notation, t)})}</p>

            <div className="grid gap-2 md:grid-cols-2">
                {options.map((option, index) => {
                    const shapeKey = ROOT_NOTES[mod12(chroma(target) - option.capo)] ?? target
                    const isSelected = option.capo === selected.capo
                    return (
                        <button
                            key={option.capo}
                            type="button"
                            onClick={() => onPick(option.capo)}
                            aria-pressed={isSelected}
                            className={cn(
                                "space-y-2 rounded-xl border p-3 text-left transition-colors",
                                isSelected
                                    ? "border-brand-500 bg-brand-50 dark:bg-brand-950/40"
                                    : "border-stone-200 bg-white hover:border-stone-400 dark:border-stone-800 dark:bg-stone-900",
                            )}
                        >
                            <span className="flex flex-wrap items-center gap-2">
                                <span className="font-bold">{option.capo === 0 ? t("song.capo.none") : t("song.capo.fret", {count: option.capo})}</span>
                                <span className="text-sm text-stone-500">{t("song.capo.shapes", {key: keyLabel(shapeKey, mode, notation, t)})}</span>
                                {index === 0 && <span className="rounded-md bg-brand-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">{t("song.capo.best")}</span>}
                            </span>
                            <span className="block text-sm font-semibold">{uniqueChords(option.shapes).map(chord => chordName(chord, notation)).join(" · ")}</span>
                            <span className="block text-xs text-stone-500">{t("song.capo.open", {count: option.openCount, total})}</span>
                        </button>
                    )
                })}
            </div>

            <Card className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold">
                        {selected.capo === 0 ? t("song.capo.none") : t("song.capo.fret", {count: selected.capo})}
                    </p>
                    <PlaySequence chords={selected.shapes} shift={selected.capo}/>
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-3">
                    {uniqueChords(selected.shapes).map(chord => {
                        const voicing = firstVoicing(chord)
                        const info = getChordInfo(chord.root, chord.type, chord.bass)
                        const name = chordName(chord, notation)
                        return (
                            <div key={name} className="flex flex-col items-center gap-1">
                                <span className="font-bold">{name}</span>
                                {voicing && info
                                    ? <ChordDiagram voicing={voicing} root={chord.root} chordNotes={chord.bass ? [...info.notes, chord.bass] : info.notes} title={name} className="max-w-28"/>
                                    : <span className="py-6 text-xs text-stone-500">{t("noVoicings")}</span>}
                            </div>
                        )
                    })}
                </div>
                {selected.capo > 0 && <p className="text-xs text-stone-500">{t("song.capo.diagramsNote", {count: selected.capo})}</p>}
            </Card>
        </section>
    )
}
