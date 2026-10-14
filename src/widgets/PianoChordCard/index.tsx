import {Link} from "react-router"
import {useTranslation} from "react-i18next"
import {Card} from "@/components/ui/card"
import {useSettings} from "@/hooks/useSettings"
import {closeVoicing, slashVoicing} from "@/lib/piano/voicings"
import {formatChordName, type ChordInfo} from "@/lib/theory/chords"
import {formatNote} from "@/lib/theory/notes"
import {PIANO_PATHS} from "@/router/paths"
import {PianoChordKeys} from "@/widgets/PianoChordKeys"

interface PianoChordCardProps {
    chord: ChordInfo
    /** Popularity rank, shown on the "most used chords" tab. */
    rank?: number
}

/** Chord in root position (slash chords: bass in the left hand), linking to its page. */
export function PianoChordCard({chord, rank}: PianoChordCardProps) {
    const {t} = useTranslation("theory")
    const {notation} = useSettings()
    const displayName = formatChordName(chord, notation)
    const voicing = chord.bass ? slashVoicing(chord) : {left: [], right: closeVoicing(chord)}

    return (
        <Link to={PIANO_PATHS.chord(chord.root, chord.type.symbol, chord.bass)} className="group block min-w-0 rounded-2xl">
            <Card className="relative flex h-full min-w-0 flex-col items-center gap-3 transition-colors group-hover:border-brand-400 group-focus-visible:border-brand-500 dark:group-hover:border-brand-700">
                {rank && <span className="absolute top-3 left-3 text-xs font-medium text-stone-400 tabular-nums">#{rank}</span>}
                <div className="text-center">
                    <p className="text-xl font-bold tracking-tight">{displayName}</p>
                    <p className="text-xs text-stone-500">
                        {chord.bass
                            ? t("slash.overBass", {chord: t(`chordTypes.${chord.type.symbol}`), bass: formatNote(chord.bass, notation)})
                            : t(`chordTypes.${chord.type.symbol}`)}
                    </p>
                </div>
                <PianoChordKeys chord={chord} voicing={voicing} title={displayName}/>
                <p className="mt-auto text-xs font-medium tracking-wide text-stone-500 tabular-nums">
                    {chord.degrees.join(" – ")}
                    {chord.bassDegree && <> · {t("slash.bass")} {chord.bassDegree}</>}
                </p>
            </Card>
        </Link>
    )
}
