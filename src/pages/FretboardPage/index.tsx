import {useMemo, useState} from "react"
import {Link} from "react-router"
import {useTranslation} from "react-i18next"
import {Eraser} from "lucide-react"
import {Badge} from "@/components/ui/badge"
import {Button} from "@/components/ui/button"
import {Card} from "@/components/ui/card"
import {useSettings} from "@/hooks/useSettings"
import {detectChords, parseChordSymbol} from "@/lib/theory/chords"
import type {FretMarker} from "@/lib/theory/fretboard"
import {formatNote, midiAt, pitchAt} from "@/lib/theory/notes"
import {PATHS} from "@/router/paths"
import {Fretboard} from "@/widgets/Fretboard"
import {PageHeader} from "@/widgets/PageHeader"
import {PlayButton} from "@/widgets/PlayButton"

/** Selected fret per string index; a string that is absent is not played. */
type Selection = Record<number, number>

function pitchClass(pitch: string): string {
    return pitch.replace(/-?\d+$/, "")
}

export default function FretboardPage() {
    const {t} = useTranslation("theory")
    const {t: tCommon} = useTranslation()
    const {tuning, notation} = useSettings()
    const [selection, setSelection] = useState<Selection>({})

    const toggle = (string: number, fret: number) => {
        setSelection(prev => {
            const next = {...prev}
            if (next[string] === fret) delete next[string]
            else next[string] = fret
            return next
        })
    }

    const played = useMemo(
        () => Object.entries(selection)
            .map(([string, fret]) => ({string: Number(string), fret}))
            .sort((a, b) => a.string - b.string)
            .map(({string, fret}) => {
                const openString = tuning.strings[string] ?? "E2"
                return {string, fret, pitch: pitchAt(openString, fret), midi: midiAt(openString, fret)}
            }),
        [selection, tuning],
    )

    // Bass note first — that is how tonal decides between e.g. C6 and Am7/C.
    const noteNames = [...new Set(played.map(position => pitchClass(position.pitch)))]
    const chords = detectChords(noteNames)
    const bass = played[0]

    const markers: FretMarker[] = played.map(position => ({
        string: position.string,
        fret: position.fret,
        note: pitchClass(position.pitch),
        isRoot: position === bass,
    }))

    return (
        <div className="space-y-8">
            <PageHeader
                title={t("detector.title")}
                description={t("detector.description")}
                actions={(
                    <>
                        <PlayButton midi={played.map(position => position.midi)}/>
                        <Button variant="outline" size="sm" onClick={() => setSelection({})} disabled={played.length === 0}>
                            <Eraser/> {tCommon("actions.clear")}
                        </Button>
                    </>
                )}
            />

            <Fretboard markers={markers} onPositionClick={toggle} fretCount={12} ariaLabel={t("detector.title")}/>

            <div className="grid gap-4 md:grid-cols-2">
                <Card className="space-y-3">
                    <p className="text-sm font-medium text-stone-500">{t("detector.selected")}</p>
                    <div className="flex min-h-8 flex-wrap gap-1.5">
                        {noteNames.map((note, index) => (
                            <Badge key={note} variant={index === 0 ? "root" : "default"}>{formatNote(note, notation)}</Badge>
                        ))}
                    </div>
                </Card>
                <Card className="space-y-3">
                    <p className="text-sm font-medium text-stone-500">{t("detector.result")}</p>
                    {noteNames.length < 2 && <p className="text-sm text-stone-500">{t("detector.empty")}</p>}
                    {noteNames.length >= 2 && chords.length === 0 && <p className="text-sm text-stone-500">{t("detector.unknown")}</p>}
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {chords.map((name, index) => {
                            const parsed = parseChordSymbol(name)
                            const className = index === 0 ? "text-2xl font-bold" : "text-lg font-medium text-stone-600 dark:text-stone-400"
                            return parsed && !name.includes("/")
                                ? <Link key={name} to={PATHS.chord(parsed.root, parsed.type.symbol)} className={`${className} hover:text-brand-700 hover:underline`}>{name}</Link>
                                : <span key={name} className={className}>{name}</span>
                        })}
                    </div>
                </Card>
            </div>
        </div>
    )
}
