import {Link} from "react-router"
import {useTranslation} from "react-i18next"
import {ArrowRight, GitCompareArrows, Loader2, Volume2} from "lucide-react"
import {Button} from "@/components/ui/button"
import {Card} from "@/components/ui/card"
import {usePlayer} from "@/hooks/usePlayer"
import {useSettings} from "@/hooks/useSettings"
import {buildChord, builderMidi} from "@/lib/theory/builder"
import {markersForTones, zipTones} from "@/lib/theory/fretboard"
import {getVoicings} from "@/lib/theory/voicings"
import {PATHS} from "@/router/paths"
import {ChangeCard, chordTitle, SlotControls, ThirdsLadder, TourCard, useChordBuilder} from "@/widgets/ChordBuilder"
import {ChordDiagram} from "@/widgets/ChordDiagram"
import {Fretboard} from "@/widgets/Fretboard"
import {PageHeader} from "@/widgets/PageHeader"
import {TermText} from "@/widgets/Term"
import {ToneTable} from "@/widgets/ToneTable"

export default function BuilderPage() {
    const {t} = useTranslation("theory")
    const {t: tCommon} = useTranslation()
    const {notation, tuning} = useSettings()
    const player = usePlayer()
    const {root, state, previous, change, tour, apply, setRoot, startTourStep, closeTour} = useChordBuilder()

    const chord = buildChord(root, state)
    const title = chordTitle(root, chord, notation, t)
    const voicing = chord.type ? getVoicings(root, chord.type.symbol)[0] : undefined
    const markers = markersForTones(tuning, 15, zipTones(chord.notes, chord.degrees))

    return (
        // Bottom padding on small screens leaves room for the fixed result bar.
        <div className="space-y-8 pb-20 lg:pb-0">
            <PageHeader title={tCommon("nav.builder")} description={<TermText text={t("builder.description")}/>}/>

            <TourCard
                tour={tour}
                stepText={(id, index) => t(`builder.tours.${id}.steps.${index}`, {name: title})}
                onStep={startTourStep}
                onClose={closeTour}
            />

            <div className="grid items-start gap-6 lg:grid-cols-[1fr_20rem]">
                <div className="min-w-0 space-y-6">
                    <Card className="space-y-4 lg:sticky lg:top-20 lg:z-10">
                        <div className="flex flex-wrap items-end justify-between gap-3">
                            <div>
                                <p className="text-4xl font-bold tracking-tight">{title}</p>
                                <p className="text-sm text-stone-500">
                                    {chord.type ? t(`chordTypes.${chord.type.symbol}`) : t("builder.unnamedHint")}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button size="sm" onClick={() => void player.strum(builderMidi(root, state))}>
                                    {player.isLoading ? <Loader2 className="animate-spin"/> : <Volume2/>} {t("builder.playChord")}
                                </Button>
                                <Button variant="secondary" size="sm" onClick={() => void player.arpeggiate(builderMidi(root, state))}>
                                    {t("builder.playNotes")}
                                </Button>
                                {previous && (
                                    <Button variant="secondary" size="sm" onClick={() => void player.strumSequence([builderMidi(root, previous), builderMidi(root, state)])}>
                                        <GitCompareArrows/> {t("builder.compare")}
                                    </Button>
                                )}
                            </div>
                        </div>
                        <ToneTable notes={chord.notes} degrees={chord.degrees}/>
                    </Card>

                    <SlotControls root={root} state={state} onRoot={setRoot} onChange={apply}/>
                </div>

                <aside className="space-y-6">
                    <ThirdsLadder root={root} state={state}/>

                    <ChangeCard
                        root={root}
                        title={title}
                        change={change}
                        previous={previous}
                        hintText={item => t(`builder.hints.${item.slot}.${item.value}`)}
                    />

                    <Card className="flex flex-col items-center gap-3">
                        {voicing && chord.type
                            ? (
                                <>
                                    <ChordDiagram voicing={voicing} root={root} chordNotes={chord.notes} title={title}/>
                                    {chord.impliedFifth && <p className="text-center text-xs text-stone-500">{t("builder.diagramWithFifth")}</p>}
                                    <Link to={PATHS.chord(root, chord.type.symbol)} className="inline-flex min-h-6 items-center pointer-coarse:min-h-10 gap-1 text-sm font-medium text-brand-700 hover:underline dark:text-brand-400">
                                        {t("builder.openChord")} <ArrowRight className="size-4"/>
                                    </Link>
                                </>
                            )
                            : <p className="py-6 text-center text-sm text-stone-500">{t("builder.noDiagram")}</p>}
                    </Card>
                </aside>
            </div>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold tracking-tight">{t("onFretboard")}</h2>
                <Fretboard markers={markers} ariaLabel={`${title} — ${t("onFretboard")}`}/>
            </section>

            {/* Small screens: the result card scrolls away above the controls, so keep the chord in view. */}
            <div
                aria-live="polite"
                className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-stone-50/95 px-4 py-2 backdrop-blur lg:hidden dark:border-stone-800 dark:bg-stone-950/95"
            >
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
                    <div className="min-w-0">
                        <p className="truncate text-xl font-bold tracking-tight">{title}</p>
                        <p className="truncate text-xs text-stone-500">{chord.degrees.join(" – ")}</p>
                    </div>
                    <Button size="sm" onClick={() => void player.strum(builderMidi(root, state))} aria-label={t("builder.playChord")}>
                        {player.isLoading ? <Loader2 className="animate-spin"/> : <Volume2/>}
                    </Button>
                </div>
            </div>
        </div>
    )
}
