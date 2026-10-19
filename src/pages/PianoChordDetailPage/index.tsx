import {Link, useNavigate, useParams, useSearchParams} from "react-router"
import {useTranslation} from "react-i18next"
import {ArrowLeft} from "lucide-react"
import {Chord} from "tonal"
import {buttonVariants} from "@/components/ui/button"
import {Card} from "@/components/ui/card"
import {ROOT_NOTES} from "@/constants/notes"
import {useSettings} from "@/hooks/useSettings"
import {isPlayable} from "@/lib/piano/fingering"
import {keyboardRange, pianoVoicings, voicingNotes, type PianoVoicing} from "@/lib/piano/voicings"
import {formatChordName, getChordInfo, type ChordInfo} from "@/lib/theory/chords"
import {chroma, formatNote, mod12, rootToSlug, slugToRoot} from "@/lib/theory/notes"
import {inversionOf, SLASH_CHORD_TYPES} from "@/lib/theory/slash"
import {PIANO_PATHS} from "@/router/paths"
import NotFoundPage from "@/pages/NotFoundPage"
import {ChordUsage} from "@/widgets/ChordUsage"
import {PageHeader} from "@/widgets/PageHeader"
import {PianoChordCard} from "@/widgets/PianoChordCard"
import {PianoChordKeys} from "@/widgets/PianoChordKeys"
import {PlayButton} from "@/widgets/PlayButton"
import {RootNotePicker} from "@/widgets/RootNotePicker"
import {ToneTable} from "@/widgets/ToneTable"
import {TermText} from "@/widgets/Term"

const kindKey = (voicing: PianoVoicing) => (voicing.kind === "close" ? `close${voicing.inversion ?? 0}` : voicing.kind)

function SlashNote({chord}: {chord: ChordInfo}) {
    const {t} = useTranslation("theory")
    const {notation} = useSettings()
    if (!chord.bass) return null

    const inversion = inversionOf(chord.root, chord.type.symbol, chord.bass)
    const plain = formatChordName({...chord, bass: undefined}, notation)

    return (
        <p className="rounded-lg bg-brand-50 p-3 text-sm text-base-700 dark:bg-brand-950/50 dark:text-base-300">
            {t("slash.explain", {chord: plain, bass: formatNote(chord.bass, notation), degree: chord.bassDegree})}
            {" "}
            <TermText text={t(`slash.inversions.${inversion}`)}/>
            {" "}
            <Link to={PIANO_PATHS.chord(chord.root, chord.type.symbol)} className="font-medium text-brand-700 hover:underline dark:text-brand-400">
                {t("slash.backToChord", {chord: plain})}
            </Link>
        </p>
    )
}

function Legend({showLeftHand}: {showLeftHand: boolean}) {
    const {t} = useTranslation("piano")
    const item = (dotClass: string, label: string) => (
        <span className="inline-flex items-center gap-1.5">
            <span className={`size-3 rounded-full ${dotClass}`}/>
            {label}
        </span>
    )

    return (
        <div className="flex flex-wrap gap-4 text-xs text-base-600 dark:text-base-400">
            {item("bg-brand-strong", t("legend.root"))}
            {item("bg-base-800 ring-1 ring-base-500", t("legend.right"))}
            {showLeftHand && item("bg-sky-600", t("legend.left"))}
        </div>
    )
}

export default function PianoChordDetailPage() {
    const {t} = useTranslation("theory")
    const {t: tPiano} = useTranslation("piano")
    const {t: tCommon} = useTranslation()
    const params = useParams()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const {notation} = useSettings()

    const root = slugToRoot(params.root ?? "")
    const bass = slugToRoot(searchParams.get("bass") ?? "")
    const chord = root ? getChordInfo(root, params.type ?? "", bass) : null

    if (!chord) return <NotFoundPage/>

    const voicings = pianoVoicings(chord)
    // One range for every voicing, so the keyboards line up key for key.
    const range = keyboardRange(voicings.flatMap(voicingNotes))
    const displayName = formatChordName(chord, notation)

    // Other slash versions of this chord (C → C/E, C/G); on a slash page, its siblings.
    const slashVersions = SLASH_CHORD_TYPES.includes(chord.type.symbol)
        ? Chord.getChord(chord.type.symbol, chord.root).notes.slice(1, 4)
            .filter(note => !chord.bass || chroma(note) !== chroma(chord.bass))
            .flatMap(note => getChordInfo(chord.root, chord.type.symbol, note) ?? [])
        : []

    return (
        <div className="space-y-8">
            <Link
                to={`${PIANO_PATHS.chords}?filter=${chord.bass ? "slash" : chord.type.category}&root=${rootToSlug(chord.root)}`}
                className={buttonVariants({variant: "ghost", size: "sm"})}
            >
                <ArrowLeft/> {tCommon("actions.back")}
            </Link>

            <PageHeader
                title={<>{displayName} <span className="font-medium text-base-500">· {t(`chordTypes.${chord.type.symbol}`)}</span></>}
                description={<TermText text={tPiano(`categoryDescriptions.${chord.bass ? "slash" : chord.type.category}`)}/>}
                actions={voicings[0] && (
                    <>
                        <PlayButton instrument="piano" midi={voicingNotes(voicings[0])} variant="primary" size="md"/>
                        <PlayButton instrument="piano" mode="arpeggio" midi={voicingNotes(voicings[0])} label={tPiano("arpeggio")} size="md"/>
                    </>
                )}
            />

            <Card className="space-y-5">
                <ToneTable notes={chord.notes} degrees={chord.degrees}/>
                <SlashNote chord={chord}/>
                <RootNotePicker
                    value={chord.root}
                    onChange={next => {
                        // Keep the bass at the same distance from the root: C/E → D/F♯.
                        const nextBass = chord.bass ? ROOT_NOTES[mod12(chroma(chord.bass) + chroma(next) - chroma(chord.root))] : undefined
                        navigate(PIANO_PATHS.chord(next, chord.type.symbol, nextBass), {replace: true})
                    }}
                />
            </Card>

            <section className="space-y-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight">{tPiano("voicings")}</h2>
                        <p className="text-sm text-base-600 dark:text-base-400">{tPiano("voicingsHint")}</p>
                        <p className="text-sm text-base-600 dark:text-base-400">{tPiano("fingers.legend")}</p>
                    </div>
                    <Legend showLeftHand={voicings.some(voicing => voicing.left.length > 0)}/>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    {voicings.map(voicing => {
                        const label = tPiano(`kinds.${kindKey(voicing)}`)
                        return (
                            <Card key={voicing.id} className="flex min-w-0 flex-col gap-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-0.5">
                                        <p className="font-semibold">{label}</p>
                                        <p className="text-sm text-base-600 dark:text-base-400"><TermText text={tPiano(`kindHints.${kindKey(voicing)}`)}/></p>
                                    </div>
                                    <PlayButton instrument="piano" midi={voicingNotes(voicing)} className="shrink-0"/>
                                </div>
                                <PianoChordKeys chord={chord} voicing={voicing} range={range} playable title={`${displayName} — ${label}`}/>
                                {!isPlayable(voicing) && <p className="text-xs text-amber-700 dark:text-amber-400">{tPiano("fingers.tooWide")}</p>}
                            </Card>
                        )
                    })}
                </div>
            </section>

            <ChordUsage key={`${chord.root}-${chord.type.symbol}`} root={chord.root} type={chord.type.symbol} chordPath={PIANO_PATHS.chord} progressionsPath={PIANO_PATHS.progressions}/>

            {slashVersions.length > 0 && (
                <section className="space-y-4">
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight">{tPiano("slashVersions")}</h2>
                        <p className="text-sm text-base-600 dark:text-base-400">{tPiano("slashVersionsHint")}</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {slashVersions.map(item => <PianoChordCard key={item.name} chord={item}/>)}
                    </div>
                </section>
            )}
        </div>
    )
}
