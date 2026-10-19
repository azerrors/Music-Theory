import {useEffect, type ReactNode} from "react"
import {useTranslation} from "react-i18next"
import {ArrowRight, Check, Flame, RotateCcw, Trophy, Volume2, X} from "lucide-react"
import {Button} from "@/components/ui/button"
import {Card} from "@/components/ui/card"
import {Segmented} from "@/components/ui/segmented"
import type {usePracticeSession} from "@/hooks/usePracticeSession"
import {weakestItems} from "@/lib/practice/stats"
import {cn} from "@/lib/utils"
import {PageHeader} from "@/widgets/PageHeader"

type Session = ReturnType<typeof usePracticeSession<unknown, unknown>>

interface PracticeShellProps<L extends string> {
    title: string
    description: string
    session: Pick<Session, "started" | "finished" | "answer" | "results" | "streak" | "best" | "newBest" | "stats" | "score" | "total" | "next">
    levelLabel: string
    levels: {value: L; label: string}[]
    level: L
    onLevel: (level: L) => void
    /** More pickers beside the level, e.g. how answers are matched. */
    extraControls?: ReactNode
    /** Starts the session; also the user gesture that lets the browser play sound. */
    onStart: () => void
    startHint: string
    prompt: ReactNode
    /** Replays the question's sound, when it has one (R key). */
    onReplay?: () => void
    /** Feedback after an answer: the right answer, and what was picked when it was wrong. */
    correctText?: string
    choiceText?: string
    /** Extra buttons after an answer, e.g. "hear my choice". */
    answerActions?: ReactNode
    /** Turns a stats item ("F#", "major:3") into words for the "missed most" list. */
    formatItem: (item: string) => string
    children: ReactNode
}

/** Ten squares, one per question: green right, red wrong, the current one outlined. */
function Progress({results, total}: {results: boolean[]; total: number}) {
    return (
        <ol className="flex gap-1.5" aria-hidden="true">
            {Array.from({length: total}, (_, index) => {
                const result = results[index]
                return (
                    <li
                        key={index}
                        className={cn(
                            "size-3 border transition-colors duration-300",
                            result === true && "border-emerald-600 bg-emerald-600",
                            result === false && "border-rose-600 bg-rose-600",
                            result === undefined && index === results.length && "border-brand-600",
                            result === undefined && index !== results.length && "border-base-300 dark:border-base-700",
                        )}
                    />
                )
            })}
        </ol>
    )
}

/**
 * The frame every exercise shares: level picker, start screen, progress, the question with its
 * answer area, feedback and the "next" step, and the summary when the session is over.
 */
export function PracticeShell<L extends string>(props: PracticeShellProps<L>) {
    const {title, description, session, levelLabel, levels, level, onLevel, extraControls, onStart, startHint, prompt, onReplay, correctText, choiceText, answerActions, formatItem, children} = props
    const {t} = useTranslation()
    const {started, finished, answer, results, streak, best, newBest, stats, score, total, next} = session

    // Enter goes on after an answer; R replays the sound.
    useEffect(() => {
        if (!started || finished) return
        const onKey = (event: KeyboardEvent) => {
            if (event.target instanceof HTMLElement && event.target.closest("input, textarea, [role=combobox], [role=listbox]")) return
            if (event.key === "Enter" && answer) {
                event.preventDefault()
                next()
            } else if ((event.key === "r" || event.key === "R") && onReplay) {
                onReplay()
            }
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [started, finished, answer, next, onReplay])

    const weakest = weakestItems(stats)

    return (
        <div className="space-y-8">
            <PageHeader title={title} description={description}/>

            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-semibold tracking-wide text-base-500 uppercase">{levelLabel}</span>
                    <Segmented label={levelLabel} value={level} onChange={onLevel} options={levels}/>
                    {extraControls}
                </div>
                <div className="flex items-center gap-4 text-sm text-base-600 dark:text-base-400">
                    <span className="flex items-center gap-1.5"><Flame className="size-4 text-brand-600" strokeWidth={1.5}/>{t("practice.streak", {count: streak})}</span>
                    <span className="flex items-center gap-1.5"><Trophy className="size-4 text-brand-600" strokeWidth={1.5}/>{t("practice.best", {score: best, total})}</span>
                </div>
            </div>

            {!started ? (
                <Card className="flex flex-col items-start gap-4 p-8">
                    <p className="max-w-lg text-base-600 dark:text-base-400">{startHint}</p>
                    <Button size="lg" onClick={onStart}>{t("practice.start")}<ArrowRight/></Button>
                </Card>
            ) : finished ? (
                <Card className="space-y-6 p-8">
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-base-500">{t("practice.finishedTitle")}</p>
                        <p className="text-4xl font-bold tracking-tight">{t("practice.finishedScore", {score, total})}</p>
                        {newBest && (
                            <p className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 dark:text-brand-400">
                                <Trophy className="size-4" strokeWidth={1.5}/>{t("practice.newBest")}
                            </p>
                        )}
                    </div>
                    <Progress results={results} total={total}/>
                    <div className="space-y-2">
                        <p className="text-sm font-medium">{t("practice.weakest")}</p>
                        {weakest.length > 0 ? (
                            <ul className="flex flex-wrap gap-2">
                                {weakest.map(item => (
                                    <li key={item} className="border border-dashed border-rose-600/50 px-3 py-1 text-sm font-medium text-rose-700 dark:text-rose-400">{formatItem(item)}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-base-500">{t("practice.noWeakest")}</p>
                        )}
                    </div>
                    <Button size="lg" onClick={onStart}><RotateCcw/>{t("practice.again")}</Button>
                </Card>
            ) : (
                <Card className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-base-500">{t("practice.question", {current: Math.min(results.length + (answer ? 0 : 1), total), total})}</p>
                            <Progress results={results} total={total}/>
                        </div>
                        {onReplay && (
                            <Button variant="secondary" onClick={onReplay}><Volume2/>{t("practice.replay")}</Button>
                        )}
                    </div>

                    <div className="text-2xl font-bold tracking-tight text-balance">{prompt}</div>

                    {children}

                    <div className="flex min-h-11 flex-wrap items-center justify-between gap-3">
                        {answer ? (
                            <p
                                role="status"
                                className={cn(
                                    "fb-enter flex flex-wrap items-center gap-x-3 gap-y-1 font-medium",
                                    answer.correct ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400",
                                )}
                            >
                                {answer.correct ? <Check className="size-5" strokeWidth={2}/> : <X className="size-5" strokeWidth={2}/>}
                                {answer.correct ? t("practice.correct") : t("practice.wrong")}
                                {correctText && <span className="text-base-700 dark:text-base-300">{correctText}</span>}
                                {!answer.correct && choiceText && <span className="text-base-500">{choiceText}</span>}
                            </p>
                        ) : (
                            onReplay && <p className="text-xs text-base-500">{t("practice.keys")}</p>
                        )}
                        {answer && (
                            <div className="flex flex-wrap gap-2">
                                {answerActions}
                                <Button onClick={next}>{t("practice.next")}<ArrowRight/></Button>
                            </div>
                        )}
                    </div>
                </Card>
            )}
        </div>
    )
}
