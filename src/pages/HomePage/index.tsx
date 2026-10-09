import {Link} from "react-router"
import {useTranslation} from "react-i18next"
import {ArrowRight, BookOpen, CircleDot, Grid3x3, Guitar, Layers, ListMusic, Music, Repeat, Ruler} from "lucide-react"
import {buttonVariants} from "@/components/ui/button"
import {Card, CardDescription, CardTitle} from "@/components/ui/card"
import {getChordInfo} from "@/lib/theory/chords"
import {getVoicings, voicingMidi} from "@/lib/theory/voicings"
import {PATHS} from "@/router/paths"
import {ChordDiagram} from "@/widgets/ChordDiagram"
import {PlayButton} from "@/widgets/PlayButton"
import {ToneTable} from "@/widgets/ToneTable"
import {TermText} from "@/widgets/Term"

const SECTIONS = [
    {to: PATHS.chords, key: "chords", icon: Music},
    {to: PATHS.builder, key: "builder", icon: Layers},
    {to: PATHS.scales, key: "scales", icon: ListMusic},
    {to: PATHS.progressions, key: "progressions", icon: Repeat},
    {to: PATHS.song, key: "song", icon: Guitar},
    {to: PATHS.intervals, key: "intervals", icon: Ruler},
    {to: PATHS.circle, key: "circle", icon: CircleDot},
    {to: PATHS.fretboard, key: "fretboard", icon: Grid3x3},
    {to: PATHS.glossary, key: "glossary", icon: BookOpen},
] as const

// A worked example for the "how is a chord built" block.
const EXAMPLE_CHORD = getChordInfo("C", "maj7")!
const EXAMPLE_VOICING = getVoicings("C", "maj7")[0]!

export default function HomePage() {
    const {t} = useTranslation()

    return (
        <div className="space-y-14">
            <section className="max-w-3xl space-y-5 pt-4">
                <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">{t("home.title")}</h1>
                <p className="text-lg text-stone-600 text-pretty dark:text-stone-400">{t("home.subtitle")}</p>
                <Link to={PATHS.chords} className={buttonVariants({size: "md"})}>
                    {t("home.cta")} <ArrowRight/>
                </Link>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {SECTIONS.map(({to, key, icon: Icon}) => (
                    <Link key={key} to={to} className="group rounded-2xl">
                        <Card className="h-full space-y-2 transition-colors group-hover:border-brand-400 dark:group-hover:border-brand-700">
                            <Icon className="size-6 text-brand-600"/>
                            <CardTitle>{t(`home.cards.${key}.title`)}</CardTitle>
                            <CardDescription>{t(`home.cards.${key}.description`)}</CardDescription>
                        </Card>
                    </Link>
                ))}
            </section>

            <section>
                <Card className="grid items-center gap-8 p-6 sm:p-8 md:grid-cols-[1fr_auto]">
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold tracking-tight">{t("home.how.title")}</h2>
                        <p className="text-stone-600 text-pretty dark:text-stone-400"><TermText text={t("home.how.body")}/></p>
                        <ToneTable notes={EXAMPLE_CHORD.notes} degrees={EXAMPLE_CHORD.degrees}/>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                        <p className="text-2xl font-bold">{EXAMPLE_CHORD.name}</p>
                        <ChordDiagram
                            voicing={EXAMPLE_VOICING}
                            root={EXAMPLE_CHORD.root}
                            chordNotes={EXAMPLE_CHORD.notes}
                            title={EXAMPLE_CHORD.name}
                            className="w-40"
                        />
                        <PlayButton midi={voicingMidi(EXAMPLE_VOICING)}/>
                    </div>
                </Card>
            </section>
        </div>
    )
}
