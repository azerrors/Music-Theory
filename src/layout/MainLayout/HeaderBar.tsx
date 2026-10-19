import {useRef, useState} from "react"
import {Link, useLocation, useNavigate} from "react-router"
import {useTranslation} from "react-i18next"
import {ChevronRight, Guitar, Languages, Piano} from "lucide-react"
import {SettingsIcon} from "@/components/icons/settings"
import type {AnimatedIconHandle} from "@/components/icons/types"
import {Select} from "@/components/ui/select"
import {CHORD_TYPES} from "@/constants/chordTypes"
import type {Instrument} from "@/hooks/useInstrument"
import {useSettings} from "@/hooks/useSettings"
import {LANGUAGES} from "@/i18n"
import {formatNote, slugToRoot} from "@/lib/theory/notes"
import {cn} from "@/lib/utils"
import {INSTRUMENT_PICKER_PATH, PATHS, PIANO_PATHS} from "@/router/paths"
import {isUnder, type NavGroup} from "./Sidebar"

const INSTRUMENT_HOME: Record<Instrument, string> = {guitar: PATHS.home, piano: PIANO_PATHS.home}

/** The piano section's pages; a guitar page without a piano twin switches to the piano home. */
const PIANO_SECTIONS = new Set(["chords", "builder", "scales", "progressions", "intervals", "practice"])

/** The same page on the other instrument when it has one, else that instrument's home. */
function counterpart(pathname: string, search: string, from: Instrument): string {
    const to: Instrument = from === "guitar" ? "piano" : "guitar"
    const rest = pathname.replace(/^\/(guitar|piano)/, "")
    const section = rest.split("/")[1] ?? ""
    if (!rest || !section || (to === "piano" && !PIANO_SECTIONS.has(section))) return INSTRUMENT_HOME[to]
    return `/${to}${rest}${search}`
}

/** Shared look of the header's square buttons: a dashed outline on hover, like the sidebar's items. */
export const headerButton = cn(
    "group/hb relative grid size-9 place-items-center border border-transparent text-base-600 transition-colors duration-150",
    "hover:border-dashed hover:border-base-300 hover:text-base-900 dark:text-base-400 dark:hover:border-base-700 dark:hover:text-base-100",
    "pointer-coarse:size-11",
)

/** Where the page sits: app, instrument, section and, on a chord's page, the chord. */
export function Breadcrumb({instrument, groups}: {instrument: Instrument; groups: NavGroup[]}) {
    const {t} = useTranslation()
    const {pathname} = useLocation()
    const {notation} = useSettings()

    const crumbs: {label: string; to?: string}[] = [
        {label: t("appName"), to: INSTRUMENT_PICKER_PATH},
        {label: t(`instrument.${instrument}`), to: INSTRUMENT_HOME[instrument]},
    ]
    const item = groups.flatMap(group => group.items).find(entry => isUnder(pathname, entry.to))
    if (item?.children) {
        // A group (Practice): the group, then the page within it.
        crumbs.push({label: t(item.key), to: item.children[0]?.to})
        const child = item.children.find(entry => isUnder(pathname, entry.to))
        if (child) crumbs.push({label: t(child.key), to: child.to})
    } else if (item) crumbs.push({label: t(item.key), to: item.to})
    else if (pathname === PATHS.settings) crumbs.push({label: t("nav.settings")})

    // A chord's own page: /<instrument>/chords/<root>/<type>
    const chord = pathname.match(/^\/(?:guitar|piano)\/chords\/([^/]+)\/([^/]+)$/)
    if (chord) {
        const root = slugToRoot(chord[1]!)
        const type = CHORD_TYPES.find(entry => entry.symbol === decodeURIComponent(chord[2]!))
        if (root && type) crumbs.push({label: `${formatNote(root, notation)}${type.suffix}`})
    }

    return (
        <nav aria-label={t("breadcrumb.label")} className="min-w-0">
            <ol className="flex min-w-0 items-center gap-1 text-sm">
                {crumbs.map((crumb, index) => {
                    const isLast = index === crumbs.length - 1
                    return (
                        <li key={crumb.label} className={cn("flex min-w-0 items-center gap-1", index < crumbs.length - 2 && "max-sm:hidden")}>
                            {index > 0 && <ChevronRight aria-hidden="true" className="size-3.5 shrink-0 text-base-300 dark:text-base-700" strokeWidth={1.5}/>}
                            {isLast ? (
                                <span aria-current="page" className="flex min-w-0 items-center gap-2 px-1.5 font-medium text-base-900 dark:text-base-50">
                                    <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-brand-600"/>
                                    <span className="truncate">{crumb.label}</span>
                                </span>
                            ) : (
                                <Link
                                    to={crumb.to!}
                                    className="truncate border border-transparent px-1.5 py-0.5 text-base-500 transition-colors hover:border-dashed hover:border-base-300 hover:text-base-900 dark:hover:border-base-700 dark:hover:text-base-100"
                                >
                                    {crumb.label}
                                </Link>
                            )}
                        </li>
                    )
                })}
            </ol>
        </nav>
    )
}

/**
 * One button that shows the current instrument and swaps to the other on click, keeping the same
 * page where the other instrument has it. On a switch the two trade places: the corner icon rises
 * and knocks into the big one, which drops back down into the corner.
 */
export function InstrumentToggle({current}: {current: Instrument}) {
    const {t} = useTranslation()
    const navigate = useNavigate()
    const {pathname, search} = useLocation()
    // Only a click plays the swap, not the first render of the page.
    const [swapped, setSwapped] = useState(false)
    const other: Instrument = current === "guitar" ? "piano" : "guitar"
    const Icon = current === "guitar" ? Guitar : Piano
    const OtherIcon = other === "guitar" ? Guitar : Piano
    const label = t("instrument.switchTo", {instrument: t(`instrument.${other}`)})

    const swap = () => {
        setSwapped(true)
        void navigate(counterpart(pathname, search, current))
    }

    return (
        <button type="button" onClick={swap} aria-label={label} title={label} className={headerButton}>
            <Icon key={`main-${current}`} className={cn("size-[1.125rem]", swapped && "inst-rise")} strokeWidth={1.5}/>
            {/* The other instrument peeks in the corner, so the swap is discoverable. */}
            <span
                key={`corner-${current}`}
                aria-hidden="true"
                className={cn(
                    "absolute -right-1 -bottom-1 grid size-4 place-items-center rounded-full border border-base-200 bg-white text-base-500 transition-colors group-hover/hb:border-brand-600 group-hover/hb:text-brand-600 dark:border-base-800 dark:bg-base-900",
                    swapped && "inst-drop",
                )}
            >
                <OtherIcon className="size-2.5" strokeWidth={2}/>
            </span>
        </button>
    )
}

const LANGUAGE_NAMES: Record<(typeof LANGUAGES)[number], string> = {az: "Azərbaycanca", en: "English", ru: "Русский"}

export function LanguageSelect() {
    const {t, i18n} = useTranslation()
    return (
        <Select
            label={t("actions.language")}
            value={i18n.resolvedLanguage ?? "az"}
            onChange={language => void i18n.changeLanguage(language)}
            options={LANGUAGES.map(language => ({value: language, label: LANGUAGE_NAMES[language]}))}
            align="end"
            renderValue={option => (
                <span className="flex items-center gap-1.5">
                    <Languages className="size-4 text-base-500" strokeWidth={1.5}/>
                    {option?.value.toUpperCase()}
                </span>
            )}
            buttonClassName="rounded-none border-transparent bg-transparent hover:border-dashed hover:border-base-300 dark:border-transparent dark:bg-transparent dark:hover:border-base-700"
        />
    )
}

/** Opens the settings drawer; the cog turns while hovered. */
export function SettingsButton({onClick}: {onClick: () => void}) {
    const {t} = useTranslation()
    const icon = useRef<AnimatedIconHandle>(null)
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={t("actions.openSettings")}
            title={t("actions.openSettings")}
            aria-haspopup="dialog"
            onMouseEnter={() => icon.current?.startAnimation()}
            onMouseLeave={() => icon.current?.stopAnimation()}
            className={headerButton}
        >
            <SettingsIcon ref={icon} size={18} aria-hidden="true" className="grid place-items-center"/>
        </button>
    )
}
