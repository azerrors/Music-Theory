import {useSyncExternalStore} from "react"

export type Theme = "light" | "dark"

const STORAGE_KEY = "theme"

function readTheme(): Theme {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === "light" || stored === "dark") return stored
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

/** One theme for the whole app, so the header button and the settings drawer never disagree. */
let current: Theme = readTheme()
const listeners = new Set<() => void>()

function apply(theme: Theme) {
    current = theme
    document.documentElement.classList.toggle("dark", theme === "dark")
    localStorage.setItem(STORAGE_KEY, theme)
    listeners.forEach(listener => listener())
}

/**
 * Switches the theme. Given the point that was clicked, the new theme opens out from it in a
 * growing circle (View Transitions); without that API, or with reduced motion, it switches at once.
 */
export function setTheme(theme: Theme, origin?: {x: number; y: number}) {
    if (theme === current) return
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!origin || reduceMotion || !document.startViewTransition) {
        apply(theme)
        return
    }

    const radius = Math.hypot(Math.max(origin.x, innerWidth - origin.x), Math.max(origin.y, innerHeight - origin.y))
    const transition = document.startViewTransition(() => apply(theme))
    void transition.ready.then(() => {
        document.documentElement.animate(
            {clipPath: [`circle(0px at ${origin.x}px ${origin.y}px)`, `circle(${radius}px at ${origin.x}px ${origin.y}px)`]},
            {duration: 650, easing: "cubic-bezier(0.65, 0, 0.35, 1)", pseudoElement: "::view-transition-new(root)"},
        )
    })
}

const subscribe = (listener: () => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
}

export function useTheme() {
    const theme = useSyncExternalStore(subscribe, () => current)
    const toggleTheme = (origin?: {x: number; y: number}) => setTheme(theme === "light" ? "dark" : "light", origin)
    return {theme, setTheme, toggleTheme}
}
