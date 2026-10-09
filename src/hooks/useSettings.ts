import {useContext} from "react"
import {SettingsContext, type SettingsContextValue} from "@/provider/SettingsProvider"

export function useSettings(): SettingsContextValue {
    const context = useContext(SettingsContext)
    if (!context) throw new Error("useSettings must be used inside <SettingsProvider>")
    return context
}
