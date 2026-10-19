import type {KeyboardEvent} from "react"
import {Link, useSearchParams} from "react-router"
import {useTranslation} from "react-i18next"
import {ArrowRight} from "lucide-react"
import {Card} from "@/components/ui/card"
import {useSettings} from "@/hooks/useSettings"
import {formatChordName, getChordInfo} from "@/lib/theory/chords"
import {CIRCLE_MAJORS, CIRCLE_MINORS, circleIndex, keyFamily, keySignature} from "@/lib/theory/circle"
import {formatNote, rootToSlug, slugToRoot} from "@/lib/theory/notes"
import {diatonicChords, KEY_MODES, type KeyMode} from "@/lib/theory/progressions"
import {getScaleInfo, scaleMidi} from "@/lib/theory/scales"
import {cn} from "@/lib/utils"
import {PATHS} from "@/router/paths"
import type {NoteName} from "@/types/music"
import {CENTER, INNER, MIDDLE, OUTER, polar, ringLabel, SIZE, slicePath} from "@/widgets/CircleWheel/geometry"
import {PageHeader} from "@/widgets/PageHeader"
import {PlayButton} from "@/widgets/PlayButton"
import {Term, TermText} from "@/widgets/Term"
import {ToneTable} from "@/widgets/ToneTable"

export default function CirclePage() {
    const {t} = useTranslation("theory")
    const {t: tCommon} = useTranslation()
    const {notation} = useSettings()
    const [params, setParams] = useSearchParams()

    const modeParam = params.get("mode") as KeyMode | null
    const mode: KeyMode = modeParam && KEY_MODES.includes(modeParam) ? modeParam : "major"
    const keyParam = slugToRoot(params.get("key") ?? "")
    const ring = mode === "major" ? CIRCLE_MAJORS : CIRCLE_MINORS
    // Unknown or enharmonic spellings (Gb) snap to the circle's own spelling.
    const index = keyParam ? Math.max(0, circleIndex(keyParam, mode)) : 0
    const tonic: NoteName = ring[index] ?? "C"

    const select = (nextRing: KeyMode, nextIndex: number) => {
        const note = (nextRing === "major" ? CIRCLE_MAJORS : CIRCLE_MINORS)[nextIndex] ?? "C"
        setParams({key: rootToSlug(note), mode: nextRing}, {replace: true})
    }

    const family = keyFamily(tonic, mode)
    const roleOf = (slotRing: KeyMode, slotIndex: number) => family.find(item => item.ring === slotRing && item.index === slotIndex)
    const signature = keySignature(tonic, mode)
    const scale = getScaleInfo(tonic, mode)!
    const chords = diatonicChords(tonic, mode)
    const keyName = `${formatNote(tonic, notation)} ${t(`progressions.modes.${mode}`)}`

    const onKey = (event: KeyboardEvent, slotRing: KeyMode, slotIndex: number) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            select(slotRing, slotIndex)
        } else if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
            event.preventDefault()
            select(slotRing, (slotIndex + (event.key === "ArrowRight" ? 1 : 11)) % 12)
        }
    }

    const signatureText = signature.type === "none"
        ? t("circle.signature.none")
        : t(`circle.signature.${signature.type}`, {count: signature.count, notes: signature.accidentals.map(note => formatNote(note, notation)).join(", ")})

    return (
        <div className="space-y-8">
            <PageHeader title={tCommon("nav.circle")} description={<TermText text={t("circle.description")}/>}/>

            <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,26rem)_1fr]">
                <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto w-full max-w-md select-none" role="group" aria-label={tCommon("nav.circle")}>
                    {(["major", "minor"] as const).map(slotRing =>
                        CIRCLE_MAJORS.map((_, slotIndex) => {
                            const role = roleOf(slotRing, slotIndex)
                            const isSelected = slotRing === mode && slotIndex === index
                            const [inner, outer] = slotRing === "major" ? [MIDDLE, OUTER] : [INNER, MIDDLE]
                            const angle = (slotIndex / 12) * Math.PI * 2 - Math.PI / 2
                            const [x, y] = polar((inner + outer) / 2, angle)
                            const label = ringLabel(slotRing, slotIndex, notation)
                            return (
                                <g
                                    key={`${slotRing}-${slotIndex}`}
                                    role="button"
                                    tabIndex={0}
                                    aria-pressed={isSelected}
                                    aria-label={`${label}${role ? ` · ${role.roman}` : ""}`}
                                    onClick={() => select(slotRing, slotIndex)}
                                    onKeyDown={event => onKey(event, slotRing, slotIndex)}
                                    className="cursor-pointer outline-none [&:focus-visible>path]:stroke-brand-500 [&:focus-visible>path]:stroke-[3]"
                                >
                                    <path
                                        d={slicePath(slotIndex, inner, outer)}
                                        className={cn(
                                            "stroke-white transition-colors dark:stroke-base-950",
                                            isSelected
                                                ? "fill-brand-600"
                                                : role
                                                    ? "fill-brand-100 hover:fill-brand-200 dark:fill-brand-950 dark:hover:fill-brand-900"
                                                    : slotRing === "major"
                                                        ? "fill-base-100 hover:fill-base-200 dark:fill-base-800 dark:hover:fill-base-700"
                                                        : "fill-base-200 hover:fill-base-300 dark:fill-base-900 dark:hover:fill-base-800",
                                        )}
                                        strokeWidth={2}
                                    />
                                    <text
                                        x={x}
                                        y={role ? y - 2 : y + 4}
                                        textAnchor="middle"
                                        className={cn(
                                            "pointer-events-none font-semibold",
                                            label.length > 5 ? "text-[10px]" : slotRing === "major" ? "text-[15px]" : "text-[12px]",
                                            isSelected ? "fill-on-brand" : "fill-base-800 dark:fill-base-100",
                                        )}
                                    >
                                        {label}
                                    </text>
                                    {role && (
                                        <text
                                            x={x}
                                            y={y + 12}
                                            textAnchor="middle"
                                            className={cn("pointer-events-none text-[10px] font-semibold", isSelected ? "fill-on-brand" : "fill-brand-700 dark:fill-brand-300")}
                                        >
                                            {role.roman}
                                        </text>
                                    )}
                                </g>
                            )
                        }),
                    )}
                    <circle cx={CENTER} cy={CENTER} r={INNER - 4} className="fill-white dark:fill-base-900"/>
                    <text x={CENTER} y={CENTER - 6} textAnchor="middle" className="fill-base-900 text-[22px] font-bold dark:fill-base-100">
                        {signature.type === "none" ? "0" : `${signature.count}${signature.type === "sharp" ? "♯" : "♭"}`}
                    </text>
                    <text x={CENTER} y={CENTER + 16} textAnchor="middle" className="fill-base-500 text-[11px]">
                        {t("circle.center")}
                    </text>
                </svg>

                <div className="space-y-5">
                    <Card className="space-y-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="text-3xl font-bold tracking-tight">{keyName}</p>
                                <p className="text-sm text-base-600 dark:text-base-400">
                                    <Term id="keySignature">{t("circle.signature.label")}</Term>: {signatureText}
                                </p>
                            </div>
                            <PlayButton midi={scaleMidi(scale)} mode="arpeggio" label={t("progressions.playScale")}/>
                        </div>
                        <ToneTable notes={scale.notes} degrees={scale.degrees}/>
                        <div className="space-y-2">
                            <p className="text-xs font-semibold tracking-wide text-base-500 uppercase"><Term id="diatonic">{t("circle.chords")}</Term></p>
                            <div className="flex flex-wrap gap-1.5">
                                {chords.map(chord => {
                                    const info = getChordInfo(chord.root, chord.type)
                                    return (
                                        <Link
                                            key={chord.roman}
                                            to={PATHS.chord(chord.root, chord.type)}
                                            className="flex items-baseline gap-1.5 rounded-lg border border-base-300 px-2.5 py-1 text-sm hover:border-brand-500 pointer-coarse:py-2.5 dark:border-base-700"
                                        >
                                            <span className="font-semibold">{info ? formatChordName(info, notation) : chord.root}</span>
                                            <span className="text-xs text-brand-700 dark:text-brand-400">{chord.roman}</span>
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-base-200 pt-4 text-sm dark:border-base-800">
                            <Link to={`${PATHS.progressions}?key=${rootToSlug(tonic)}&mode=${mode}`} className="inline-flex min-h-6 items-center pointer-coarse:min-h-10 gap-1 font-medium text-brand-700 hover:underline dark:text-brand-400">
                                {t("circle.openProgressions")} <ArrowRight className="size-4"/>
                            </Link>
                            <Link to={`${PATHS.scales}?root=${rootToSlug(tonic)}&scale=${mode}`} className="inline-flex min-h-6 items-center pointer-coarse:min-h-10 gap-1 font-medium text-brand-700 hover:underline dark:text-brand-400">
                                {t("circle.openScales")} <ArrowRight className="size-4"/>
                            </Link>
                        </div>
                    </Card>

                    <Card className="space-y-2">
                        <h2 className="font-semibold">{t("circle.howTitle")}</h2>
                        <ul className="list-disc space-y-1.5 pl-5 text-sm text-base-600 dark:text-base-400">
                            {["clockwise", "counter", "neighbours", "inner", "family"].map(item => (
                                <li key={item}><TermText text={t(`circle.how.${item}`)}/></li>
                            ))}
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    )
}
