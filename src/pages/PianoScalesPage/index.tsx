import {Link, useSearchParams} from "react-router"
import {useTranslation} from "react-i18next"
import {Card} from "@/components/ui/card"
import {Segmented} from "@/components/ui/segmented"
import {Select} from "@/components/ui/select"
import {SCALE_GROUPS, SCALES} from "@/constants/scales"
import {useSettings} from "@/hooks/useSettings"
import {crossings, fingeringFor, handScaleMidi, upAndDown, type Hand} from "@/lib/piano/scales"
import {keyboardRange} from "@/lib/piano/voicings"
import {parseChordSymbol} from "@/lib/theory/chords"
import {formatNote, rootToSlug, slugToRoot} from "@/lib/theory/notes"
import {getDiatonicChords, getScaleInfo, type ScaleInfo} from "@/lib/theory/scales"
import {cn} from "@/lib/utils"
import {PIANO_PATHS} from "@/router/paths"
import type {NoteName} from "@/types/music"
import {PageHeader} from "@/widgets/PageHeader"
import {PianoKeyboard, type KeyMarker} from "@/widgets/PianoKeyboard"
import {PlayButton} from "@/widgets/PlayButton"
import {RootNotePicker} from "@/widgets/RootNotePicker"
import {ToneTable} from "@/widgets/ToneTable"
import {Term, TermText} from "@/widgets/Term"

type KeyLabels = "notes" | "degrees"

const KEY_LABELS: KeyLabels[] = ["notes", "degrees"]

function ChordLink({symbol, label}: {symbol: string; label: string}) {
    const parsed = parseChordSymbol(symbol)
    if (!parsed) return <span>{label}</span>
    return (
        <Link to={PIANO_PATHS.chord(parsed.root, parsed.type.symbol)} className="font-medium text-brand-700 hover:underline dark:text-brand-400">
            {label}
        </Link>
    )
}

interface HandCardProps {
    scale: ScaleInfo
    hand: Hand
    /** Null when the scale has no standard fingering: the card then shows the keys only. */
    fingers: number[] | null
    labels: KeyLabels
}

/** One hand's octave on the keys, with its fingering table underneath. */
function HandCard({scale, hand, fingers, labels}: HandCardProps) {
    const {t} = useTranslation("piano")
    const {notation} = useSettings()
    const midi = handScaleMidi(scale, hand)
    const {from, to} = keyboardRange(midi)
    const noteAt = (index: number) => scale.notes[index % scale.notes.length] ?? ""
    const crossingAt = new Set(fingers ? crossings(fingers, hand) : [])

    const label = (index: number) => {
        if (labels === "degrees") return scale.degrees[index % scale.degrees.length] ?? ""
        return formatNote(noteAt(index), notation)
    }
    const markers: KeyMarker[] = midi.map((note, index) => {
        const isRoot = index === 0 || index === midi.length - 1
        // The left hand's keys and fingers are blue, but the roots keep the root colour in both hands.
        return {midi: note, label: label(index), isRoot, isLeftHand: hand === "left", fillClass: hand === "left" && isRoot ? "fill-brand-600" : undefined, finger: fingers?.[index]}
    })

    return (
        <Card className="flex min-w-0 flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold">{t(`scales.hands.${hand}`)}</h3>
                <PlayButton instrument="piano" mode="arpeggio" midi={upAndDown(midi)} label={t(`scales.playHand.${hand}`)}/>
            </div>
            <PianoKeyboard from={from} to={to} markers={markers} ariaLabel={t(`scales.hands.${hand}`)}/>
            {fingers && (
                <div className="overflow-x-auto">
                    <table className="w-full text-center text-sm tabular-nums">
                        <tbody>
                            <tr>
                                <th scope="row" className="py-1.5 pr-3 text-left text-xs font-medium text-stone-500">{t("scales.table.note")}</th>
                                {midi.map((note, index) => (
                                    <td key={note} className="px-1 py-1.5 text-stone-600 dark:text-stone-400">{formatNote(noteAt(index), notation)}</td>
                                ))}
                            </tr>
                            <tr>
                                <th scope="row" className="py-1.5 pr-3 text-left text-xs font-medium text-stone-500">{t("scales.fingering")}</th>
                                {fingers.map((finger, index) => (
                                    <td key={index} className="px-0.5 py-1">
                                        <span
                                            title={crossingAt.has(index) ? t("scales.table.crossing") : undefined}
                                            className={cn(
                                                "inline-flex size-7 items-center justify-center rounded-md font-semibold",
                                                crossingAt.has(index)
                                                    ? "bg-brand-600 text-white"
                                                    : "bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-200",
                                            )}
                                        >
                                            {finger}
                                        </span>
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
        </Card>
    )
}

export default function PianoScalesPage() {
    const {t} = useTranslation("theory")
    const {t: tPiano} = useTranslation("piano")
    const {t: tCommon} = useTranslation()
    const {notation} = useSettings()
    const [params, setParams] = useSearchParams()

    const root = slugToRoot(params.get("root") ?? "") ?? "C"
    const scale = getScaleInfo(root, params.get("scale") ?? "major") ?? getScaleInfo(root, "major")!
    const fingering = fingeringFor(scale)
    const labelsParam = params.get("labels") as KeyLabels | null
    const labelOptions = KEY_LABELS
    const labels: KeyLabels = labelsParam && labelOptions.includes(labelsParam) ? labelsParam : labelOptions[0]!
    const diatonic = getDiatonicChords(scale.root, scale.def.id)
    const scaleName = `${formatNote(scale.root, notation)} ${t(`scales.${scale.def.id}`)}`

    const updateParams = (patch: {root?: NoteName; scale?: string; labels?: KeyLabels}) => {
        const next = new URLSearchParams(params)
        if (patch.root) next.set("root", rootToSlug(patch.root))
        if (patch.scale) next.set("scale", patch.scale)
        if (patch.labels) next.set("labels", patch.labels)
        setParams(next, {replace: true})
    }

    return (
        <div className="space-y-8">
            <PageHeader title={tCommon("nav.scales")} description={tPiano("scales.description")}/>

            <Card className="space-y-5">
                <div className="flex flex-wrap items-end gap-4">
                    <label className="space-y-2">
                        <span className="block text-xs font-semibold tracking-wide text-stone-500 uppercase">{t("scale")}</span>
                        <Select value={scale.def.id} onChange={event => updateParams({scale: event.target.value})} className="w-64">
                            {SCALE_GROUPS.map(group => (
                                <optgroup key={group} label={t(`scaleGroups.${group}`)}>
                                    {SCALES.filter(item => item.group === group).map(item => (
                                        <option key={item.id} value={item.id}>{t(`scales.${item.id}`)}</option>
                                    ))}
                                </optgroup>
                            ))}
                        </Select>
                    </label>
                    <PlayButton instrument="piano" mode="arpeggio" midi={upAndDown(handScaleMidi(scale, "right"))} variant="primary" size="md"/>
                </div>
                <RootNotePicker value={scale.root} onChange={value => updateParams({root: value})}/>
            </Card>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold tracking-tight">{scaleName}</h2>
                <ToneTable notes={scale.notes} degrees={scale.degrees}/>
            </section>

            <section className="space-y-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div className="max-w-2xl space-y-1">
                        <h3 className="text-lg font-semibold tracking-tight">{fingering ? tPiano("scales.fingering") : tPiano("scales.onKeys")}</h3>
                        {fingering
                            ? (
                                <>
                                    <p className="text-sm font-medium text-stone-700 dark:text-stone-300">{tPiano("scales.fingerNames")}</p>
                                    <p className="text-sm text-stone-600 text-pretty dark:text-stone-400">{tPiano("scales.fingeringHint")}</p>
                                </>
                            )
                            : <p className="text-sm text-stone-600 text-pretty dark:text-stone-400">{tPiano("scales.noFingering")}</p>}
                    </div>
                    <Segmented
                        label={tPiano("scales.labelsTitle")}
                        value={labels}
                        onChange={value => updateParams({labels: value})}
                        options={labelOptions.map(value => ({value, label: tPiano(`scales.labels.${value}`)}))}
                    />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <HandCard scale={scale} hand="right" fingers={fingering?.right ?? null} labels={labels}/>
                    <HandCard scale={scale} hand="left" fingers={fingering?.left ?? null} labels={labels}/>
                </div>
                {fingering && <p className="text-sm text-stone-500">{tPiano("scales.moreOctaves")}</p>}
            </section>

            {diatonic && (
                <section className="space-y-3">
                    <div>
                        <h3 className="text-lg font-semibold tracking-tight">{t("diatonic.title")}</h3>
                        <p className="text-sm text-stone-600 dark:text-stone-400"><TermText text={t("diatonic.description")}/></p>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
                        <table className="w-full text-center text-sm">
                            <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                                <tr>
                                    <th scope="row" className="px-4 py-2.5 text-left font-medium text-stone-500">{t("diatonic.degree")}</th>
                                    {diatonic.map(chord => <td key={chord.roman} className="px-3 py-2.5 font-semibold">{chord.roman}</td>)}
                                </tr>
                                <tr>
                                    <th scope="row" className="px-4 py-2.5 text-left font-medium text-stone-500"><Term id="triad">{t("diatonic.triad")}</Term></th>
                                    {diatonic.map(chord => (
                                        <td key={chord.roman} className="px-3 py-2.5"><ChordLink symbol={chord.triadSymbol} label={chord.triad}/></td>
                                    ))}
                                </tr>
                                <tr>
                                    <th scope="row" className="px-4 py-2.5 text-left font-medium text-stone-500"><Term id="seventhChord">{t("diatonic.seventh")}</Term></th>
                                    {diatonic.map(chord => (
                                        <td key={chord.roman} className="px-3 py-2.5"><ChordLink symbol={chord.seventhSymbol} label={chord.seventh}/></td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </div>
    )
}
