import {useMemo, useState} from "react"
import {Link} from "react-router"
import {useTranslation} from "react-i18next"
import {ArrowRight} from "lucide-react"
import {Card} from "@/components/ui/card"
import {useSettings} from "@/hooks/useSettings"
import {formatChordName, getChordInfo} from "@/lib/theory/chords"
import {formatNote, rootToSlug} from "@/lib/theory/notes"
import {chordRoman, resolveBass, resolveStep, type KeyChord, type KeyMode} from "@/lib/theory/progressions"
import {chordUsage, type KeyUsage} from "@/lib/theory/usage"
import {cn} from "@/lib/utils"
import type {Notation, NoteName} from "@/types/music"
import {FUNCTION_STYLES} from "@/widgets/FunctionStyles"
import {TermText} from "@/widgets/Term"

interface ChordUsageProps {
    root: NoteName
    type: string
    /** Link to a chord page of the current instrument. */
    chordPath: (root: NoteName, type: string, bass?: NoteName) => string
    /** The progressions page of the current instrument. */
    progressionsPath: string
}

function chordName(root: NoteName, type: string, notation: Notation, bass?: NoteName): string {
    const info = getChordInfo(root, type, bass)
    return info ? formatChordName(info, notation) : root + type
}

function NeighbourList({title, chords, chordPath}: {title: string; chords: KeyChord[]; chordPath: ChordUsageProps["chordPath"]}) {
    const {t} = useTranslation("theory")
    const {notation} = useSettings()

    return (
        <div className="min-w-0 flex-1 space-y-2">
            <p className="text-xs font-semibold tracking-wide text-base-500 uppercase">{title}</p>
            {chords.length === 0
                ? <p className="text-sm text-base-500">{t("usage.none")}</p>
                : (
                    <div className="flex flex-wrap gap-1.5">
                        {chords.map(chord => (
                            <Link
                                key={chord.roman}
                                to={chordPath(chord.root, chord.type)}
                                className="inline-flex flex-col items-center rounded-lg border border-base-200 px-3 py-1.5 transition-colors hover:border-brand-400 dark:border-base-700 dark:hover:border-brand-700"
                            >
                                <span className="font-semibold">{chordName(chord.root, chord.type, notation)}</span>
                                <span className="text-xs font-medium text-brand-700 dark:text-brand-400">{chord.roman}</span>
                            </Link>
                        ))}
                    </div>
                )}
        </div>
    )
}

function KeyDetails({usage, type, chordPath, progressionsPath}: {usage: KeyUsage; type: string} & Omit<ChordUsageProps, "root" | "type">) {
    const {t} = useTranslation("theory")
    const {notation} = useSettings()
    const keyName = `${formatNote(usage.tonic, notation)} ${t(`progressions.modes.${usage.mode}`)}`
    const name = chordName(usage.root, type, notation)
    const presetLink = (mode: KeyMode, preset: string) =>
        `${progressionsPath}?key=${rootToSlug(usage.tonic)}&mode=${mode}&preset=${preset}`

    return (
        <div className="space-y-6">
            <p className="text-sm text-base-700 dark:text-base-300">
                <span className="font-semibold">{t("usage.inKey", {chord: name, key: keyName, roman: usage.roman})}</span>
                {" "}
                <span className={cn("rounded-md px-1.5 py-0.5 text-xs font-semibold", FUNCTION_STYLES[usage.fn].chip)}>
                    {t(`progressions.functions.${usage.fn}`)}
                </span>
                {" "}
                {t(`progressions.functionHints.${usage.fn}`)}
                {usage.source === "harmonic" && <> <TermText text={t("usage.harmonic")}/></>}
            </p>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <NeighbourList title={t("usage.before")} chords={usage.before} chordPath={chordPath}/>
                <div className="flex shrink-0 items-center gap-2 self-center sm:pt-6">
                    <ArrowRight className="hidden size-4 text-base-400 sm:block"/>
                    <span className="rounded-lg bg-brand-600 px-3 py-1.5 text-center text-on-brand">
                        <span className="block font-semibold">{name}</span>
                        <span className="block text-xs font-medium opacity-80">{usage.roman}</span>
                    </span>
                    <ArrowRight className="hidden size-4 text-base-400 sm:block"/>
                </div>
                <NeighbourList title={t("usage.after")} chords={usage.after} chordPath={chordPath}/>
            </div>

            <div className="space-y-2">
                <p className="text-xs font-semibold tracking-wide text-base-500 uppercase">{t("usage.presets")}</p>
                {usage.presets.length === 0
                    ? <p className="text-sm text-base-500">{t("usage.noPresets")}</p>
                    : (
                        <ul className="divide-y divide-base-200 rounded-xl border border-base-200 dark:divide-base-800 dark:border-base-800">
                            {usage.presets.map(({preset, steps, matches}) => (
                                <li key={preset.id}>
                                    <Link
                                        to={presetLink(preset.mode, preset.id)}
                                        className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-3 transition-colors hover:bg-base-50 dark:hover:bg-base-800/50"
                                    >
                                        <span className="w-40 shrink-0 font-semibold">{t(`progressions.presets.${preset.id}`)}</span>
                                        <span className="flex min-w-0 flex-1 flex-wrap gap-1">
                                            {steps.map((step, index) => {
                                                const root = resolveStep(usage.tonic, step)
                                                const bass = resolveBass(usage.tonic, step)
                                                const isMatch = matches.includes(index)
                                                return (
                                                    <span
                                                        key={index}
                                                        title={chordRoman(usage.tonic, usage.mode, root, step.type, bass)}
                                                        className={cn(
                                                            "rounded-md px-1.5 py-0.5 text-sm",
                                                            isMatch ? "bg-brand-600 font-semibold text-on-brand" : "bg-base-100 text-base-700 dark:bg-base-800 dark:text-base-300",
                                                        )}
                                                    >
                                                        {chordName(root, step.type, notation, bass)}
                                                    </span>
                                                )
                                            })}
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 dark:text-brand-400">
                                            {t("usage.open")} <ArrowRight className="size-3"/>
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
            </div>
        </div>
    )
}

/**
 * "Where does this chord go?": the keys it belongs to, and for the chosen key the chords that
 * usually come before and after it, plus the ready-made progressions that use it.
 */
export function ChordUsage({root, type, chordPath, progressionsPath}: ChordUsageProps) {
    const {t} = useTranslation("theory")
    const {notation} = useSettings()
    const usages = useMemo(() => chordUsage(root, type), [root, type])
    const [selected, setSelected] = useState(0)
    const usage = usages[selected] ?? usages[0]

    return (
        <section className="space-y-4">
            <div>
                <h2 className="text-xl font-semibold tracking-tight">{t("usage.title")}</h2>
                <p className="text-sm text-base-600 dark:text-base-400"><TermText text={t("usage.hint")}/></p>
            </div>

            {!usage
                ? <p className="text-sm text-base-500">{t("usage.noKeys")}</p>
                : (
                    <Card className="space-y-6">
                        <div className="space-y-2">
                            <p className="text-xs font-semibold tracking-wide text-base-500 uppercase">{t("usage.keys")}</p>
                            <div role="radiogroup" aria-label={t("usage.keys")} className="flex flex-wrap gap-1.5">
                                {usages.map((item, index) => {
                                    const isActive = item === usage
                                    return (
                                        <button
                                            key={`${item.tonic}-${item.mode}`}
                                            type="button"
                                            role="radio"
                                            aria-checked={isActive}
                                            onClick={() => setSelected(index)}
                                            className={cn(
                                                "rounded-lg border px-3 py-1.5 text-sm transition-colors pointer-coarse:py-2.5",
                                                isActive
                                                    ? "border-brand-600 bg-brand-600 text-on-brand"
                                                    : "border-base-300 bg-white text-base-700 hover:border-base-400 hover:bg-base-100 dark:border-base-700 dark:bg-base-900 dark:text-base-300 dark:hover:bg-base-800",
                                            )}
                                        >
                                            <span className="font-medium">{formatNote(item.tonic, notation)} {t(`progressions.modes.${item.mode}`)}</span>
                                            <span className={cn("ml-1.5 text-xs font-semibold", isActive ? "text-on-brand/80" : "text-brand-700 dark:text-brand-400")}>{item.roman}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                        <KeyDetails usage={usage} type={type} chordPath={chordPath} progressionsPath={progressionsPath}/>
                    </Card>
                )}
        </section>
    )
}
