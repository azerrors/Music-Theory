import {useCallback, useEffect, useMemo, useState} from "react"
import {useTranslation} from "react-i18next"
import {Note} from "tonal"
import {Volume2} from "lucide-react"
import {Button} from "@/components/ui/button"
import {Segmented} from "@/components/ui/segmented"
import {useInstrument} from "@/hooks/useInstrument"
import {usePracticeSession} from "@/hooks/usePracticeSession"
import {useSettings} from "@/hooks/useSettings"
import {
    INTERVAL_LEVELS,
    INTERVAL_MODES,
    INTERVAL_PLAYBACKS,
    intervalQuestion,
    levelIntervals,
    minimumIntervals,
    PRACTICE_INTERVALS,
    type Direction,
    type IntervalLevel,
    type IntervalMode,
    type IntervalPlayback,
    type IntervalQuestion,
} from "@/lib/practice/intervals"
import {azAblative} from "@/lib/practice/azAblative"
import {guitarSpots, pianoSpots, spellingOf, type Spot} from "@/lib/practice/questions"
import {formatNote} from "@/lib/theory/notes"
import {cn} from "@/lib/utils"
import {practiceAudio} from "@/widgets/practice/audio"
import {FRET_COUNT, InstrumentAnswer} from "@/widgets/practice/InstrumentAnswer"
import {PracticeShell} from "@/widgets/practice/PracticeShell"

/** Piano questions stay between C2 and C7, like the note-by-ear drill. */
const PIANO_QUESTION_RANGE = [36, 96] as const

/** What was picked: an interval button (by ear) or a place on the instrument (build). */
type Choice = {interval: string} | {spot: Spot}

const octaveOf = (midi: number) => Math.floor(midi / 12) - 1

/** The intervals picked for the custom level, remembered on this device; seconds to start with. */
const CUSTOM_KEY = "practice:intervals:custom"
const DEFAULT_CUSTOM = ["2m", "2M"]

function readCustom(): string[] {
    try {
        const stored = JSON.parse(localStorage.getItem(CUSTOM_KEY) ?? "null") as unknown
        return Array.isArray(stored) && stored.every(id => typeof id === "string") ? stored : DEFAULT_CUSTOM
    } catch {
        return DEFAULT_CUSTOM
    }
}

/**
 * Intervals two ways: hear two notes and name the gap, or start from a lit, named note and press
 * the note the asked interval away, at its exact pitch.
 */
export default function IntervalPracticePage() {
    const {t} = useTranslation()
    const {t: tTheory} = useTranslation("theory")
    const {notation, tuning} = useSettings()
    const instrument = useInstrument()
    const audio = practiceAudio(instrument)
    const [mode, setMode] = useState<IntervalMode>("ear")
    const [level, setLevel] = useState<IntervalLevel>("basic")
    const [playback, setPlayback] = useState<IntervalPlayback>("up")
    const [custom, setCustom] = useState<string[]>(readCustom)

    const spots = useMemo(() => (instrument === "guitar" ? guitarSpots(tuning, FRET_COUNT) : pianoSpots(...PIANO_QUESTION_RANGE)), [instrument, tuning])
    const pool = useMemo(() => levelIntervals(level, custom), [level, custom])
    // By ear the direction follows the playback; building, the basic level goes up only.
    const directions: Direction[] = mode === "ear" ? [playback === "down" ? "down" : "up"] : level === "basic" ? ["up"] : ["up", "down"]
    const tooFew = pool.length < minimumIntervals(mode)

    const makeQuestion = useCallback(
        (stats: Parameters<typeof intervalQuestion>[3], previous: string | undefined) => intervalQuestion(pool, spots, directions, stats, previous),
        // eslint-disable-next-line react-hooks/exhaustive-deps -- directions is derived from mode, level and playback
        [pool, spots, mode, playback, level],
    )
    // Each picked set keeps its own best score.
    const levelKey = level === "custom" ? `custom:${pool.map(interval => interval.id).join(",")}` : level
    const session = usePracticeSession<IntervalQuestion, Choice>({
        exercise: `${instrument}:interval:${mode}`,
        level: mode === "ear" ? `${levelKey}:${playback}` : levelKey,
        makeQuestion,
        itemOf: question => question.interval.id,
    })
    const {question, answer} = session

    const playBoth = () => {
        if (!question) return
        const pair = [question.reference.midi, question.target.midi]
        if (mode === "ear" && playback === "together") audio.chord(pair)
        else audio.sequence(pair)
    }
    // By ear the question is both notes; building, only the first (the second is the answer).
    const play = () => {
        if (!question) return
        if (mode === "ear") playBoth()
        else audio.note(question.reference.midi)
    }

    useEffect(() => {
        if (question && !answer) play()
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the question changes
    }, [question])

    const pickInterval = (id: string) => {
        if (!question || answer) return
        session.submit(id === question.interval.id, {interval: id})
    }
    const pickSpot = (spot: Spot) => {
        if (!question) return
        audio.note(spot.midi)
        if (!answer && mode === "build") session.submit(spot.midi === question.target.midi, {spot})
    }

    const toggleCustom = (id: string) => {
        const next = custom.includes(id) ? custom.filter(item => item !== id) : [...custom, id]
        setCustom(next)
        session.reset()
        try {
            localStorage.setItem(CUSTOM_KEY, JSON.stringify(next))
        } catch {
            // Private mode: the pick just isn't remembered.
        }
    }

    const reset = <T, >(set: (value: T) => void) => (value: T) => {
        set(value)
        session.reset()
    }

    const intervalName = (id: string) => tTheory(`intervals.names.${id}`)
    const noteName = (midi: number) => `${formatNote(spellingOf(midi), notation)}${octaveOf(midi)}`

    /**
     * The answer spelled as the interval spells it: a minor third below C♯ is A♯, not B♭. When that
     * differs from the usual spelling the board uses, the usual one follows in brackets.
     */
    const targetName = (current: IntervalQuestion) => {
        const from = spellingOf(current.reference.midi)
        const spelled = Note.transpose(from, `${current.direction === "down" ? "-" : ""}${current.interval.id}`)
        const usual = spellingOf(current.target.midi)
        const name = `${formatNote(spelled, notation)}${octaveOf(current.target.midi)}`
        return Note.pitchClass(spelled) === usual ? name : `${name} (= ${formatNote(usual, notation)})`
    }

    const prompt = !question ? "" : mode === "ear"
        ? t("practice.intervals.promptEar")
        : t(question.direction === "up" ? "practice.intervals.promptBuildUp" : "practice.intervals.promptBuildDown", {
            note: formatNote(spellingOf(question.reference.midi), notation),
            from: azAblative(formatNote(spellingOf(question.reference.midi), notation)),
            interval: intervalName(question.interval.id).toLocaleLowerCase(),
        })

    let correctText: string | undefined
    let choiceText: string | undefined
    if (question && answer) {
        const feel = tTheory(`intervals.feel.${question.interval.id}`)
        correctText = mode === "ear"
            ? t("practice.correctAnswer", {answer: `${intervalName(question.interval.id)} (${feel})`})
            : t("practice.correctAnswer", {answer: targetName(question)})
        if (!answer.correct) {
            choiceText = t("practice.yourAnswer", {answer: "interval" in answer.choice ? intervalName(answer.choice.interval) : noteName(answer.choice.spot.midi)})
        }
    }

    // "Hear my choice" by ear: the same first note with the interval that was picked.
    const hearChoice = () => {
        if (!question || !answer || !("interval" in answer.choice)) return
        const picked = levelIntervals("all").find(interval => interval.id === (answer.choice as {interval: string}).interval)
        if (!picked) return
        const second = question.reference.midi + (question.direction === "up" ? picked.semitones : -picked.semitones)
        if (playback === "together") audio.chord([question.reference.midi, second])
        else audio.sequence([question.reference.midi, second])
    }

    return (
        <PracticeShell
            title={t("practice.intervals.title")}
            description={t("practice.intervals.description")}
            session={session}
            levelLabel={t("practice.mode")}
            levels={INTERVAL_MODES.map(value => ({value, label: t(`practice.intervals.modes.${value}`)}))}
            level={mode}
            onLevel={reset(setMode)}
            extraControls={(
                <>
                    <span className="text-xs font-semibold tracking-wide text-base-500 uppercase sm:ml-2">{t("practice.level")}</span>
                    <Segmented label={t("practice.level")} value={level} onChange={reset(setLevel)} options={INTERVAL_LEVELS.map(value => ({value, label: t(`practice.intervals.levels.${value}`)}))}/>
                    {/* The custom level: one toggle per interval, on its own line. */}
                    {level === "custom" && (
                        <div role="group" aria-label={t("practice.intervals.customLabel")} className="flex w-full flex-wrap items-center gap-1.5 pt-1">
                            <span className="mr-1 text-xs text-base-500">{t("practice.intervals.customLabel")}</span>
                            {PRACTICE_INTERVALS.map(interval => {
                                const isOn = custom.includes(interval.id)
                                return (
                                    <button
                                        key={interval.id}
                                        type="button"
                                        aria-pressed={isOn}
                                        title={intervalName(interval.id)}
                                        onClick={() => toggleCustom(interval.id)}
                                        className={cn(
                                            "h-9 min-w-11 border px-2.5 text-sm font-semibold tabular-nums transition-colors pointer-coarse:h-11",
                                            isOn ? "border-brand-600 bg-brand-600 text-on-brand" : "border-base-200 text-base-600 hover:border-dashed hover:border-brand-600 dark:border-base-800 dark:text-base-400",
                                        )}
                                    >
                                        {interval.label}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                    {mode === "ear" && (
                        <>
                            <span className="text-xs font-semibold tracking-wide text-base-500 uppercase sm:ml-2">{t("practice.intervals.playback")}</span>
                            <Segmented label={t("practice.intervals.playback")} value={playback} onChange={reset(setPlayback)} options={INTERVAL_PLAYBACKS.map(value => ({value, label: t(`practice.intervals.playbacks.${value}`)}))}/>
                        </>
                    )}
                </>
            )}
            onStart={session.start}
            startBlocked={tooFew ? t(mode === "ear" ? "practice.intervals.needTwo" : "practice.intervals.needOne") : undefined}
            startHint={t(mode === "ear" ? "practice.intervals.startHintEar" : "practice.intervals.startHintBuild")}
            prompt={prompt}
            onReplay={play}
            correctText={correctText}
            choiceText={choiceText}
            answerActions={question && answer && (
                <>
                    {!answer.correct && mode === "ear" && <Button variant="secondary" onClick={hearChoice}><Volume2/>{t("practice.hearChoice")}</Button>}
                    <Button variant="secondary" onClick={playBoth}><Volume2/>{t("practice.hearAnswer")}</Button>
                </>
            )}
            formatItem={intervalName}
        >
            {mode === "ear" && question && (
                <div role="group" aria-label={prompt} className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {pool.map(interval => {
                        const isAnswer = answer && interval.id === question.interval.id
                        const isWrongPick = answer && !answer.correct && "interval" in answer.choice && answer.choice.interval === interval.id
                        return (
                            <button
                                key={interval.id}
                                type="button"
                                onClick={() => pickInterval(interval.id)}
                                disabled={Boolean(answer)}
                                className={cn(
                                    "flex min-h-14 items-center justify-between gap-3 border px-4 py-2 text-left transition-colors duration-200",
                                    isAnswer ? "border-emerald-600 bg-emerald-600 text-white"
                                        : isWrongPick ? "border-rose-600 bg-rose-600 text-white"
                                        : "border-base-200 hover:border-dashed hover:border-brand-600 disabled:opacity-60 disabled:hover:border-solid disabled:hover:border-base-200 dark:border-base-800 dark:disabled:hover:border-base-800",
                                )}
                            >
                                <span className="font-semibold">{intervalName(interval.id)}</span>
                                <span className={cn("text-sm font-bold tabular-nums", isAnswer || isWrongPick ? "opacity-90" : "text-base-500")}>{interval.label}</span>
                            </button>
                        )
                    })}
                </div>
            )}

            {/* Building, the instrument is the answer pad; by ear it shows both notes once answered. */}
            {(mode === "build" || answer) && question && (
                <InstrumentAnswer
                    instrument={instrument}
                    litSpot={question.reference}
                    revealLit={mode === "build" || Boolean(answer)}
                    correctNote={answer ? spellingOf(question.target.midi) : undefined}
                    correctMidi={answer ? question.target.midi : undefined}
                    wrongSpot={answer && !answer.correct && "spot" in answer.choice ? answer.choice.spot : undefined}
                    onPick={pickSpot}
                    ariaLabel={prompt}
                />
            )}
        </PracticeShell>
    )
}
