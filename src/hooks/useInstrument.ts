import {useEffect} from "react"
import {useLocation} from "react-router"

export type Instrument = "guitar" | "piano"

export const INSTRUMENTS: Instrument[] = ["guitar", "piano"]

const STORAGE_KEY = "instrument"

function readLastInstrument(): Instrument {
    try {
        return localStorage.getItem(STORAGE_KEY) === "piano" ? "piano" : "guitar"
    } catch {
        return "guitar"
    }
}

export function instrumentOfPath(pathname: string): Instrument | null {
    if (pathname === "/piano" || pathname.startsWith("/piano/")) return "piano"
    if (pathname === "/guitar" || pathname.startsWith("/guitar/")) return "guitar"
    return null
}

/**
 * The instrument section the user is in, read from the URL. Shared pages (settings, the
 * instrument picker) fall back to the last section visited, so the nav doesn't jump around.
 */
export function useInstrument(): Instrument {
    const {pathname} = useLocation()
    const fromPath = instrumentOfPath(pathname)

    useEffect(() => {
        if (!fromPath) return
        try {
            localStorage.setItem(STORAGE_KEY, fromPath)
        } catch {
            // Private mode — the fallback is simply guitar.
        }
    }, [fromPath])

    return fromPath ?? readLastInstrument()
}
