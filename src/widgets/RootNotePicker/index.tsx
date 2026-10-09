import {useTranslation} from "react-i18next"
import {Segmented} from "@/components/ui/segmented"
import {ROOT_NOTES} from "@/constants/notes"
import {useSettings} from "@/hooks/useSettings"
import {formatNote} from "@/lib/theory/notes"
import type {NoteName} from "@/types/music"
import {Term} from "@/widgets/Term"

interface RootNotePickerProps {
    value: NoteName
    onChange: (root: NoteName) => void
    /** Heading above the notes; defaults to "Root". */
    label?: string
    /** Glossary term the heading explains. */
    term?: string
}

export function RootNotePicker({value, onChange, label, term = "root"}: RootNotePickerProps) {
    const {t} = useTranslation("theory")
    const {notation} = useSettings()
    const heading = label ?? t("root")

    return (
        <div className="space-y-2">
            <p className="text-xs font-semibold tracking-wide text-stone-500 uppercase"><Term id={term}>{heading}</Term></p>
            <Segmented
                label={heading}
                value={value}
                onChange={onChange}
                options={ROOT_NOTES.map(note => ({value: note, label: formatNote(note, notation)}))}
            />
        </div>
    )
}
