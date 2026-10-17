import {Link, useNavigate, useParams, useSearchParams} from "react-router"
import {useTranslation} from "react-i18next"
import {ArrowLeft} from "lucide-react"
import {buttonVariants} from "@/components/ui/button"
import {Card} from "@/components/ui/card"
import {ROOT_NOTES} from "@/constants/notes"
import {useSettings} from "@/hooks/useSettings"
import {formatChordName, getChordInfo, type ChordInfo} from "@/lib/theory/chords"
import {markersForTones, zipTones} from "@/lib/theory/fretboard"
import {chroma, formatNote, mod12, rootToSlug, slugToRoot} from "@/lib/theory/notes"
import {inversionBasses, inversionOf, slashVoicings} from "@/lib/theory/slash"
import {getVoicings, isMovableVoicing, sortByPosition, voicingMidi, voicingPosition} from "@/lib/theory/voicings"
import {PATHS} from "@/router/paths"
import NotFoundPage from "@/pages/NotFoundPage"
import {ChordCard} from "@/widgets/ChordCard"
import {ChordDiagram} from "@/widgets/ChordDiagram"
import {ChordUsage} from "@/widgets/ChordUsage"
import {Fretboard} from "@/widgets/Fretboard"
import {MobilityBadge} from "@/widgets/MobilityBadge"
import {MobilityPanel} from "@/widgets/MobilityPanel"
import {PageHeader} from "@/widgets/PageHeader"
import {PlayButton} from "@/widgets/PlayButton"
import {RootNotePicker} from "@/widgets/RootNotePicker"
import {ToneTable} from "@/widgets/ToneTable"
import {TermText} from "@/widgets/Term"

function SlashNote({chord}: {chord: ChordInfo}) {
    const {t} = useTranslation("theory")
    const {notation} = useSettings()
    if (!chord.bass) return null

    const inversion = inversionOf(chord.root, chord.type.symbol, chord.bass)
    const plain = formatChordName({...chord, bass: undefined}, notation)

    return (
        <p className="rounded-lg bg-brand-50 p-3 text-sm text-stone-700 dark:bg-brand-950/50 dark:text-stone-300">
            {t("slash.explain", {chord: plain, bass: formatNote(chord.bass, notation), degree: chord.bassDegree})}
            {" "}
            <TermText text={t(`slash.inversions.${inversion}`)}/>
            {" "}
            <Link to={PATHS.chord(chord.root, chord.type.symbol)} className="font-medium text-brand-700 hover:underline dark:text-brand-400">
                {t("slash.backToChord", {chord: plain})}
            </Link>
        </p>
    )
}

export default function ChordDetailPage() {
    const {t} = useTranslation("theory")
    const {t: tCommon} = useTranslation()
    const params = useParams()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const {tuning, notation} = useSettings()

    const root = slugToRoot(params.root ?? "")
    const bass = slugToRoot(searchParams.get("bass") ?? "")
    const chord = root ? getChordInfo(root, params.type ?? "", bass) : null

    if (!chord) return <NotFoundPage/>

    // Open shapes first, then up the neck — so the cards read like a walk from the nut to the 15th fret.
    const voicings = sortByPosition(chord.bass ? slashVoicings(chord.root, chord.type.symbol, chord.bass) : getVoicings(chord.root, chord.type.symbol))
    const toneNotes = chord.bass && !chord.notes.some(note => chroma(note) === chroma(chord.bass!)) ? [...chord.notes, chord.bass] : chord.notes
    const toneDegrees = toneNotes.length > chord.notes.length ? [...chord.degrees, chord.bassDegree ?? ""] : chord.degrees
    const markers = markersForTones(tuning, 15, zipTones(toneNotes, toneDegrees))
    const movableCount = voicings.filter(isMovableVoicing).length

    // Other slash versions of this chord (C → C/E, C/G); on a slash page, its siblings.
    const inversions = inversionBasses(chord.root, chord.type.symbol)
        .filter(note => !chord.bass || chroma(note) !== chroma(chord.bass))
        .flatMap(note => {
            const info = getChordInfo(chord.root, chord.type.symbol, note)
            return info ? [{chord: info, voicing: slashVoicings(chord.root, chord.type.symbol, note)[0]}] : []
        })

    const displayName = formatChordName(chord, notation)
    const neighbour = (semitones: number) => {
        const shift = (note: string) => ROOT_NOTES[mod12(chroma(note) + semitones)] ?? note
        return formatChordName({...chord, root: shift(chord.root), bass: chord.bass && shift(chord.bass)}, notation)
    }
    const diagramNotes = chord.bass ? [...chord.notes, chord.bass] : chord.notes

    return (
        <div className="space-y-8">
            <Link
                to={`${PATHS.chords}?filter=${chord.bass ? "slash" : chord.type.category}&root=${rootToSlug(chord.root)}`}
                className={buttonVariants({variant: "ghost", size: "sm"})}
            >
                <ArrowLeft/> {tCommon("actions.back")}
            </Link>

            <PageHeader
                title={<>{displayName} <span className="font-medium text-stone-500">· {t(`chordTypes.${chord.type.symbol}`)}</span></>}
                description={<TermText text={t(`chordCategoryDescriptions.${chord.bass ? "slash" : chord.type.category}`)}/>}
                actions={voicings[0] && <PlayButton midi={voicingMidi(voicings[0])} variant="primary" size="md"/>}
            />

            <Card className="space-y-5">
                <ToneTable notes={chord.notes} degrees={chord.degrees}/>
                <SlashNote chord={chord}/>
                <RootNotePicker
                    value={chord.root}
                    onChange={next => {
                        // Keep the bass at the same distance from the root: C/E → D/F♯.
                        const nextBass = chord.bass ? ROOT_NOTES[mod12(chroma(chord.bass) + chroma(next) - chroma(chord.root))] : undefined
                        navigate(PATHS.chord(next, chord.type.symbol, nextBass), {replace: true})
                    }}
                />
            </Card>

            <div className="grid items-start gap-8 lg:grid-cols-[1fr_18rem]">
                <section className="min-w-0 space-y-4">
                    <h2 className="text-xl font-semibold tracking-tight">{t("voicings")}</h2>
                    {voicings.length === 0
                        ? <p className="text-sm text-stone-500">{t("noVoicings")}</p>
                        : (
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                                {voicings.map(voicing => (
                                    <Card key={voicing.id} className="flex flex-col items-center gap-3">
                                        <div className="text-center">
                                            <p className="text-sm font-medium text-stone-600 dark:text-stone-400">{t(`shapes.${voicing.shape}`)}</p>
                                            {voicing.shape !== "open" && (
                                                <p className="text-xs font-semibold text-brand-700 dark:text-brand-400">{t("atFret", {fret: voicingPosition(voicing)})}</p>
                                            )}
                                        </div>
                                        <ChordDiagram voicing={voicing} root={chord.root} chordNotes={diagramNotes} title={`${displayName} — ${t(`shapes.${voicing.shape}`)}`}/>
                                        <MobilityBadge voicing={voicing}/>
                                        <PlayButton midi={voicingMidi(voicing)}/>
                                    </Card>
                                ))}
                            </div>
                        )}
                </section>

                <aside>
                    <MobilityPanel movableCount={movableCount} fixedCount={voicings.length - movableCount}>
                        {movableCount > 0 && (
                            <p className="rounded-lg bg-stone-100 p-3 text-sm text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                                {t("mobility.slideHint", {up: neighbour(1), down: neighbour(-1), twelve: displayName})}
                            </p>
                        )}
                    </MobilityPanel>
                </aside>
            </div>

            {inversions.length > 0 && (
                <section className="space-y-4">
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight">{t("slash.inversionsTitle")}</h2>
                        <p className="text-sm text-stone-600 dark:text-stone-400"><TermText text={t("slash.inversionsHint")}/></p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                        {inversions.map(item => <ChordCard key={item.chord.name} chord={item.chord} voicing={item.voicing}/>)}
                    </div>
                </section>
            )}

            <ChordUsage key={`${chord.root}-${chord.type.symbol}`} root={chord.root} type={chord.type.symbol} chordPath={PATHS.chord} progressionsPath={PATHS.progressions}/>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold tracking-tight">{t("onFretboard")}</h2>
                <Fretboard markers={markers} ariaLabel={`${displayName} — ${t("onFretboard")}`}/>
            </section>
        </div>
    )
}
