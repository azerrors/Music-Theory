/**
 * Practice progress, kept in localStorage under one versioned key. Only totals are stored (right
 * and wrong per item, best score per level, the last few sessions), so the size stays a few KB
 * however long someone practises.
 */

export interface ItemStat {
    right: number
    wrong: number
}

export interface ExerciseStats {
    /** Best score per level, out of the session length. */
    best: Record<string, number>
    sessions: number
    /** Per question item (a note, a key on the circle…). */
    items: Record<string, ItemStat>
}

export interface SessionRecord {
    exercise: string
    level: string
    score: number
    total: number
    at: number
}

export interface PracticeStore {
    version: 1
    exercises: Record<string, ExerciseStats>
    history: SessionRecord[]
}

export const STORE_KEY = "practice:v1"
export const HISTORY_LIMIT = 50

export const emptyStore = (): PracticeStore => ({version: 1, exercises: {}, history: []})
const emptyExercise = (): ExerciseStats => ({best: {}, sessions: 0, items: {}})

export function readStore(storage: Pick<Storage, "getItem"> = localStorage): PracticeStore {
    try {
        const parsed = JSON.parse(storage.getItem(STORE_KEY) ?? "null") as PracticeStore | null
        return parsed?.version === 1 ? parsed : emptyStore()
    } catch {
        return emptyStore()
    }
}

export function writeStore(store: PracticeStore, storage: Pick<Storage, "setItem"> = localStorage): void {
    try {
        storage.setItem(STORE_KEY, JSON.stringify(store))
    } catch {
        // Private mode or a full quota: progress simply isn't kept.
    }
}

export function exerciseStats(store: PracticeStore, exercise: string): ExerciseStats {
    return store.exercises[exercise] ?? emptyExercise()
}

/** The store with one more answer counted for `item`. */
export function recordAnswer(store: PracticeStore, exercise: string, item: string, correct: boolean): PracticeStore {
    const stats = exerciseStats(store, exercise)
    const before = stats.items[item] ?? {right: 0, wrong: 0}
    const after = correct ? {...before, right: before.right + 1} : {...before, wrong: before.wrong + 1}
    return {...store, exercises: {...store.exercises, [exercise]: {...stats, items: {...stats.items, [item]: after}}}}
}

/** The store with a finished session: the best score for its level, and a capped history. */
export function recordSession(store: PracticeStore, session: SessionRecord): PracticeStore {
    const stats = exerciseStats(store, session.exercise)
    const best = Math.max(stats.best[session.level] ?? 0, session.score)
    return {
        ...store,
        exercises: {...store.exercises, [session.exercise]: {...stats, sessions: stats.sessions + 1, best: {...stats.best, [session.level]: best}}},
        history: [session, ...store.history].slice(0, HISTORY_LIMIT),
    }
}

/**
 * How often an item should come up: missed items more, mastered ones less, never zero.
 * An unseen item weighs 1.
 */
export function itemWeight(stat: ItemStat | undefined): number {
    if (!stat) return 1
    const ratio = (stat.wrong + 1) / (stat.right + 1)
    return Math.min(4, Math.max(0.4, ratio))
}

/** The items someone misses most, worst first; only items answered at least twice. */
export function weakestItems(stats: ExerciseStats, limit = 3): string[] {
    return Object.entries(stats.items)
        .filter(([, stat]) => stat.right + stat.wrong >= 2 && stat.wrong > 0)
        .sort(([, a], [, b]) => b.wrong / (b.right + b.wrong) - a.wrong / (a.right + a.wrong))
        .slice(0, limit)
        .map(([item]) => item)
}
