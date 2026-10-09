import {Link, useSearchParams} from "react-router"
import {useTranslation} from "react-i18next"
import {Card} from "@/components/ui/card"
import {Segmented} from "@/components/ui/segmented"
import {Select} from "@/components/ui/select"
import {SCALE_GROUPS, SCALES} from "@/constants/scales"
import {useSettings} from "@/hooks/useSettings"
import {parseChordSymbol} from "@/lib/theory/chords"
import {markersForTones, zipTones, type FretMarker} from "@/lib/theory/fretboard"
import {formatNote, rootToSlug, slugToRoot} from "@/lib/theory/notes"
import {COMFORTABLE_SPAN, scalePositions} from "@/lib/theory/positions"
import {getDiatonicChords, getScaleInfo, scaleMidi} from "@/lib/theory/scales"
import {PATHS} from "@/router/paths"
import type {NoteName} from "@/types/music"
import {Fretboard} from "@/widgets/Fretboard"
import {PageHeader} from "@/widgets/PageHeader"
import {PlayButton} from "@/widgets/PlayButton"
import {RootNotePicker} from "@/widgets/RootNotePicker"
import {ToneTable} from "@/widgets/ToneTable"
import {Term, TermText} from "@/widgets/Term"

function ChordLink({symbol, label}: {symbol: string; label: string}) {
    const parsed = parseChordSymbol(symbol)
    if (!parsed) return <span>{label}</span>
    return (
        <Link to={PATHS.chord(parsed.root, parsed.type.symbol)} className="font-medium text-brand-700 hover:underline dark:text-brand-400">
            {label}
        </Link>
    )
}

export default function ScalesPage() {
    const {t} = useTranslation("theory")
    const {t: tCommon} = useTranslation()
    const {tuning, notation} = useSettings()
    const [params, setParams] = useSearchParams()

    const root = slugToRoot(params.get("root") ?? "") ?? "A"
    const scaleId = params.get("scale") ?? "minorPentatonic"
    const scale = getScaleInfo(root, scaleId) ?? getScaleInfo(root, "minorPentatonic")!

    const markers = markersForTones(tuning, 15, zipTones(scale.notes, scale.degrees))
    // Positions are worked out for standard tuning, like the chord shapes.
    const positions = tuning.id === "standard" ? scalePositions(scale) : []
    const position = positions.find(item => String(item.number) === params.get("pos"))
    const fretCount = Math.max(15, position?.maxFret ?? 0)
    // The chosen position on top, the rest of the scale as small dots so the box can be placed on the neck.
    const positionMarkers: FretMarker[] | undefined = position && [
        ...markersForTones(tuning, fretCount, zipTones(scale.notes, scale.degrees))
            .filter(marker => !position.notes.some(note => note.string === marker.string && note.fret === marker.fret))
            .map(marker => ({...marker, isRoot: false, small: true, fillClass: "fill-stone-300 dark:fill-stone-700", textClass: "fill-stone-700 dark:fill-stone-200"})),
        ...position.notes.map(note => ({string: note.string, fret: note.fret, note: note.note, degree: note.degree, isRoot: note.degree === "1"})),
    ]
    const diatonic = getDiatonicChords(scale.root, scale.def.id)

    const updateParams = (patch: {root?: NoteName; scale?: string; pos?: string}) => {
        const next = new URLSearchParams(params)
        if (patch.root) next.set("root", rootToSlug(patch.root))
        if (patch.scale) next.set("scale", patch.scale)
        if (patch.pos) {
            if (patch.pos === "all") next.delete("pos")
            else next.set("pos", patch.pos)
        }
        setParams(next, {replace: true})
    }

    const scaleName = `${formatNote(scale.root, notation)} ${t(`scales.${scale.def.id}`)}`

    return (
        <div className="space-y-8">
            <PageHeader
                title={tCommon("nav.scales")}
                description={tCommon("home.cards.scales.description")}
            />

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
                    <PlayButton midi={scaleMidi(scale)} mode="arpeggio" variant="primary" size="md"/>
                </div>
                <RootNotePicker value={scale.root} onChange={value => updateParams({root: value})}/>
            </Card>

            <section className="space-y-4">
                <h2 className="text-2xl font-bold tracking-tight">{scaleName}</h2>
                <ToneTable notes={scale.notes} degrees={scale.degrees}/>
            </section>

            <section className="space-y-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <h3 className="text-lg font-semibold tracking-tight">{t("scaleOnFretboard")}</h3>
                    {positions.length > 0 && (
                        <Segmented
                            label={t("positions.label")}
                            value={position ? String(position.number) : "all"}
                            onChange={value => updateParams({pos: value})}
                            options={[
                                {value: "all", label: t("positions.all")},
                                ...positions.map(item => ({value: String(item.number), label: String(item.number)})),
                            ]}
                        />
                    )}
                </div>
                {positions.length > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                        <p className="text-stone-600 dark:text-stone-400">
                            {position
                                ? (
                                    <>
                                        <strong className="text-stone-900 dark:text-stone-100">{t("positions.title", {n: position.number})}</strong>
                                        {" · "}{t("positions.frets", {from: position.minFret, to: position.maxFret})}
                                        {" · "}{t(`positions.perString.${position.system}`)}
                                        {position.maxFret - position.minFret > COMFORTABLE_SPAN && <> · <span className="text-amber-700 dark:text-amber-400">{t("positions.stretch")}</span></>}
                                    </>
                                )
                                : <TermText text={t(`positions.systems.${positions[0]!.system}`, {count: positions.length})}/>}
                        </p>
                        {position && <PlayButton midi={position.notes.map(note => note.midi)} mode="arpeggio" label={t("positions.play")}/>}
                    </div>
                )}
                <Fretboard markers={positionMarkers ?? markers} fretCount={fretCount} ariaLabel={`${scaleName} — ${t("scaleOnFretboard")}`}/>
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
