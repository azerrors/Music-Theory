import {useTranslation} from "react-i18next"
import {MoveVertical, Pin} from "lucide-react"
import {isMovableVoicing} from "@/lib/theory/voicings"
import {cn} from "@/lib/utils"
import type {Voicing} from "@/types/music"
import {stripTerms} from "@/lib/terms"

interface MobilityBadgeProps {
    voicing: Voicing
    className?: string
}

/** Tells whether a shape can slide along the neck or is pinned by its open strings. */
export function MobilityBadge({voicing, className}: MobilityBadgeProps) {
    const {t} = useTranslation("theory")
    const movable = isMovableVoicing(voicing)
    const Icon = movable ? MoveVertical : Pin

    return (
        <span
            title={stripTerms(t(movable ? "mobility.movableHint" : "mobility.fixedHint"))}
            className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
                movable
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
                className,
            )}
        >
            <Icon className="size-3" aria-hidden/>
            {t(movable ? "mobility.movable" : "mobility.fixed")}
        </span>
    )
}
