import type {ReactNode} from "react"
import {useTranslation} from "react-i18next"
import {MoveVertical, Pin} from "lucide-react"
import {Card, CardTitle} from "@/components/ui/card"
import {Segmented} from "@/components/ui/segmented"
import {Term, TermText} from "@/widgets/Term"

export type MobilityFilter = "all" | "movable" | "fixed"

export const MOBILITY_FILTERS: MobilityFilter[] = ["all", "movable", "fixed"]

interface MobilityPanelProps {
    movableCount: number
    fixedCount: number
    /** Omit to show the explanation without a filter. */
    filter?: MobilityFilter
    onFilterChange?: (filter: MobilityFilter) => void
    children?: ReactNode
}

/** Side note explaining movable vs. fixed shapes, with counts and an optional filter. */
export function MobilityPanel({movableCount, fixedCount, filter, onFilterChange, children}: MobilityPanelProps) {
    const {t} = useTranslation("theory")

    return (
        <Card className="space-y-4 lg:sticky lg:top-24">
            <CardTitle>{t("mobility.title")}</CardTitle>

            <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                    <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        <MoveVertical className="size-4" aria-hidden/>
                    </span>
                    <p className="text-stone-600 dark:text-stone-400">
                        <strong className="font-semibold text-stone-900 dark:text-stone-100"><Term id="movableShape">{t("mobility.movable")}</Term> · {movableCount}</strong>
                        <br/>
                        <TermText text={t("mobility.movableHint")}/>
                    </p>
                </div>
                <div className="flex gap-3">
                    <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                        <Pin className="size-4" aria-hidden/>
                    </span>
                    <p className="text-stone-600 dark:text-stone-400">
                        <strong className="font-semibold text-stone-900 dark:text-stone-100"><Term id="openChord">{t("mobility.fixed")}</Term> · {fixedCount}</strong>
                        <br/>
                        <TermText text={t("mobility.fixedHint")}/>
                    </p>
                </div>
            </div>

            {filter && onFilterChange && (
                <div className="space-y-2">
                    <p className="text-xs font-semibold tracking-wide text-stone-500 uppercase">{t("mobility.show")}</p>
                    <Segmented
                        label={t("mobility.show")}
                        value={filter}
                        onChange={onFilterChange}
                        options={MOBILITY_FILTERS.map(value => ({value, label: t(`mobility.filters.${value}`)}))}
                    />
                </div>
            )}

            {children}
        </Card>
    )
}
