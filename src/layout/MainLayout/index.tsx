import {Suspense, useEffect, useRef, useState} from "react"
import {Link, NavLink, Outlet, useLocation} from "react-router"
import {useTranslation} from "react-i18next"
import {ChevronDown, Moon, Settings, Sun} from "lucide-react"
import {buttonVariants, Button} from "@/components/ui/button"
import {Select} from "@/components/ui/select"
import {INSTRUMENTS, useInstrument, type Instrument} from "@/hooks/useInstrument"
import {useTheme} from "@/hooks/useTheme"
import {LANGUAGES} from "@/i18n"
import {cn} from "@/lib/utils"
import {INSTRUMENT_PICKER_PATH, PATHS, PIANO_PATHS} from "@/router/paths"
import {PageLoader} from "@/widgets/PageLoader"

interface NavItem {
    to: string
    key: string
}

/** Always visible on wide screens. */
const GUITAR_PRIMARY_NAV: NavItem[] = [
    {to: PATHS.chords, key: "nav.chords"},
    {to: PATHS.builder, key: "nav.builder"},
    {to: PATHS.scales, key: "nav.scales"},
    {to: PATHS.progressions, key: "nav.progressions"},
    {to: PATHS.song, key: "nav.song"},
]

/** Under "More" on wide screens; small screens list everything in one scrollable row. */
const GUITAR_MORE_NAV: NavItem[] = [
    {to: PATHS.intervals, key: "nav.intervals"},
    {to: PATHS.circle, key: "nav.circle"},
    {to: PATHS.fretboard, key: "nav.fretboard"},
    {to: PATHS.glossary, key: "nav.glossary"},
]

/** The piano section grows tab by tab; chords come first. */
const PIANO_PRIMARY_NAV: NavItem[] = [
    {to: PIANO_PATHS.chords, key: "nav.chords"},
    {to: PIANO_PATHS.builder, key: "nav.builder"},
    {to: PIANO_PATHS.scales, key: "nav.scales"},
    {to: PIANO_PATHS.progressions, key: "nav.progressions"},
    {to: PIANO_PATHS.intervals, key: "nav.intervals"},
]

const NAV: Record<Instrument, {primary: NavItem[]; more: NavItem[]}> = {
    guitar: {primary: GUITAR_PRIMARY_NAV, more: GUITAR_MORE_NAV},
    piano: {primary: PIANO_PRIMARY_NAV, more: []},
}

const INSTRUMENT_HOME: Record<Instrument, string> = {
    guitar: PATHS.home,
    piano: PIANO_PATHS.home,
}

function InstrumentSwitch({current, className}: {current: Instrument; className?: string}) {
    const {t} = useTranslation()

    return (
        <div role="group" aria-label={t("instrument.label")} className={cn("flex shrink-0 rounded-lg bg-stone-200/60 p-0.5 dark:bg-stone-800", className)}>
            {INSTRUMENTS.map(instrument => (
                <Link
                    key={instrument}
                    to={INSTRUMENT_HOME[instrument]}
                    aria-current={instrument === current ? "true" : undefined}
                    className={cn(
                        "rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors pointer-coarse:py-2",
                        instrument === current
                            ? "bg-white text-stone-900 shadow-sm dark:bg-stone-950 dark:text-stone-100"
                            : "text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100",
                    )}
                >
                    {t(`instrument.${instrument}`)}
                </Link>
            ))}
        </div>
    )
}

function MoreMenu({items, linkClass}: {items: NavItem[]; linkClass: (state: {isActive: boolean}) => string}) {
    const {t} = useTranslation()
    const {pathname} = useLocation()
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    const isActive = items.some(item => pathname.startsWith(item.to))

    // Close on outside clicks and Escape; picking a link closes it too.
    useEffect(() => {
        if (!open) return
        const onPointer = (event: PointerEvent) => {
            if (!ref.current?.contains(event.target as Node)) setOpen(false)
        }
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") setOpen(false)
        }
        window.addEventListener("pointerdown", onPointer)
        window.addEventListener("keydown", onKey)
        return () => {
            window.removeEventListener("pointerdown", onPointer)
            window.removeEventListener("keydown", onKey)
        }
    }, [open])

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                aria-expanded={open}
                aria-haspopup="true"
                onClick={() => setOpen(current => !current)}
                className={cn(linkClass({isActive}), "inline-flex items-center gap-1")}
            >
                {t("nav.more")} <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")}/>
            </button>
            {open && (
                <div className="absolute top-full left-0 z-30 mt-1 flex w-52 flex-col gap-0.5 rounded-xl border border-stone-200 bg-white p-1.5 shadow-lg dark:border-stone-800 dark:bg-stone-900">
                    {items.map(item => (
                        <NavLink key={item.to} to={item.to} className={linkClass} onClick={() => setOpen(false)}>{t(item.key)}</NavLink>
                    ))}
                </div>
            )}
        </div>
    )
}

function Logo() {
    return (
        <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden>
            <rect width="32" height="32" rx="8" className="fill-brand-700"/>
            <g className="stroke-brand-100" strokeWidth="1.6">
                <path d="M9 6v20M13 6v20M17 6v20M21 6v20"/>
                <path d="M7 11h16M7 16h16M7 21h16" strokeOpacity=".5"/>
            </g>
            <circle cx="17" cy="13.5" r="2.6" className="fill-brand-100"/>
        </svg>
    )
}

export function MainLayout() {
    const {t, i18n} = useTranslation()
    const {theme, toggleTheme} = useTheme()
    const {pathname} = useLocation()
    const instrument = useInstrument()
    // The picker is the one page that belongs to neither instrument, so it has no section nav.
    const isPicker = pathname === INSTRUMENT_PICKER_PATH
    const nav = NAV[instrument]
    const tagline = isPicker ? t("taglines.shared") : t(`taglines.${instrument}`)

    const navLinkClass = ({isActive}: {isActive: boolean}) => cn(
        "rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors pointer-coarse:py-2.5",
        isActive
            ? "bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-200"
            : "text-stone-600 hover:bg-stone-200/60 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100",
    )

    return (
        <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-20 border-b border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-950">
                <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
                    <Link to={INSTRUMENT_PICKER_PATH} className="flex items-center gap-2.5 rounded-lg">
                        <Logo/>
                        <span className="leading-tight">
                            <span className="block font-bold tracking-tight">{t("appName")}</span>
                            <span className="block text-xs text-stone-500">{tagline}</span>
                        </span>
                    </Link>

                    {!isPicker && (
                        <nav className="ml-4 hidden items-center gap-1 lg:flex">
                            {nav.primary.map(item => (
                                <NavLink key={item.to} to={item.to} className={navLinkClass}>{t(item.key)}</NavLink>
                            ))}
                            {nav.more.length > 0 && <MoreMenu items={nav.more} linkClass={navLinkClass}/>}
                        </nav>
                    )}

                    <div className="ml-auto flex items-center gap-1.5">
                        {!isPicker && <InstrumentSwitch current={instrument} className="hidden sm:flex"/>}
                        <Select
                            aria-label={t("actions.language")}
                            value={i18n.resolvedLanguage}
                            onChange={event => void i18n.changeLanguage(event.target.value)}
                            className="w-20"
                        >
                            {LANGUAGES.map(language => (
                                <option key={language} value={language}>{language.toUpperCase()}</option>
                            ))}
                        </Select>
                        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={t("actions.toggleTheme")}>
                            {theme === "dark" ? <Sun/> : <Moon/>}
                        </Button>
                        <NavLink
                            to={PATHS.settings}
                            aria-label={t("nav.settings")}
                            className={({isActive}) => cn(buttonVariants({variant: "ghost", size: "icon"}), isActive && "bg-stone-200/60 dark:bg-stone-800")}
                        >
                            <Settings/>
                        </NavLink>
                    </div>
                </div>

                {/* Small screens: the nav moves to a scrollable row under the header, led by the instrument switch on phones. */}
                {!isPicker && (
                    <nav className="flex items-center gap-1 overflow-x-auto px-4 pb-3 lg:hidden">
                        <InstrumentSwitch current={instrument} className="mr-2 sm:hidden"/>
                        {[...nav.primary, ...nav.more].map(item => (
                            <NavLink key={item.to} to={item.to} className={navLinkClass}>{t(item.key)}</NavLink>
                        ))}
                    </nav>
                )}
            </header>

            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
                <Suspense fallback={<PageLoader/>}>
                    <Outlet/>
                </Suspense>
            </main>

            <footer className="border-t border-stone-200 py-6 text-center text-xs text-stone-500 dark:border-stone-800">
                {t("appName")} · {tagline}
            </footer>
        </div>
    )
}
