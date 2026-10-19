import {Link} from "react-router"
import {useTranslation} from "react-i18next"
import {ArrowRight, GitCompareArrows, Loader2, Volume2} from "lucide-react"
import {Button} from "@/components/ui/button"
import {Card, CardTitle} from "@/components/ui/card"
import {usePianoPlayer} from "@/hooks/usePianoPlayer"
import {useSettings} from "@/hooks/useSettings"
import {fingerMap} from "@/lib/piano/fingering"
import {closeVoicing, keyboardRange, twoHandVoicing, voicingNotes} from "@/lib/piano/voicings"
import {buildChord, builderMidi} from "@/lib/theory/builder"
import {getChordInfo} from "@/lib/theory/chords"
import {PIANO_PATHS} from "@/router/paths"
import {ChangeCard, chordTitle, SlotControls, ThirdsLadder, TourCard, useChordBuilder} from "@/widgets/ChordBuilder"
import {PageHeader} from "@/widgets/PageHeader"
import {PianoChordKeys} from "@/widgets/PianoChordKeys"
import {PianoKeyboard} from "@/widgets/PianoKeyboard"
import {PlayButton} from "@/widgets/PlayButton"
import {TermText} from "@/widgets/Term"
import {ToneTable} from "@/widgets/ToneTable"

/** The tower is stacked from the root in octave 3, so even a 13th chord fits on three octaves. */
const TOWER_OCTAVE = 3

export default function PianoBuilderPage() {
    const {t, i18n} = useTranslation("theory")
    const {t: tPiano} = useTranslation("piano")
    const {t: tCommon} = useTranslation()
    const {notation} = useSettings()
    const player = usePianoPlayer()
    const {root, state, previous, change, tour, apply, setRoot, startTourStep, closeTour} = useChordBuilder()

    // A few builder texts talk about the guitar; the piano namespace rewords just those.
    const builderText = (key: string, options?: Record<string, string>) =>
        i18n.exists(`builder.${key}`, {ns: "piano"}) ? tPiano(`builder.${key}`, options) : t(`builder.${key}`, options)

    const chord = buildChord(root, state)
    const title = chordTitle(root, chord, notation, t)
    const tower = builderMidi(root, state, TOWER_OCTAVE)
    const towerRange = keyboardRange(tower, 3)
    // Small chords fit in the right hand; a 9th or 13th tower does not, so it gets no fingers.
    const towerFingers = fingerMap(tower, "right")
    const towerMarkers = tower.map((midi, index) => ({midi, label: chord.degrees[index] ?? "", isRoot: index === 0, finger: towerFingers.get(midi)}))

    // The catalogue chord the stack matches, voiced the way a pianist would play it.
    const info = chord.type ? getChordInfo(root, chord.type.symbol) : null
    const playable = info && (info.notes.length > 3 ? twoHandVoicing(info) : {left: [], right: closeVoicing(info)})

    const playTower = () => void player.chord(tower)

    return (
        // Bottom padding on small screens leaves room for the fixed result bar.
        <div className="space-y-8 pb-20 lg:pb-0">
            <PageHeader title={tCommon("nav.builder")} description={<TermText text={builderText("description")}/>}/>

            <TourCard
                tour={tour}
                stepText={(id, index) => builderText(`tours.${id}.steps.${index}`, {name: title})}
                onStep={startTourStep}
                onClose={closeTour}
            />

            <div className="grid items-start gap-6 lg:grid-cols-[1fr_20rem]">
                <div className="min-w-0 space-y-6">
                    <Card className="space-y-4 lg:sticky lg:top-20 lg:z-10">
                        <div className="flex flex-wrap items-end justify-between gap-3">
                            <div>
                                <p className="text-4xl font-bold tracking-tight">{title}</p>
                                <p className="text-sm text-base-500">
                                    {chord.type ? t(`chordTypes.${chord.type.symbol}`) : t("builder.unnamedHint")}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button size="sm" onClick={playTower}>
                                    {player.isLoading ? <Loader2 className="animate-spin"/> : <Volume2/>} {t("builder.playChord")}
                                </Button>
                                <Button variant="secondary" size="sm" onClick={() => void player.arpeggio(tower)}>
                                    {t("builder.playNotes")}
                                </Button>
                                {previous && (
                                    <Button variant="secondary" size="sm" onClick={() => void player.sequence([builderMidi(root, previous, TOWER_OCTAVE), tower])}>
                                        <GitCompareArrows/> {t("builder.compare")}
                                    </Button>
                                )}
                            </div>
                        </div>
                        <ToneTable notes={chord.notes} degrees={chord.degrees}/>
                        <div className="space-y-2">
                            <p className="text-xs font-semibold tracking-wide text-base-500 uppercase">{tPiano("builder.onKeys")}</p>
                            <PianoKeyboard
                                from={towerRange.from}
                                to={towerRange.to}
                                markers={towerMarkers}
                                onKeyClick={midi => void player.note(midi)}
                                ariaLabel={`${title} — ${tPiano("builder.onKeys")}`}
                            />
                            <p className="text-xs text-base-500">{towerFingers.size > 0 ? tPiano("fingers.legend") : tPiano("fingers.towerTooWide")}</p>
                        </div>
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
                        hintText={item => builderText(`hints.${item.slot}.${item.value}`)}
                    />

                    <Card className="flex min-w-0 flex-col gap-3">
                        <CardTitle>{tPiano("builder.howToPlay")}</CardTitle>
                        {info && playable && chord.type
                            ? (
                                <>
                                    <p className="text-sm text-base-600 dark:text-base-400">{tPiano("builder.howToPlayHint")}</p>
                                    <PianoChordKeys chord={info} voicing={playable} title={title}/>
                                    <p className="text-xs text-base-500">{tPiano("fingers.legend")}</p>
                                    {chord.impliedFifth && <p className="text-xs text-base-500">{tPiano("builder.withFifth")}</p>}
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <PlayButton instrument="piano" midi={voicingNotes(playable)}/>
                                        <Link to={PIANO_PATHS.chord(root, chord.type.symbol)} className="inline-flex min-h-6 items-center pointer-coarse:min-h-10 gap-1 text-sm font-medium text-brand-700 hover:underline dark:text-brand-400">
                                            {tPiano("builder.openChord")} <ArrowRight className="size-4"/>
                                        </Link>
                                    </div>
                                </>
                            )
                            : <p className="text-sm text-base-500">{tPiano("builder.noCatalog")}</p>}
                    </Card>
                </aside>
            </div>

            {/* Small screens: the result card scrolls away above the controls, so keep the chord in view. */}
            <div
                aria-live="polite"
                className="fixed inset-x-0 bottom-0 z-20 border-t border-base-200 bg-base-50/95 px-4 py-2 backdrop-blur lg:hidden dark:border-base-800 dark:bg-base-950/95"
            >
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
                    <div className="min-w-0">
                        <p className="truncate text-xl font-bold tracking-tight">{title}</p>
                        <p className="truncate text-xs text-base-500">{chord.degrees.join(" – ")}</p>
                    </div>
                    <Button size="sm" onClick={playTower} aria-label={t("builder.playChord")}>
                        {player.isLoading ? <Loader2 className="animate-spin"/> : <Volume2/>}
                    </Button>
                </div>
            </div>
        </div>
    )
}
