import type {MouseEvent, ReactNode} from "react"
import {useTranslation} from "react-i18next"
import {Moon, Sun} from "lucide-react"
import {Segmented} from "@/components/ui/segmented"
import {Select} from "@/components/ui/select"
import {Switch} from "@/components/ui/switch"
import {ACCENTS} from "@/constants/accents"
import {TUNINGS} from "@/constants/tunings"
import {useSettings} from "@/hooks/useSettings"
import {useTheme, type Theme} from "@/hooks/useTheme"
import {cn} from "@/lib/utils"

/** The two themes' own colours, so each preview shows that theme whatever is active now. */
const PREVIEW: Record<Theme, {page: string; panel: string; line: string; ink: string; faint: string; accent: string}> = {
    light: {page: "#f3f6f9", panel: "#ffffff", line: "#dbe3ea", ink: "#0f1b26", faint: "#c3cfda", accent: "var(--accent-fill-light)"},
    dark: {page: "#0c0c0e", panel: "#17171a", line: "#2a2a2e", ink: "#f4f4f5", faint: "#3f3f46", accent: "var(--accent-fill-dark)"},
}

/** A small picture of the site in one theme: the sidebar on its string, the header, two chord cards. */
function ThemePreview({theme}: {theme: Theme}) {
    const c = PREVIEW[theme]
    const nodes = [22, 32, 42, 52, 62]
    return (
        <svg viewBox="0 0 160 100" className="block h-auto w-full" aria-hidden="true">
            <rect width="160" height="100" fill={c.page}/>
            {/* sidebar */}
            <rect x="4" y="4" width="38" height="92" rx="5" fill={c.panel} stroke={c.line} strokeWidth="0.6"/>
            <rect x="9" y="9" width="7" height="7" rx="1.6" fill={c.accent}/>
            <rect x="18" y="10.5" width="16" height="2" rx="1" fill={c.ink} opacity="0.8"/>
            <line x1="11" x2="11" y1="22" y2="62" stroke={c.line} strokeWidth="0.6"/>
            {nodes.map((y, index) => (
                <g key={y}>
                    <circle cx="11" cy={y} r="1.6" fill={index === 0 ? c.accent : c.panel} stroke={index === 0 ? c.accent : c.faint} strokeWidth="0.6"/>
                    <rect x="16" y={y - 1} width={index === 0 ? 18 : 14} height="2" rx="1" fill={index === 0 ? c.ink : c.faint}/>
                </g>
            ))}
            <rect x="14.5" y="18.5" width="23" height="7" fill="none" stroke={c.accent} strokeWidth="0.5" opacity="0.6"/>
            {/* header */}
            <rect x="46" y="4" width="110" height="13" rx="4" fill={c.panel} stroke={c.line} strokeWidth="0.6"/>
            <rect x="51" y="9.5" width="26" height="2" rx="1" fill={c.faint}/>
            {[128, 136, 144].map(x => <rect key={x} x={x} y="7.5" width="6" height="6" rx="1.5" fill="none" stroke={c.faint} strokeWidth="0.6"/>)}
            {/* page title */}
            <rect x="50" y="24" width="34" height="4" rx="1.5" fill={c.ink}/>
            <rect x="50" y="31" width="60" height="2" rx="1" fill={c.faint}/>
            {/* chord cards with a lit shape */}
            {[50, 104].map((x, card) => (
                <g key={x}>
                    <rect x={x} y="40" width="50" height="54" rx="4" fill={c.panel} stroke={c.line} strokeWidth="0.6"/>
                    {[0, 1, 2, 3, 4].map(fret => <line key={fret} x1={x + 12} x2={x + 38} y1={54 + fret * 7} y2={54 + fret * 7} stroke={c.faint} strokeWidth="0.6"/>)}
                    {[0, 1, 2, 3, 4, 5].map(string => <line key={string} x1={x + 12 + string * 5.2} x2={x + 12 + string * 5.2} y1="54" y2="82" stroke={c.faint} strokeWidth="0.6"/>)}
                    <circle cx={x + 17.2} cy={card ? 72 : 65} r="2.2" fill={c.accent}/>
                    <circle cx={x + 22.4} cy={card ? 65 : 58} r="2.2" fill="none" stroke={c.accent} strokeWidth="0.7"/>
                    <circle cx={x + 32.8} cy="58" r="2.2" fill="none" stroke={c.accent} strokeWidth="0.7"/>
                    <rect x={x + 18} y="45" width="14" height="3" rx="1" fill={c.ink} opacity="0.85"/>
                </g>
            ))}
        </svg>
    )
}

/** Registration marks on the corners of the chosen theme, like the sidebar's active page. */
function CornerMarks() {
    const mark = "nv-corner absolute size-2.5 border-brand-600"
    return (
        <span aria-hidden="true">
            <span className={cn(mark, "-top-px -left-px origin-top-left border-t-2 border-l-2")}/>
            <span className={cn(mark, "-top-px -right-px origin-top-right border-t-2 border-r-2 [animation-delay:60ms]")}/>
            <span className={cn(mark, "-right-px -bottom-px origin-bottom-right border-r-2 border-b-2 [animation-delay:120ms]")}/>
            <span className={cn(mark, "-bottom-px -left-px origin-bottom-left border-b-2 border-l-2 [animation-delay:180ms]")}/>
        </span>
    )
}

function Section({title, children}: {title: string; children: ReactNode}) {
    return (
        <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-xs font-medium text-base-500">
                <span aria-hidden="true" className="size-1 rounded-full bg-brand-600 opacity-70"/>
                {title}
            </h3>
            {children}
        </section>
    )
}

function Row({label, hint, children}: {label: string; hint?: string; children: ReactNode}) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
            <div className="max-w-xs space-y-0.5">
                <p className="text-sm font-medium">{label}</p>
                {hint && <p className="text-xs text-base-500 text-pretty">{hint}</p>}
            </div>
            {children}
        </div>
    )
}

/** Every setting in one place: theme and accent first, then notes, then guitar-only options. */
export function SettingsPanel() {
    const {t} = useTranslation()
    const settings = useSettings()
    const {theme, setTheme} = useTheme()

    const chooseTheme = (next: Theme) => (event: MouseEvent<HTMLButtonElement>) => {
        // Keyboard clicks have no pointer position; grow from the card's centre instead.
        const box = event.currentTarget.getBoundingClientRect()
        const origin = event.clientX || event.clientY
            ? {x: event.clientX, y: event.clientY}
            : {x: box.left + box.width / 2, y: box.top + box.height / 2}
        setTheme(next, origin)
    }

    return (
        <div className="space-y-8">
            <Section title={t("settings.appearance")}>
                <div role="radiogroup" aria-label={t("settings.theme")} className="grid grid-cols-2 gap-3">
                    {(["light", "dark"] as const).map(option => {
                        const isActive = theme === option
                        const Icon = option === "light" ? Sun : Moon
                        return (
                            <button
                                key={option}
                                type="button"
                                role="radio"
                                aria-checked={isActive}
                                onClick={chooseTheme(option)}
                                className={cn(
                                    "group/theme relative border p-1.5 text-left transition-colors duration-200",
                                    isActive ? "border-brand-600/40" : "border-base-200 hover:border-dashed hover:border-base-400 dark:border-base-800 dark:hover:border-base-600",
                                )}
                            >
                                {isActive && <CornerMarks key={theme}/>}
                                <span className="block overflow-hidden transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover/theme:scale-[1.02]">
                                    <ThemePreview theme={option}/>
                                </span>
                                <span className="flex items-center gap-2 px-1 pt-2.5 pb-1">
                                    <Icon
                                        className={cn(
                                            "size-4 transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
                                            isActive ? "text-brand-600" : "text-base-400",
                                            option === "light" ? "group-hover/theme:rotate-90" : "group-hover/theme:-rotate-12",
                                        )}
                                        strokeWidth={1.5}
                                    />
                                    <span className="text-sm font-medium">{t(option === "light" ? "settings.themeLight" : "settings.themeDark")}</span>
                                    <span className="ml-auto text-xs text-base-500">{t(option === "light" ? "settings.themeLightName" : "settings.themeDarkName")}</span>
                                </span>
                            </button>
                        )
                    })}
                </div>

                <div className="pt-2">
                    <div className="mb-2.5 flex items-baseline justify-between">
                        <p className="text-sm font-medium">{t("settings.accent")}</p>
                        <p className="text-xs font-medium text-brand-700 dark:text-brand-400">{t(`settings.accents.${settings.accent}`)}</p>
                    </div>
                    <div role="radiogroup" aria-label={t("settings.accent")} className="flex flex-wrap gap-2.5">
                        {ACCENTS.map(accent => {
                            const isActive = settings.accent === accent.id
                            const name = t(`settings.accents.${accent.id}`)
                            return (
                                <button
                                    key={accent.id}
                                    type="button"
                                    role="radio"
                                    aria-checked={isActive}
                                    aria-label={name}
                                    title={name}
                                    onClick={() => settings.update({accent: accent.id})}
                                    className={cn(
                                        "size-8 rounded-full ring-offset-2 ring-offset-white transition-[box-shadow,scale] duration-300 hover:scale-110 active:scale-95 dark:ring-offset-base-900",
                                        isActive ? "ring-2 ring-brand-600" : "hover:ring-1 hover:ring-base-300 dark:hover:ring-base-700",
                                    )}
                                    style={{background: `linear-gradient(135deg, ${accent.swatch.light} 50%, ${accent.swatch.dark} 50%)`}}
                                />
                            )
                        })}
                    </div>
                </div>
            </Section>

            <Section title={t("settings.notesSection")}>
                <div className="divide-y divide-base-200 dark:divide-base-800">
                    <Row label={t("settings.notation")}>
                        <Segmented
                            label={t("settings.notation")}
                            value={settings.notation}
                            onChange={notation => settings.update({notation})}
                            options={[
                                {value: "letter", label: t("settings.notationLetter")},
                                {value: "solfege", label: t("settings.notationSolfege")},
                            ]}
                        />
                    </Row>
                    <Row label={t("settings.labels")}>
                        <Segmented
                            label={t("settings.labels")}
                            value={settings.labelMode}
                            onChange={labelMode => settings.update({labelMode})}
                            options={[
                                {value: "note", label: t("settings.labelNote")},
                                {value: "degree", label: t("settings.labelDegree")},
                            ]}
                        />
                    </Row>
                </div>
            </Section>

            <Section title={t("settings.guitarSection")}>
                <div className="divide-y divide-base-200 dark:divide-base-800">
                    <Row label={t("settings.leftHanded")} hint={t("settings.leftHandedHint")}>
                        <Switch
                            checked={settings.leftHanded}
                            onChange={leftHanded => settings.update({leftHanded})}
                            aria-label={t("settings.leftHanded")}
                        />
                    </Row>
                    <Row label={t("settings.tuning")} hint={t("settings.tuningHint")}>
                        <Select
                            label={t("settings.tuning")}
                            value={settings.tuningId}
                            onChange={tuningId => settings.update({tuningId})}
                            options={TUNINGS.map(tuning => ({value: tuning.id, label: t(`settings.tunings.${tuning.id}`)}))}
                            align="end"
                            className="w-full"
                        />
                    </Row>
                </div>
            </Section>
        </div>
    )
}
