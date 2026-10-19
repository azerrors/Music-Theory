import {useRef, useState, type CSSProperties} from "react"
import {Link} from "react-router"
import {useTranslation} from "react-i18next"
import {ArrowRight, Loader2, Volume2} from "lucide-react"
import {buttonVariants} from "@/components/ui/button"
import {INSTRUMENT_ART} from "@/constants/instrumentArt"
import type {Instrument} from "@/hooks/useInstrument"
import {usePianoPlayer} from "@/hooks/usePianoPlayer"
import {usePlayer} from "@/hooks/usePlayer"
import {cn} from "@/lib/utils"
import {PATHS, PIANO_PATHS} from "@/router/paths"

/** Open C major on guitar and a C major triad over C3 on piano. */
const GUITAR_C_MAJOR = [48, 52, 55, 60, 64]
const PIANO_C_MAJOR = [48, 60, 64, 67]

/** How long the panel stays lit after "Listen", roughly the length of the chord. */
const ACTIVE_MS = 1800

/** Floating notes: glyph, horizontal start (%), start height (%), delay and duration (s). */
const NOTES: [string, number, number, number, number][] = [
    ["♪", 12, 70, 0, 7], ["♫", 28, 85, 2.4, 8], ["♩", 46, 64, 4.1, 6.5], ["♬", 64, 78, 1.2, 7.5],
    ["♪", 80, 60, 3.3, 6.8], ["♫", 90, 88, 5.2, 8.2], ["♩", 36, 50, 6.1, 7.2], ["♪", 56, 92, 0.8, 9],
]

function FloatingNotes() {
    return (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            {NOTES.map(([glyph, left, top, delay, duration], index) => (
                <span
                    key={index}
                    style={{left: `${left}%`, top: `${top}%`, animationDelay: `${delay}s`, animationDuration: `${duration}s`}}
                    className={cn(
                        "absolute text-brand-600 opacity-0 select-none motion-safe:animate-[note-float_7s_ease-in-out_infinite]",
                        index % 2 === 0 ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl",
                    )}
                >
                    {glyph}
                </span>
            ))}
        </div>
    )
}

interface PanelProps {
    instrument: Instrument
    to: string
    isLoading: boolean
    onListen: () => void
    className?: string
}

function InstrumentPanel({instrument, to, isLoading, onListen, className}: PanelProps) {
    const {t} = useTranslation()
    const [isActive, setIsActive] = useState(false)
    const timer = useRef<number>(undefined)
    const art = INSTRUMENT_ART[instrument]

    const listen = () => {
        onListen()
        setIsActive(true)
        window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => setIsActive(false), ACTIVE_MS)
    }

    return (
        <article
            data-active={isActive}
            className={cn(
                "group relative isolate flex min-h-[65dvh] flex-1 flex-col justify-end overflow-hidden px-6 pt-24 pb-10 sm:px-10 md:min-h-0 md:pb-14",
                "transition-[flex-grow,background-color] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
                "hover:bg-white focus-within:bg-white dark:hover:bg-base-900 dark:focus-within:bg-base-900",
                "md:hover:grow-[1.3] md:focus-within:grow-[1.3]",
                className,
            )}
        >
            {/* The drawing: a colour fill shown through the image's bright lines. */}
            <div
                aria-hidden="true"
                className={cn(
                    "absolute inset-0 -z-10 transition-[background-color,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
                    "bg-base-400 group-hover:bg-brand-600 group-data-[active=true]:bg-brand-600 dark:bg-base-500",
                    "motion-safe:group-hover:scale-[1.03]",
                    "[mask-position:var(--art-mobile-position)] [mask-size:var(--art-mobile-size)] md:[mask-position:var(--art-position)] md:[mask-size:var(--art-size)]",
                )}
                style={{
                    maskImage: `url(${art.src})`,
                    maskMode: "luminance",
                    maskRepeat: "no-repeat",
                    "--art-size": art.size,
                    "--art-position": art.position,
                    "--art-mobile-size": art.mobileSize,
                    "--art-mobile-position": art.mobilePosition,
                } as CSSProperties}
            />
            <FloatingNotes/>
            {/* Keeps the copy readable where it sits over the drawing. */}
            <div
                aria-hidden="true"
                className={cn(
                    "pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-linear-to-t transition-colors duration-700",
                    "from-base-50 via-base-50/80 to-transparent group-hover:from-white group-hover:via-white/80",
                    "dark:from-base-950 dark:via-base-950/80 dark:group-hover:from-base-900 dark:group-hover:via-base-900/80",
                )}
            />

            <div className="max-w-md space-y-3">
                <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">{t(`instrument.${instrument}`)}</h2>
                <p className="text-lg text-base-600 text-pretty dark:text-base-400">{t(`picker.${instrument}`)}</p>
                <div className="flex flex-wrap items-center gap-2 pt-3">
                    <Link to={to} className={cn(buttonVariants({size: "lg"}), "after:absolute after:inset-0 after:content-['']")}>
                        {t("picker.open")}
                        <ArrowRight className="transition-transform group-hover:translate-x-0.5"/>
                    </Link>
                    <button
                        type="button"
                        onClick={listen}
                        className={cn(buttonVariants({variant: "secondary", size: "lg"}), "relative z-10")}
                    >
                        {isLoading ? <Loader2 className="animate-spin"/> : <Volume2/>}
                        {t("picker.listen")}
                    </button>
                </div>
            </div>
        </article>
    )
}

export default function InstrumentPickerPage() {
    const {t} = useTranslation()
    const guitar = usePlayer()
    const piano = usePianoPlayer()

    return (
        <div className="relative flex flex-1 flex-col md:min-h-[calc(100dvh-4rem)] md:flex-row">
            <section className="px-6 pt-8 sm:px-10 md:pointer-events-none md:absolute md:inset-x-0 md:top-0 md:z-10 md:pt-12">
                <div className="max-w-2xl space-y-3">
                    <h1 className="text-4xl font-bold tracking-tight text-balance md:text-6xl">{t("picker.title")}</h1>
                    <p className="text-lg text-base-600 text-pretty dark:text-base-400">{t("picker.subtitle")}</p>
                </div>
            </section>

            <InstrumentPanel
                instrument="guitar"
                to={PATHS.home}
                isLoading={guitar.isLoading}
                onListen={() => void guitar.strum(GUITAR_C_MAJOR)}
            />
            <InstrumentPanel
                instrument="piano"
                to={PIANO_PATHS.home}
                isLoading={piano.isLoading}
                onListen={() => void piano.chord(PIANO_C_MAJOR)}
                className="border-t border-base-200 md:border-t-0 md:border-l dark:border-base-800"
            />

            {/* The samples are CC BY 3.0, which asks for this credit wherever they are played. */}
            <p className="px-6 py-3 text-xs text-base-500 sm:px-10 md:absolute md:right-0 md:bottom-0 md:z-10">
                {t("credits.prefix")}{" "}
                <a href="https://github.com/nbrosowsky/tonejs-instruments" target="_blank" rel="noreferrer" className="underline hover:text-base-700 dark:hover:text-base-300">tonejs-instruments</a>
                {" ("}
                <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer" className="underline hover:text-base-700 dark:hover:text-base-300">{t("credits.license")}</a>
                {")"}
            </p>
        </div>
    )
}
