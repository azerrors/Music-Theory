import {useCallback, useState} from "react"
import {exerciseStats, readStore, recordAnswer, recordSession, writeStore, type ExerciseStats, type PracticeStore} from "@/lib/practice/stats"

export const SESSION_LENGTH = 10

export interface Answer<C> {
    correct: boolean
    /** What was picked, for "hear my choice" and the feedback line. */
    choice: C
}

interface Options<Q> {
    /** Stats key, e.g. "guitar:ear": progress is kept per instrument and exercise. */
    exercise: string
    level: string
    makeQuestion: (stats: ExerciseStats, previousItem: string | undefined) => Q
    /** The item a question is about (a note, a key on the circle), for per-item stats. */
    itemOf: (question: Q) => string
}

/**
 * One practice session: a fixed run of questions, each answered once. Answers are counted per
 * item and the finished session's score is kept, so later sessions ask weak items more often.
 */
export function usePracticeSession<Q, C>({exercise, level, makeQuestion, itemOf}: Options<Q>) {
    const [store, setStore] = useState<PracticeStore>(() => readStore())
    const [started, setStarted] = useState(false)
    const [question, setQuestion] = useState<Q | null>(null)
    const [answer, setAnswer] = useState<Answer<C> | null>(null)
    const [results, setResults] = useState<boolean[]>([])
    const [streak, setStreak] = useState(0)
    const [finished, setFinished] = useState(false)
    const [newBest, setNewBest] = useState(false)

    const stats = exerciseStats(store, exercise)
    const best = stats.best[level] ?? 0

    const save = (next: PracticeStore) => {
        setStore(next)
        writeStore(next)
    }

    const start = useCallback(() => {
        setStarted(true)
        setFinished(false)
        setNewBest(false)
        setResults([])
        setStreak(0)
        setAnswer(null)
        setQuestion(makeQuestion(exerciseStats(readStore(), exercise), undefined))
    }, [exercise, makeQuestion])

    /** Back to the start screen, e.g. when the level changes mid-session. */
    const reset = useCallback(() => {
        setStarted(false)
        setFinished(false)
        setQuestion(null)
        setAnswer(null)
        setResults([])
        setStreak(0)
    }, [])

    const submit = (correct: boolean, choice: C) => {
        if (!question || answer) return
        setAnswer({correct, choice})
        setResults(previous => [...previous, correct])
        setStreak(previous => (correct ? previous + 1 : 0))
        save(recordAnswer(store, exercise, itemOf(question), correct))
    }

    const next = () => {
        if (!question || !answer) return
        if (results.length >= SESSION_LENGTH) {
            const score = results.filter(Boolean).length
            setNewBest(score > best)
            save(recordSession(store, {exercise, level, score, total: SESSION_LENGTH, at: Date.now()}))
            setFinished(true)
            return
        }
        setAnswer(null)
        setQuestion(makeQuestion(stats, itemOf(question)))
    }

    return {
        started, finished, question, answer, results, streak, best, newBest, stats,
        score: results.filter(Boolean).length,
        total: SESSION_LENGTH,
        start, reset, submit, next,
    }
}
