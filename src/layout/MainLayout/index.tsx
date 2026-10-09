import {Suspense, useEffect, useRef, useState} from "react"
import {Link, NavLink, Outlet, useLocation} from "react-router"
import {useTranslation} from "react-i18next"
import {ChevronDown, Moon, Settings, Sun} from "lucide-react"
import {buttonVariants, Button} from "@/components/ui/button"
import {Select} from "@/components/ui/select"
import {useTheme} from "@/hooks/useTheme"
import {LANGUAGES} from "@/i18n"
import {cn} from "@/lib/utils"
import {PATHS} from "@/router/paths"
import {PageLoader} from "@/widgets/PageLoader"

/** Always visible on wide screens. */
const PRIMARY_NAV = [
    {to: PATHS.chords, key: "nav.chords"},
    {to: PATHS.builder, key: "nav.builder"},
    {to: PATHS.scales, key: "nav.scales"},
    {to: PATHS.progressions, key: "nav.progressions"},
    {to: PATHS.song, key: "nav.song"},
] as const

/** Under "More" on wide screens; small screens list everything in one scrollable row. */
const MORE_NAV = [
    {to: PATHS.intervals, key: "nav.intervals"},
    {to: PATHS.circle, key: "nav.circle"},
    {to: PATHS.fretboard, key: "nav.fretboard"},
    {to: PATHS.glossary, key: "nav.glossary"},
] as const

const NAV_ITEMS = [...PRIMARY_NAV, ...MORE_NAV]

function MoreMenu({linkClass}: {linkClass: (state: {isActive: boolean}) => string}) {
    const {t} = useTranslation()
    const {pathname} = useLocation()
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    const isActive = MORE_NAV.some(item => pathname.startsWith(item.to))

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
                    {MORE_NAV.map(item => (
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

    const navLinkClass = ({isActive}: {isActive: boolean}) => cn(
        "rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
        isActive
            ? "bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-200"
            : "text-stone-600 hover:bg-stone-200/60 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100",
    )

    return (
        <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-20 border-b border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-950">
                <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
                    <Link to={PATHS.home} className="flex items-center gap-2.5 rounded-lg">
                        <Logo/>
                        <span className="leading-tight">
                            <span className="block font-bold tracking-tight">{t("appName")}</span>
                            <span className="block text-xs text-stone-500">{t("tagline")}</span>
                        </span>
                    </Link>

                    <nav className="ml-4 hidden items-center gap-1 lg:flex">
                        {PRIMARY_NAV.map(item => (
                            <NavLink key={item.to} to={item.to} className={navLinkClass}>{t(item.key)}</NavLink>
                        ))}
                        <MoreMenu linkClass={navLinkClass}/>
                    </nav>

                    <div className="ml-auto flex items-center gap-1.5">
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

                {/* Small screens: the nav moves to a scrollable row under the header. */}
                <nav className="flex gap-1 overflow-x-auto px-4 pb-3 lg:hidden">
                    {NAV_ITEMS.map(item => (
                        <NavLink key={item.to} to={item.to} className={navLinkClass}>{t(item.key)}</NavLink>
                    ))}
                </nav>
            </header>

            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
                <Suspense fallback={<PageLoader/>}>
                    <Outlet/>
                </Suspense>
            </main>

            <footer className="border-t border-stone-200 py-6 text-center text-xs text-stone-500 dark:border-stone-800">
                {t("appName")} · {t("tagline")}
            </footer>
        </div>
    )
}
