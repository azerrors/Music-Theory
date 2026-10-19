import {createContext, useCallback, useEffect, useMemo, useState, type ReactNode} from "react"
import {STANDARD_TUNING, TUNINGS} from "@/constants/tunings"
import {DEFAULT_ACCENT, type AccentId} from "@/constants/accents"
import {readJson, writeJson} from "@/lib/localStorage"
import type {Notation, Tuning} from "@/types/music"

export type LabelMode = "note" | "degree"

export interface Settings {
    notation: Notation
    labelMode: LabelMode
    leftHanded: boolean
    tuningId: string
    accent: AccentId
}

export interface SettingsContextValue extends Settings {
    tuning: Tuning
    update: (patch: Partial<Settings>) => void
}

const STORAGE_KEY = "settings"

const DEFAULT_SETTINGS: Settings = {
    notation: "letter",
    labelMode: "note",
    leftHanded: false,
    tuningId: STANDARD_TUNING.id,
    accent: DEFAULT_ACCENT,
}

export const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({children}: {children: ReactNode}) {
    const [settings, setSettings] = useState<Settings>(() => readJson(STORAGE_KEY, DEFAULT_SETTINGS))

    useEffect(() => {
        writeJson(STORAGE_KEY, settings)
    }, [settings])

    useEffect(() => {
        document.documentElement.dataset.accent = settings.accent
    }, [settings.accent])

    const update = useCallback((patch: Partial<Settings>) => {
        setSettings(prev => ({...prev, ...patch}))
    }, [])

    const value = useMemo<SettingsContextValue>(() => ({
        ...settings,
        tuning: TUNINGS.find(tuning => tuning.id === settings.tuningId) ?? STANDARD_TUNING,
        update,
    }), [settings, update])

    return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}
