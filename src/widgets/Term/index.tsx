import {useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode} from "react"
import {createPortal} from "react-dom"
import {Link} from "react-router"
import {useTranslation} from "react-i18next"
import {Note} from "tonal"
import {BookOpen, Loader2, Volume2} from "lucide-react"
import {findGlossaryTerm, type GlossaryExample} from "@/constants/glossary"
import {usePlayer} from "@/hooks/usePlayer"
import {parseTerms} from "@/lib/terms"
import {PATHS} from "@/router/paths"

const POPOVER_WIDTH = 288
const EDGE_GAP = 8
const HOVER_DELAY_MS = 120

function toMidi(notes: string[]): number[] {
    return notes.flatMap(note => Note.midi(note) ?? [])
}

/** Play button for a glossary example; shared by the popover and the glossary page. */
export function ExampleButton({example, className}: {example: GlossaryExample; className?: string}) {
    const {t} = useTranslation()
    const player = usePlayer()

    const play = () => {
        if (example.kind === "sequence") void player.strumSequence(example.chords.map(toMidi))
        else if (example.kind === "strum") void player.strum(toMidi(example.notes))
        else void player.arpeggiate(toMidi(example.notes))
    }

    return (
        <button
            type="button"
            onClick={play}
            className={className ?? "inline-flex items-center gap-1.5 rounded-md bg-base-100 px-2 py-1 text-xs font-medium hover:bg-base-200 pointer-coarse:min-h-10 pointer-coarse:px-3 dark:bg-base-800 dark:hover:bg-base-700"}
        >
            {player.isLoading ? <Loader2 className="size-3.5 animate-spin"/> : <Volume2 className="size-3.5"/>}
            {t("actions.play")}
        </button>
    )
}

interface TermProps {
    id: string
    children: ReactNode
}

/**
 * A word with a dotted underline that explains itself: hover or focus on desktop,
 * tap on touch screens. Unknown ids render as plain text.
 */
export function Term({id, children}: TermProps) {
    const {t} = useTranslation("glossary")
    const term = findGlossaryTerm(id)
    const popoverId = useId()
    const triggerRef = useRef<HTMLButtonElement>(null)
    const closeTimer = useRef<number | undefined>(undefined)
    const [open, setOpen] = useState(false)
    const [position, setPosition] = useState<{top: number; left: number} | null>(null)

    const show = () => {
        window.clearTimeout(closeTimer.current)
        setOpen(true)
    }
    const hideSoon = () => {
        window.clearTimeout(closeTimer.current)
        closeTimer.current = window.setTimeout(() => setOpen(false), HOVER_DELAY_MS)
    }

    // Fixed positioning under the word, kept inside the viewport.
    useLayoutEffect(() => {
        if (!open || !triggerRef.current) return
        const rect = triggerRef.current.getBoundingClientRect()
        const left = Math.min(
            Math.max(rect.left + rect.width / 2 - POPOVER_WIDTH / 2, EDGE_GAP),
            window.innerWidth - POPOVER_WIDTH - EDGE_GAP,
        )
        setPosition({top: rect.bottom + 6, left})
    }, [open])

    useEffect(() => {
        if (!open) return
        const close = () => setOpen(false)
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setOpen(false)
                triggerRef.current?.focus()
            }
        }
        const onPointer = (event: PointerEvent) => {
            const target = event.target as Node
            if (triggerRef.current?.contains(target) || document.getElementById(popoverId)?.contains(target)) return
            setOpen(false)
        }
        window.addEventListener("scroll", close, {passive: true})
        window.addEventListener("resize", close)
        window.addEventListener("keydown", onKey)
        window.addEventListener("pointerdown", onPointer)
        return () => {
            window.removeEventListener("scroll", close)
            window.removeEventListener("resize", close)
            window.removeEventListener("keydown", onKey)
            window.removeEventListener("pointerdown", onPointer)
        }
    }, [open, popoverId])

    useEffect(() => () => window.clearTimeout(closeTimer.current), [])

    if (!term) return <>{children}</>

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                aria-expanded={open}
                aria-controls={open ? popoverId : undefined}
                onClick={() => setOpen(current => !current)}
                onMouseEnter={show}
                onMouseLeave={hideSoon}
                onFocus={show}
                onBlur={hideSoon}
                className="cursor-help underline decoration-brand-500/70 decoration-dotted decoration-2 underline-offset-4 hover:decoration-solid"
            >
                {children}
            </button>
            {open && position && createPortal(
                <div
                    id={popoverId}
                    onMouseEnter={show}
                    onMouseLeave={hideSoon}
                    onFocus={show}
                    onBlur={hideSoon}
                    style={{top: position.top, left: position.left, width: POPOVER_WIDTH}}
                    className="fixed z-50 space-y-2 rounded-xl border border-base-200 bg-white p-4 text-left text-sm font-normal tracking-normal normal-case shadow-xl dark:border-base-700 dark:bg-base-900"
                >
                    <p className="font-semibold text-base-900 dark:text-base-100">{t(`terms.${term.id}.title`)}</p>
                    <p className="leading-relaxed text-base-600 dark:text-base-400">{t(`terms.${term.id}.body`)}</p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                        {term.example && <ExampleButton example={term.example}/>}
                        <Link
                            to={`${PATHS.glossary}#${term.id}`}
                            onClick={() => setOpen(false)}
                            className="inline-flex min-h-6 items-center pointer-coarse:min-h-10 gap-1.5 text-xs font-medium text-brand-700 hover:underline dark:text-brand-400"
                        >
                            <BookOpen className="size-3.5"/> {t("openGlossary")}
                        </Link>
                    </div>
                </div>,
                document.body,
            )}
        </>
    )
}

/** Renders a translated text, turning its `[[id|text]]` markers into `Term`s. */
export function TermText({text}: {text: string}) {
    return (
        <>
            {parseTerms(text).map((part, index) =>
                part.kind === "term"
                    ? <Term key={index} id={part.id}>{part.text}</Term>
                    : <span key={index}>{part.text}</span>,
            )}
        </>
    )
}
