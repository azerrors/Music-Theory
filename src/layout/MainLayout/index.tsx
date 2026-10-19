import {Suspense, useCallback, useState} from "react"
import {Link, Outlet, useLocation} from "react-router"
import {useTranslation} from "react-i18next"
import {Menu} from "lucide-react"
import {AudioLinesIcon} from "@/components/icons/audio-lines"
import {BlocksIcon} from "@/components/icons/blocks"
import {BrainIcon} from "@/components/icons/brain"
import {BookTextIcon} from "@/components/icons/book-text"
import {ChartNoAxesColumnIncreasingIcon} from "@/components/icons/chart-no-axes-column-increasing"
import {CompassIcon} from "@/components/icons/compass"
import {FileChartLineIcon} from "@/components/icons/file-chart-line"
import {GitCommitHorizontalIcon} from "@/components/icons/git-commit-horizontal"
import {LayoutGridIcon} from "@/components/icons/layout-grid"
import {SearchIcon} from "@/components/icons/search"
import {Drawer} from "@/components/ui/drawer"
import {useInstrument, type Instrument} from "@/hooks/useInstrument"
import {cn} from "@/lib/utils"
import {INSTRUMENT_PICKER_PATH, PATHS, PIANO_PATHS} from "@/router/paths"
import {PageLoader} from "@/widgets/PageLoader"
import {SettingsPanel} from "@/widgets/SettingsPanel"
import {Breadcrumb, headerButton, InstrumentToggle, LanguageSelect, SettingsButton} from "./HeaderBar"
import {Logo} from "./Logo"
import {Sidebar, type NavGroup} from "./Sidebar"

/** Wide screens show these as sidebar groups; small screens list every item in one scrollable row. */
const NAV: Record<Instrument, NavGroup[]> = {
    guitar: [
        {
            items: [
                {to: PATHS.chords, key: "nav.chords", icon: LayoutGridIcon},
                {to: PATHS.builder, key: "nav.builder", icon: BlocksIcon},
                {to: PATHS.scales, key: "nav.scales", icon: AudioLinesIcon},
                {to: PATHS.progressions, key: "nav.progressions", icon: GitCommitHorizontalIcon},
                {to: PATHS.song, key: "nav.song", icon: FileChartLineIcon},
            ],
        },
        {
            items: [
                {
                    to: "/guitar/practice",
                    key: "nav.practice",
                    icon: BrainIcon,
                    children: [
                        {to: PATHS.practiceEar, key: "nav.practiceEar"},
                        {to: PATHS.practiceFind, key: "nav.practiceFind"},
                        {to: PATHS.practiceCircle, key: "nav.practiceCircle"},
                    ],
                },
            ],
        },
        {
            labelKey: "nav.more",
            items: [
                {to: PATHS.intervals, key: "nav.intervals", icon: ChartNoAxesColumnIncreasingIcon},
                {to: PATHS.circle, key: "nav.circle", icon: CompassIcon},
                {to: PATHS.fretboard, key: "nav.fretboard", icon: SearchIcon},
                {to: PATHS.glossary, key: "nav.glossary", icon: BookTextIcon},
            ],
        },
    ],
    // The piano section grows tab by tab; chords come first.
    piano: [
        {
            items: [
                {to: PIANO_PATHS.chords, key: "nav.chords", icon: LayoutGridIcon},
                {to: PIANO_PATHS.builder, key: "nav.builder", icon: BlocksIcon},
                {to: PIANO_PATHS.scales, key: "nav.scales", icon: AudioLinesIcon},
                {to: PIANO_PATHS.progressions, key: "nav.progressions", icon: GitCommitHorizontalIcon},
                {to: PIANO_PATHS.intervals, key: "nav.intervals", icon: ChartNoAxesColumnIncreasingIcon},
            ],
        },
        {
            items: [
                {
                    to: "/piano/practice",
                    key: "nav.practice",
                    icon: BrainIcon,
                    children: [
                        {to: PIANO_PATHS.practiceEar, key: "nav.practiceEar"},
                        {to: PIANO_PATHS.practiceFind, key: "nav.practiceFind"},
                        {to: PIANO_PATHS.practiceCircle, key: "nav.practiceCircle"},
                    ],
                },
            ],
        },
    ],
}

const INSTRUMENT_HOME: Record<Instrument, string> = {
    guitar: PATHS.home,
    piano: PIANO_PATHS.home,
}

const COLLAPSED_KEY = "sidebar-collapsed"

function readCollapsed(): boolean {
    try {
        return localStorage.getItem(COLLAPSED_KEY) === "1"
    } catch {
        return false
    }
}

export function MainLayout() {
    const {t} = useTranslation()
    const {pathname} = useLocation()
    const instrument = useInstrument()
    // The picker is the one page that belongs to neither instrument, so it has no section nav.
    const isPicker = pathname === INSTRUMENT_PICKER_PATH
    const nav = NAV[instrument]
    const tagline = isPicker ? t("taglines.shared") : t(`taglines.${instrument}`)

    // Wide screens: the sidebar folds down to its icons, remembered on this device.
    const [collapsed, setCollapsed] = useState(readCollapsed)
    const toggleSidebar = () => setCollapsed(current => {
        try {
            localStorage.setItem(COLLAPSED_KEY, current ? "0" : "1")
        } catch {
            // Private mode: the choice just isn't remembered.
        }
        return !current
    })
    const [settingsOpen, setSettingsOpen] = useState(false)
    const closeSettings = useCallback(() => setSettingsOpen(false), [])

    // Small screens: the sidebar opens as a drawer from the left, and closes once a page is picked.
    const [navOpen, setNavOpen] = useState(false)
    const closeNav = useCallback(() => setNavOpen(false), [])
    const [navPath, setNavPath] = useState(pathname)
    if (pathname !== navPath) {
        setNavPath(pathname)
        setNavOpen(false)
    }

    const brand = (
        <Link to={INSTRUMENT_PICKER_PATH} className="flex items-center gap-2.5 rounded-lg">
            <Logo/>
            <span className="leading-tight">
                <span className="block font-bold tracking-tight">{t("appName")}</span>
                <span className="hidden text-xs text-base-500 sm:block">{tagline}</span>
            </span>
        </Link>
    )

    // Right of the header: switch instrument, language, settings.
    const controls = (
        <div className="ml-auto flex shrink-0 items-center gap-1">
            {!isPicker && <InstrumentToggle current={instrument}/>}
            <LanguageSelect/>
            <SettingsButton onClick={() => setSettingsOpen(true)}/>
        </div>
    )

    const settingsDrawer = (
        <Drawer open={settingsOpen} onClose={closeSettings} title={t("settings.title")} closeLabel={t("actions.close")}>
            <SettingsPanel/>
        </Drawer>
    )

    const page = (
        <Suspense fallback={<PageLoader/>}>
            {/* Keyed by path, so each new page plays the entrance. */}
            <div key={pathname} className="pg-enter">
                <Outlet/>
            </div>
        </Suspense>
    )

    if (isPicker) {
        // A full-bleed stage under a plain header, with no section nav.
        return (
            <div className="flex min-h-screen flex-col">
                <header className="sticky top-0 z-20 border-b border-base-200 bg-base-50 dark:border-base-800 dark:bg-base-950">
                    <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
                        {brand}
                        {controls}
                    </div>
                </header>
                <main className="flex flex-1 flex-col">
                    <Suspense fallback={<PageLoader/>}>
                        <Outlet/>
                    </Suspense>
                </main>
                {settingsDrawer}
            </div>
        )
    }

    // Instrument pages: a floating sidebar beside a floating header, both inset from the window's edges.
    return (
        <div className="flex min-h-svh gap-3 p-2 sm:p-3">
            <Sidebar
                instrument={instrument}
                groups={nav}
                home={INSTRUMENT_HOME[instrument]}
                tagline={tagline}
                collapsed={collapsed}
                onToggle={toggleSidebar}
                className="sticky top-3 z-30 hidden h-[calc(100svh-1.5rem)] shrink-0 lg:block"
            />

            <div className="flex min-w-0 flex-1 flex-col gap-3">
                {/* The page colour runs up behind the floating header, so content scrolling under it never shows in the gap above. */}
                <div className="sticky top-0 z-20 -mt-2 bg-base-50 pt-2 sm:-mt-3 sm:pt-3 dark:bg-base-950">
                    <header className="rounded-[18px] border border-base-200 bg-white dark:border-base-800 dark:bg-base-900">
                        <div className="flex h-[4.5rem] items-center gap-3 px-3 sm:gap-4 sm:px-5">
                            <button
                                type="button"
                                onClick={() => setNavOpen(true)}
                                aria-label={t("actions.openMenu")}
                                aria-haspopup="dialog"
                                aria-expanded={navOpen}
                                className={cn(headerButton, "-ml-1 shrink-0 lg:hidden")}
                            >
                                <Menu className="size-5" strokeWidth={1.5}/>
                            </button>
                            <div className="shrink-0 lg:hidden">{brand}</div>
                            <div className="hidden min-w-0 sm:block">
                                <Breadcrumb instrument={instrument} groups={nav}/>
                            </div>
                            {controls}
                        </div>
                    </header>
                </div>

                <main className="mx-auto w-full max-w-6xl flex-1 px-2 py-4 sm:px-4 lg:px-6">
                    {page}
                </main>

                <footer className="space-y-1 border-t border-base-200 py-6 text-center text-xs text-base-500 dark:border-base-800">
                    <p>{t("appName")} · {tagline}</p>
                    {/* The samples are CC BY 3.0, which asks for this credit wherever they are used. */}
                    <p>
                        {t("credits.prefix")}{" "}
                        <a href="https://github.com/nbrosowsky/tonejs-instruments" target="_blank" rel="noreferrer" className="underline hover:text-base-700 dark:hover:text-base-300">tonejs-instruments</a>
                        {" ("}
                        <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer" className="underline hover:text-base-700 dark:hover:text-base-300">{t("credits.license")}</a>
                        {"): "}{t("credits.details")}
                    </p>
                </footer>
            </div>
            {settingsDrawer}
            <Drawer open={navOpen} onClose={closeNav} side="left" bare title={t("instrument." + instrument)} closeLabel={t("actions.close")}>
                <Sidebar instrument={instrument} groups={nav} home={INSTRUMENT_HOME[instrument]} tagline={tagline} collapsed={false} className="h-full"/>
            </Drawer>
        </div>
    )
}
