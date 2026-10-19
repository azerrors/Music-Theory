import {useTranslation} from "react-i18next"
import {Segmented} from "@/components/ui/segmented"
import {ROOT_NOTES} from "@/constants/notes"
import {useSettings} from "@/hooks/useSettings"
import {chroma, formatNote, rootToSlug, slugToRoot} from "@/lib/theory/notes"
import type {NoteName} from "@/types/music"
import {Term} from "@/widgets/Term"

export type NoteFilterValue = NoteName | "all"

/** Reads the `note` search param: a root, or "all" when missing. */
export function parseNoteFilter(slug: string | null): NoteFilterValue {
    return (slug && slugToRoot(slug)) || "all"
}

export function noteFilterParam(value: NoteFilterValue): string | null {
    return value === "all" ? null : rootToSlug(value)
}

/** Enharmonic match, so the A♭ button also finds G♯m. */
export function matchesNote(root: NoteName, value: NoteFilterValue): boolean {
    return value === "all" || chroma(root) === chroma(value)
}

/** "All" plus the twelve notes: narrows a chord list down to the chords on one root. */
export function NoteFilter({value, onChange}: {value: NoteFilterValue; onChange: (value: NoteFilterValue) => void}) {
    const {t} = useTranslation("theory")
    const {notation} = useSettings()
    const heading = t("root")

    return (
        <div className="space-y-2">
            <p className="text-xs font-semibold tracking-wide text-base-500 uppercase"><Term id="root">{heading}</Term></p>
            <Segmented
                label={heading}
                value={value}
                onChange={onChange}
                options={[
                    {value: "all" as NoteFilterValue, label: t("mobility.filters.all")},
                    ...ROOT_NOTES.map(note => ({value: note as NoteFilterValue, label: formatNote(note, notation)})),
                ]}
            />
        </div>
    )
}
