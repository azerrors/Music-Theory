import {Link} from "react-router"
import {useTranslation} from "react-i18next"
import {Card} from "@/components/ui/card"
import {useSettings} from "@/hooks/useSettings"
import {formatChordName, type ChordInfo} from "@/lib/theory/chords"
import {formatNote} from "@/lib/theory/notes"
import {PATHS} from "@/router/paths"
import type {Voicing} from "@/types/music"
import {ChordDiagram} from "@/widgets/ChordDiagram"
import {MobilityBadge} from "@/widgets/MobilityBadge"

interface ChordCardProps {
    chord: ChordInfo
    voicing?: Voicing
    /** Popularity rank, shown on the "most used chords" tab. */
    rank?: number
    /** How many shapes the chord has on the neck. */
    shapeCount?: number
}

export function ChordCard({chord, voicing, rank, shapeCount}: ChordCardProps) {
    const {t} = useTranslation("theory")
    const {notation} = useSettings()
    const displayName = formatChordName(chord, notation)

    return (
        <Link to={PATHS.chord(chord.root, chord.type.symbol, chord.bass)} className="group block rounded-2xl">
            <Card className="relative flex h-full flex-col items-center gap-3 transition-colors group-hover:border-brand-400 group-focus-visible:border-brand-500 dark:group-hover:border-brand-700">
                {rank && <span className="absolute top-3 left-3 text-xs font-medium text-base-400 tabular-nums">#{rank}</span>}
                <div className="text-center">
                    <p className="text-xl font-bold tracking-tight">{displayName}</p>
                    <p className="text-xs text-base-500">
                        {chord.bass
                            ? t("slash.overBass", {chord: t(`chordTypes.${chord.type.symbol}`), bass: formatNote(chord.bass, notation)})
                            : t(`chordTypes.${chord.type.symbol}`)}
                    </p>
                </div>
                {voicing
                    ? <ChordDiagram voicing={voicing} root={chord.root} chordNotes={chord.bass ? [...chord.notes, chord.bass] : chord.notes} title={displayName}/>
                    : <p className="py-8 text-center text-xs text-base-500">{t("noVoicings")}</p>}
                <div className="mt-auto flex flex-col items-center gap-2">
                    {voicing && <MobilityBadge voicing={voicing}/>}
                    {shapeCount !== undefined && <p className="text-xs text-base-500">{t("popular.shapes", {count: shapeCount})}</p>}
                    <p className="text-xs font-medium tracking-wide text-base-500 tabular-nums">
                        {chord.degrees.join(" – ")}
                        {chord.bassDegree && <> · {t("slash.bass")} {chord.bassDegree}</>}
                    </p>
                </div>
            </Card>
        </Link>
    )
}
