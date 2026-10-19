import {useTranslation} from "react-i18next"
import {Badge} from "@/components/ui/badge"
import {useSettings} from "@/hooks/useSettings"
import {formatNote} from "@/lib/theory/notes"
import type {NoteName} from "@/types/music"
import {Term} from "@/widgets/Term"

interface ToneTableProps {
    notes: NoteName[]
    degrees: string[]
}

/** Formula row above the matching note row, so "♭3" sits right over "E♭". */
export function ToneTable({notes, degrees}: ToneTableProps) {
    const {t} = useTranslation("theory")
    const {notation} = useSettings()

    return (
        <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 text-sm">
            <dt className="font-medium text-base-500"><Term id="degree">{t("formula")}</Term></dt>
            <dd className="flex flex-wrap gap-1.5">
                {degrees.map((degree, index) => (
                    <Badge key={index} variant={index === 0 ? "root" : "outline"}>{degree}</Badge>
                ))}
            </dd>
            <dt className="font-medium text-base-500">{t("notes")}</dt>
            <dd className="flex flex-wrap gap-1.5">
                {notes.map((note, index) => (
                    <Badge key={index} variant={index === 0 ? "root" : "default"}>{formatNote(note, notation)}</Badge>
                ))}
            </dd>
        </dl>
    )
}
