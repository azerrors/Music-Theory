import {useCallback, useEffect, useState} from "react"
import {useTranslation} from "react-i18next"
import {Segmented} from "@/components/ui/segmented"
import {CHORD_TYPES} from "@/constants/chordTypes"
import {useInstrument} from "@/hooks/useInstrument"
import {usePracticeSession} from "@/hooks/usePracticeSession"
import {useSettings} from "@/hooks/useSettings"
import {chordMidi, KEY_LEVELS, KEY_PUZZLE_MODES, PUZZLES, sameChord, type KeyLevel, type KeyPuzzle, type KeyPuzzleMode, type PuzzleChord, type PuzzleKey} from "@/lib/practice/keys"
import {sameSlot, slotKey, type CircleSlot} from "@/lib/practice/questions"
import {formatNote} from "@/lib/theory/notes"
import {cn} from "@/lib/utils"
import {CircleWheel, type SlotTone} from "@/widgets/CircleWheel"
import {ringLabel} from "@/widgets/CircleWheel/geometry"
import {practiceAudio} from "@/widgets/practice/audio"
import {PracticeShell} from "@/widgets/practice/PracticeShell"

/** What was picked: a key on the circle, or one of the chord tiles. */
type Choice = {slot: CircleSlot} | {chord: number}

/** Chords sound around C3 on guitar and C4 on piano. */
const CHORD_BASE = {guitar: 48, piano: 60} as const

/** One chord as a tile: its name large, its Roman numeral once revealed; it plays when pressed. */
function ChordTile({name, roman, tone, onClick, disabled}: {name: string; roman?: string; tone?: "right" | "wrong" | "hidden"; onClick?: () => void; disabled?: boolean}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "flex min-h-20 w-full flex-col items-center justify-center gap-1 border px-3 py-3 transition-colors duration-200",
                tone === "right" ? "border-emerald-600 bg-emerald-600 text-white"
                    : tone === "wrong" ? "border-rose-600 bg-rose-600 text-white"
                    : tone === "hidden" ? "border-dashed border-brand-600 text-brand-700 dark:text-brand-300"
                    : "border-base-200 hover:border-dashed hover:border-brand-600 disabled:hover:border-solid disabled:hover:border-base-200 dark:border-base-800 dark:disabled:hover:border-base-800",
            )}
        >
            <span className="text-lg font-bold tracking-tight sm:text-2xl">{name}</span>
            {roman && <span className={cn("text-xs font-medium", tone ? "opacity-90" : "text-base-500")}>{roman}</span>}
        </button>
    )
}

/**
 * Three key puzzles on the chords of a key: which key a set of chords is in (answered on the
 * circle), the chord that does not belong, and the chord missing from a progression.
 */
export default function KeyPuzzlePracticePage() {
    const {t} = useTranslation()
    const {notation} = useSettings()
    const instrument = useInstrument()
    const audio = practiceAudio(instrument)
    const [mode, setMode] = useState<KeyPuzzleMode>("key")
    const [level, setLevel] = useState<KeyLevel>("major")

    const makeQuestion = useCallback(
        (stats: Parameters<typeof PUZZLES.key>[1], previous: string | undefined) => PUZZLES[mode](level, stats, previous),
        [mode, level],
    )
    const session = usePracticeSession<KeyPuzzle, Choice>({exercise: `${instrument}:keys:${mode}`, level, makeQuestion, itemOf: puzzle => slotKey(puzzle.key.slot)})
    const {question, answer} = session

    const chordName = (chord: PuzzleChord) => formatNote(chord.root, notation) + (CHORD_TYPES.find(type => type.symbol === chord.type)?.suffix ?? "")
    const keyName = (key: PuzzleKey) => `${formatNote(key.tonic, notation)} ${key.mode}`
    const playChord = (chord: PuzzleChord) => audio.chord(chordMidi(chord, CHORD_BASE[instrument]))

    // The sound of the question: the chords one after another (the progression, gap included, in fill mode).
    const play = () => {
        if (!question) return
        const chords = question.kind === "fill" ? question.steps : question.chords
        audio.progression(chords.map(chord => chordMidi(chord, CHORD_BASE[instrument])))
    }

    useEffect(() => {
        if (question && !answer) play()
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the question changes
    }, [question])

    const pickSlot = (slot: CircleSlot) => {
        if (question?.kind !== "key" || answer) return
        session.submit(question.answers.some(right => sameSlot(right, slot)), {slot})
    }
    const pickChord = (index: number, chord: PuzzleChord) => {
        if (!question) return
        playChord(chord)
        if (answer) return
        if (question.kind === "odd") session.submit(index === question.odd, {chord: index})
        if (question.kind === "fill") session.submit(sameChord(question.options[index]!, question.steps[question.hidden]!), {chord: index})
    }

    const changeMode = (next: KeyPuzzleMode) => {
        setMode(next)
        session.reset()
    }
    const changeLevel = (next: KeyLevel) => {
        setLevel(next)
        session.reset()
    }

    // Prompt, the right answer in words, and the body for each kind of puzzle.
    let prompt = ""
    let correctText: string | undefined
    let choiceText: string | undefined
    let body = null

    if (question?.kind === "key") {
        prompt = t("practice.keys.promptKey")
        const labels = question.answers.map(slot => ringLabel(slot.ring, slot.index, notation))
        correctText = answer ? t("practice.correctAnswer", {answer: labels.join(", ")}) : undefined
        if (answer && "slot" in answer.choice && !answer.correct) choiceText = t("practice.yourAnswer", {answer: ringLabel(answer.choice.slot.ring, answer.choice.slot.index, notation)})
        const toneOf = (slot: CircleSlot): SlotTone | undefined => {
            if (!answer) return undefined
            if (question.answers.some(right => sameSlot(right, slot))) return "right"
            if ("slot" in answer.choice && sameSlot(answer.choice.slot, slot)) return "wrong"
            return undefined
        }
        body = (
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {question.chords.map((chord, index) => <ChordTile key={index} name={chordName(chord)} onClick={() => playChord(chord)}/>)}
                </div>
                <CircleWheel
                    labelOf={slot => ringLabel(slot.ring, slot.index, notation)}
                    toneOf={toneOf}
                    onPick={answer ? undefined : pickSlot}
                    center={answer ? "✓" : "?"}
                    ariaLabel={prompt}
                />
                {answer && question.answers.length > 1 && <p className="text-sm text-base-600 dark:text-base-400">{t("practice.keys.manyKeys")}</p>}
            </div>
        )
    } else if (question?.kind === "odd") {
        prompt = t("practice.keys.promptOdd", {key: keyName(question.key)})
        const odd = question.chords[question.odd]!
        correctText = answer ? t("practice.correctAnswer", {answer: chordName(odd)}) : undefined
        if (answer && "chord" in answer.choice && !answer.correct) choiceText = t("practice.yourAnswer", {answer: chordName(question.chords[answer.choice.chord]!)})
        body = (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {question.chords.map((chord, index) => {
                    const picked = answer && "chord" in answer.choice && answer.choice.chord === index
                    return (
                        <ChordTile
                            key={index}
                            name={chordName(chord)}
                            tone={answer ? (index === question.odd ? "right" : picked ? "wrong" : undefined) : undefined}
                            onClick={() => pickChord(index, chord)}
                        />
                    )
                })}
            </div>
        )
    } else if (question?.kind === "fill") {
        prompt = t("practice.keys.promptFill", {key: keyName(question.key)})
        const hidden = question.steps[question.hidden]!
        correctText = answer ? t("practice.correctAnswer", {answer: `${chordName(hidden)} (${hidden.roman})`}) : undefined
        if (answer && "chord" in answer.choice && !answer.correct) choiceText = t("practice.yourAnswer", {answer: chordName(question.options[answer.choice.chord]!)})
        body = (
            <div className="space-y-6">
                {/* The progression, the gap marked with a dashed tile. */}
                <ol className="grid grid-cols-4 gap-2">
                    {question.steps.map((step, index) => (
                        <li key={index}>
                            {index === question.hidden && !answer
                                ? <ChordTile name="?" tone="hidden" disabled/>
                                : <ChordTile name={chordName(step)} roman={step.roman} tone={index === question.hidden ? "right" : undefined} onClick={() => playChord(step)}/>}
                        </li>
                    ))}
                </ol>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                    {question.options.map((option, index) => {
                        const picked = answer && "chord" in answer.choice && answer.choice.chord === index
                        const isAnswer = answer && sameChord(option, hidden)
                        return (
                            <ChordTile
                                key={index}
                                name={chordName(option)}
                                roman={answer ? option.roman : undefined}
                                tone={isAnswer ? "right" : picked ? "wrong" : undefined}
                                onClick={() => pickChord(index, option)}
                            />
                        )
                    })}
                </div>
            </div>
        )
    }

    return (
        <PracticeShell
            title={t("practice.keys.title")}
            description={t("practice.keys.description")}
            session={session}
            levelLabel={t("practice.mode")}
            levels={KEY_PUZZLE_MODES.map(value => ({value, label: t(`practice.keys.modes.${value}`)}))}
            level={mode}
            onLevel={changeMode}
            extraControls={(
                <>
                    <span className="text-xs font-semibold tracking-wide text-base-500 uppercase sm:ml-2">{t("practice.level")}</span>
                    <Segmented
                        label={t("practice.level")}
                        value={level}
                        onChange={changeLevel}
                        options={KEY_LEVELS.map(value => ({value, label: t(`practice.keys.levels.${value}`)}))}
                    />
                </>
            )}
            onStart={session.start}
            startHint={t("practice.keys.startHint")}
            prompt={prompt}
            onReplay={play}
            correctText={correctText}
            choiceText={choiceText}
            formatItem={item => {
                const [ring, index] = item.split(":")
                return ringLabel(ring === "minor" ? "minor" : "major", Number(index), notation)
            }}
        >
            {body}
        </PracticeShell>
    )
}
