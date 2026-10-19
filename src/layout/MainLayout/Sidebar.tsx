import {useEffect, useLayoutEffect, useRef, useState} from "react"
import {Link, NavLink, useLocation} from "react-router"
import {ChevronDown} from "lucide-react"
import {useTranslation} from "react-i18next"
import {useReducedMotion} from "motion/react"
import type {AnimatedIcon, AnimatedIconHandle} from "@/components/icons/types"
import {INSTRUMENT_ART} from "@/constants/instrumentArt"
import type {Instrument} from "@/hooks/useInstrument"
import {cn} from "@/lib/utils"
import {INSTRUMENT_PICKER_PATH} from "@/router/paths"
import {Logo} from "./Logo"

export interface NavLeaf {
    to: string
    key: string
}

export interface NavItem extends NavLeaf {
    icon: AnimatedIcon
    /** Sub-pages, shown as an accordion; `to` is then their common path prefix, not a page. */
    children?: NavLeaf[]
}

/** Whether `pathname` is `to` or a page under it. */
export const isUnder = (pathname: string, to: string) => pathname === to || pathname.startsWith(`${to}/`)

export interface NavGroup {
    /** Translation key of the group heading; the first group has none. */
    labelKey?: string
    items: NavItem[]
}

const EASE = "ease-[cubic-bezier(0.23,1,0.32,1)]"

/**
 * The active page's frame, like a part marked on a technical drawing: a square hairline that
 * traces itself round from the top-left corner, then registration marks that land on each corner
 * one after another. It mounts with the active item, so it plays each time a page becomes active.
 * The hairline is a path built from the measured size (rects lack `pathLength` in some browsers).
 */
function SquareFrame() {
    const ref = useRef<SVGSVGElement>(null)
    const [size, setSize] = useState({w: 0, h: 0})

    useLayoutEffect(() => {
        const element = ref.current
        if (!element) return
        const measure = () => setSize({w: element.clientWidth, h: element.clientHeight})
        measure()
        const observer = new ResizeObserver(measure)
        observer.observe(element)
        return () => observer.disconnect()
    }, [])

    const {w, h} = size
    const corner = "nv-corner absolute size-2 border-brand-600"

    return (
        <span aria-hidden="true" className="pointer-events-none absolute inset-0">
            <span className="nv-fill absolute inset-0 bg-brand-600/[0.06]"/>
            <svg ref={ref} fill="none" className="absolute inset-0 size-full overflow-visible stroke-brand-600/45">
                {w > 0 && <path d={`M0.5,0.5 H${w - 0.5} V${h - 0.5} H0.5 Z`} pathLength={1} strokeWidth="1" className="nv-draw"/>}
            </svg>
            <span className={cn(corner, "-top-px -left-px origin-top-left border-t border-l [animation-delay:380ms]")}/>
            <span className={cn(corner, "-top-px -right-px origin-top-right border-t border-r [animation-delay:440ms]")}/>
            <span className={cn(corner, "-right-px -bottom-px origin-bottom-right border-r border-b [animation-delay:500ms]")}/>
            <span className={cn(corner, "-bottom-px -left-px origin-bottom-left border-b border-l [animation-delay:560ms]")}/>
        </span>
    )
}

/** How long the icon plays when its page becomes active; while hovered it keeps playing. */
const ACTIVE_ANIMATION_MS = 1400

/** Plays an item's icon while hovered, and once when its page becomes active. */
function useIconAnimation(isActive: boolean, isHovered: boolean) {
    const icon = useRef<AnimatedIconHandle>(null)
    const reduceMotion = useReducedMotion()

    useEffect(() => {
        if (reduceMotion) return
        if (isHovered) {
            icon.current?.startAnimation()
            return
        }
        icon.current?.stopAnimation()
        if (!isActive) return
        icon.current?.startAnimation()
        const timer = window.setTimeout(() => icon.current?.stopAnimation(), ACTIVE_ANIMATION_MS)
        return () => window.clearTimeout(timer)
    }, [isHovered, isActive, reduceMotion])

    return icon
}

/** One page: its node on the string, and a label whose icon animates on hover and on becoming active. */
function SidebarItem({item, collapsed}: {item: NavItem; collapsed: boolean}) {
    const {t} = useTranslation()
    const {pathname} = useLocation()
    const isActive = isUnder(pathname, item.to)
    const [isHovered, setIsHovered] = useState(false)
    const icon = useIconAnimation(isActive, isHovered)
    const {icon: Icon} = item

    return (
        <NavLink
            to={item.to}
            aria-label={collapsed ? t(item.key) : undefined}
            title={collapsed ? t(item.key) : undefined}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onFocus={() => setIsHovered(true)}
            onBlur={() => setIsHovered(false)}
            className="group/item flex items-center gap-1.5 text-[0.9375rem] whitespace-nowrap"
        >
            {!collapsed && (
                <span aria-hidden="true" className="relative z-10 grid size-8 shrink-0 place-items-center">
                    <span
                        className={cn(
                            "size-2.5 rounded-full border transition-colors duration-300",
                            isActive
                                ? "nv-node border-brand-600 bg-brand-600"
                                : "border-base-300 bg-white group-hover/item:border-base-500 dark:border-base-700 dark:bg-base-900 dark:group-hover/item:border-base-500",
                        )}
                    />
                </span>
            )}
            <span
                className={cn(
                    "relative flex h-11 items-center gap-3 border border-transparent px-2.5 transition-colors duration-150",
                    EASE,
                    // Collapsed, the box hugs the icon so its frame fits inside the narrow panel.
                    collapsed ? "w-full justify-center px-0" : "flex-1",
                    isActive
                        ? "text-base-900 dark:text-base-50"
                        : "text-base-600 group-hover/item:border-dashed group-hover/item:border-base-300 group-hover/item:text-base-900 dark:text-base-400 dark:group-hover/item:border-base-700 dark:group-hover/item:text-base-100",
                )}
            >
                {isActive && <SquareFrame key={String(collapsed)}/>}
                <Icon
                    ref={icon}
                    size={18}
                    aria-hidden="true"
                    className={cn(
                        "relative flex size-7 shrink-0 items-center justify-center transition-colors duration-150",
                        isActive ? "text-brand-600" : "text-base-400 group-hover/item:text-base-600 dark:text-base-500 dark:group-hover/item:text-base-300",
                    )}
                />
                <span className={cn("relative", collapsed && "sr-only")}>{t(item.key)}</span>
            </span>
        </NavLink>
    )
}

/**
 * A group of sub-pages that opens like an accordion. Its sub-pages hang off a short branch of the
 * string; it opens by itself when one of them becomes the current page. Collapsed, the sidebar
 * shows only its icon, which goes to the first sub-page.
 */
function SidebarAccordion({item, collapsed}: {item: NavItem; collapsed: boolean}) {
    const {t} = useTranslation()
    const {pathname} = useLocation()
    const isActive = isUnder(pathname, item.to)
    const [open, setOpen] = useState(isActive)
    const [isHovered, setIsHovered] = useState(false)
    const icon = useIconAnimation(isActive, isHovered)
    const children = item.children ?? []
    const {icon: Icon} = item
    const id = `nav-${item.key.replaceAll(".", "-")}`

    // Reaching one of its pages from elsewhere (a link, the breadcrumb) opens the group too.
    const [wasActive, setWasActive] = useState(isActive)
    if (isActive !== wasActive) {
        setWasActive(isActive)
        if (isActive) setOpen(true)
    }

    const iconClass = (hoverClass: string) => cn(
        "relative flex size-7 shrink-0 items-center justify-center transition-colors",
        isActive ? "text-brand-600" : cn("text-base-400 dark:text-base-500", hoverClass),
    )

    if (collapsed) {
        return (
            <NavLink
                to={children[0]?.to ?? item.to}
                aria-label={t(item.key)}
                title={t(item.key)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="group/item flex"
            >
                <span
                    className={cn(
                        "relative flex h-11 w-full items-center justify-center border border-transparent transition-colors duration-150",
                        !isActive && "group-hover/item:border-dashed group-hover/item:border-base-300 dark:group-hover/item:border-base-700",
                    )}
                >
                    {isActive && <SquareFrame key="collapsed"/>}
                    <Icon ref={icon} size={18} aria-hidden="true" className={iconClass("group-hover/item:text-base-600 dark:group-hover/item:text-base-300")}/>
                </span>
            </NavLink>
        )
    }

    return (
        <div>
            <button
                type="button"
                aria-expanded={open}
                aria-controls={id}
                onClick={() => setOpen(current => !current)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="group/item flex w-full items-center gap-1.5 text-left text-[0.9375rem] whitespace-nowrap"
            >
                <span aria-hidden="true" className="relative z-10 grid size-8 shrink-0 place-items-center">
                    <span
                        className={cn(
                            "size-2.5 rounded-full border transition-colors duration-300",
                            isActive ? "border-brand-600 bg-brand-600" : "border-base-300 bg-white group-hover/item:border-base-500 dark:border-base-700 dark:bg-base-900 dark:group-hover/item:border-base-500",
                        )}
                    />
                </span>
                <span
                    className={cn(
                        "relative flex h-11 flex-1 items-center gap-3 border border-transparent px-2.5 transition-colors duration-150",
                        EASE,
                        isActive ? "text-base-900 dark:text-base-50" : "text-base-600 group-hover/item:border-dashed group-hover/item:border-base-300 group-hover/item:text-base-900 dark:text-base-400 dark:group-hover/item:border-base-700 dark:group-hover/item:text-base-100",
                    )}
                >
                    <Icon ref={icon} size={18} aria-hidden="true" className={iconClass("group-hover/item:text-base-600 dark:group-hover/item:text-base-300")}/>
                    <span className="relative flex-1">{t(item.key)}</span>
                    <ChevronDown aria-hidden="true" className={cn("relative size-4 text-base-400 transition-transform duration-300", EASE, open && "rotate-180 text-brand-600")} strokeWidth={1.5}/>
                </span>
            </button>

            {/* The rows animate open with the grid 0fr to 1fr trick, so no height has to be measured. */}
            <div id={id} className={cn("grid transition-[grid-template-rows] duration-500", EASE, open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                <ul inert={!open} className="relative overflow-hidden pl-8 before:absolute before:top-0 before:bottom-5 before:left-[15px] before:w-px before:bg-base-200 dark:before:bg-base-800">
                    {children.map(child => (
                        <li key={child.to} className="pt-1">
                            <NavLink to={child.to} className="group/sub relative flex items-center text-sm whitespace-nowrap">
                                {({isActive: isChildActive}) => (
                                    <>
                                        {/* The branch: a short line from the string to the sub-page. */}
                                        <span aria-hidden="true" className={cn("absolute top-1/2 -left-[17px] h-px w-3 transition-colors", isChildActive ? "bg-brand-600" : "bg-base-200 dark:bg-base-800")}/>
                                        <span
                                            className={cn(
                                                "relative flex h-9 flex-1 items-center gap-2.5 border border-transparent px-3 transition-colors duration-150",
                                                isChildActive
                                                    ? "text-base-900 dark:text-base-50"
                                                    : "text-base-500 group-hover/sub:border-dashed group-hover/sub:border-base-300 group-hover/sub:text-base-900 dark:group-hover/sub:border-base-700 dark:group-hover/sub:text-base-100",
                                            )}
                                        >
                                            {isChildActive && <SquareFrame/>}
                                            <span aria-hidden="true" className={cn("relative size-1.5 rounded-full transition-colors", isChildActive ? "nv-node bg-brand-600" : "bg-base-300 group-hover/sub:bg-base-500 dark:bg-base-700")}/>
                                            <span className="relative">{t(child.key)}</span>
                                        </span>
                                    </>
                                )}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}

/** A guitar pick, tip down, centred on the origin. */
const PICK = "M0,-13 C8.5,-13 14,-9.5 14,-3 C14,4.5 6,12 0,16 C-6,12 -14,4.5 -14,-3 C-14,-9.5 -8.5,-13 0,-13 Z"

/**
 * The collapse switch on the sidebar's right edge, shaped like a guitar pick whose tip is the arrow:
 * it points left while open (collapse) and right while collapsed (expand). Each toggle swings it
 * half way round; hovering rocks it a little and draws an accent line along the sidebar's edge.
 */
function PickToggle({collapsed, onToggle}: {collapsed: boolean; onToggle: () => void}) {
    const {t} = useTranslation()
    const label = collapsed ? t("nav.expand") : t("nav.collapse")

    return (
        <>
            <button
                type="button"
                onClick={onToggle}
                aria-label={label}
                aria-expanded={!collapsed}
                title={label}
                className="group/pick peer absolute top-[1.125rem] -right-[1.1rem] z-10 grid size-9 place-items-center rounded-full outline-none active:scale-[0.92] transition-transform"
            >
                <svg viewBox="-17 -17 34 34" aria-hidden="true" className="size-9 overflow-visible">
                    <g
                        className={cn(
                            "origin-center transition-[rotate] duration-700 [transform-box:fill-box]",
                            EASE,
                            collapsed ? "-rotate-90 group-hover/pick:-rotate-[78deg]" : "rotate-90 group-hover/pick:rotate-[102deg]",
                        )}
                    >
                        <path
                            d={PICK}
                            strokeWidth="1"
                            className="fill-white stroke-base-300 transition-colors duration-300 group-hover/pick:fill-brand-50 group-hover/pick:stroke-brand-600 group-focus-visible/pick:stroke-brand-600 dark:fill-base-900 dark:stroke-base-700 dark:group-hover/pick:fill-brand-950"
                        />
                        {/* the engraved inner outline */}
                        <path d={PICK} strokeWidth="0.7" transform="scale(0.72)" className="fill-none stroke-brand-600 opacity-40 transition-opacity duration-300 group-hover/pick:opacity-100"/>
                        {/* the tip: a small chevron that reads as the arrow */}
                        <path d="M-3.5,6 L0,10 L3.5,6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="fill-none stroke-base-500 transition-colors duration-300 group-hover/pick:stroke-brand-600"/>
                    </g>
                </svg>
            </button>
            {/* an accent line along the edge, drawn out from the pick while it is hovered or focused */}
            <span
                aria-hidden="true"
                className={cn(
                    "pointer-events-none absolute inset-y-6 -right-px w-px origin-[50%_1.5rem] scale-y-0 bg-linear-to-b from-transparent via-brand-600 to-transparent transition-[scale] duration-500 peer-hover:scale-y-100 peer-focus-visible:scale-y-100",
                    EASE,
                )}
            />
        </>
    )
}

interface SidebarProps {
    instrument: Instrument
    groups: NavGroup[]
    home: string
    tagline: string
    collapsed: boolean
    /** Shows the collapse switch; the phone drawer has none. */
    onToggle?: () => void
    className?: string
}

/**
 * Section nav for one instrument: a floating panel with the logo, the pages and the instrument's
 * line drawing at the bottom. The pages hang off a single "string"; the active one is a filled node
 * and a square frame that draws itself in. Collapsed, it keeps only the logo and the pages' icons.
 */
export function Sidebar({instrument, groups, home, tagline, collapsed, onToggle, className}: SidebarProps) {
    const {t} = useTranslation()
    const art = INSTRUMENT_ART[instrument]

    return (
        <div className={cn("relative", className)}>
            <aside
                className={cn(
                    "flex h-full flex-col overflow-hidden rounded-[18px] border border-base-200 bg-white transition-[width] duration-500 dark:border-base-800 dark:bg-base-900",
                    EASE,
                    collapsed ? "w-[4.75rem]" : "w-64",
                )}
            >
                <Link to={INSTRUMENT_PICKER_PATH} className="flex h-[4.5rem] shrink-0 items-center gap-2.5 px-[1.375rem]">
                    <Logo/>
                    <span className={cn("leading-tight whitespace-nowrap transition-opacity duration-300", collapsed && "opacity-0")}>
                        <span className="block font-bold tracking-tight">{t("appName")}</span>
                        <span className="block text-xs text-base-500">{tagline}</span>
                    </span>
                </Link>

                <nav aria-label={t(`instrument.${instrument}`)} className="flex-1 space-y-5 overflow-x-hidden overflow-y-auto px-3 py-2">
                    {groups.map((group, index) => (
                        <div key={group.labelKey ?? index} className="space-y-1">
                            {group.labelKey && (
                                collapsed
                                    ? <hr className="mx-3 mb-3 border-base-200 dark:border-base-800"/>
                                    : (
                                        <p className="flex items-center gap-2 px-3 pt-2 pb-1 text-xs font-medium whitespace-nowrap text-base-500">
                                            <span aria-hidden="true" className="size-1 rounded-full bg-brand-600 opacity-70"/>
                                            {t(group.labelKey)}
                                        </p>
                                    )
                            )}
                            <ul
                                className={cn(
                                    "relative space-y-1",
                                    // The string the nodes sit on; gone when collapsed, where only the icons remain.
                                    !collapsed && "before:absolute before:top-5 before:bottom-5 before:left-[15px] before:w-px before:bg-base-200 dark:before:bg-base-800",
                                )}
                            >
                                {group.items.map(item => (
                                    <li key={item.to}>
                                        {item.children ? <SidebarAccordion item={item} collapsed={collapsed}/> : <SidebarItem item={item} collapsed={collapsed}/>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </nav>

                {/* A small copy of the instrument drawing; it takes the accent on hover. */}
                <Link
                    to={home}
                    aria-label={t(`instrument.${instrument}`)}
                    tabIndex={collapsed ? -1 : undefined}
                    className={cn(
                        "group/art mx-3 mb-3 block shrink-0 border-t border-base-200 pt-3 transition-opacity duration-300 dark:border-base-800",
                        collapsed && "pointer-events-none opacity-0",
                    )}
                >
                    <div
                        aria-hidden="true"
                        className="h-28 w-[14.5rem] bg-base-400 transition-colors duration-500 group-hover/art:bg-brand-600 dark:bg-base-600"
                        style={{
                            maskImage: `url(${art.src})`,
                            maskMode: "luminance",
                            maskRepeat: "no-repeat",
                            maskSize: "contain",
                            maskPosition: "center",
                        }}
                    />
                </Link>
            </aside>

            {onToggle && <PickToggle collapsed={collapsed} onToggle={onToggle}/>}
        </div>
    )
}
