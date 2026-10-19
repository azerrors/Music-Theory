import {useCallback, useMemo, useState} from "react"
import {useTranslation} from "react-i18next"
import {ROOT_NOTES} from "@/constants/notes"
import {useInstrument} from "@/hooks/useInstrument"
import {usePracticeSession} from "@/hooks/usePracticeSession"
import {useSettings} from "@/hooks/useSettings"
import {FIND_MODES, findQuestion, guitarSpots, pianoSpots, spellingOf, type FindMode, type FindQuestion, type Spot} from "@/lib/practice/questions"
import {chroma, formatNote, mod12} from "@/lib/theory/notes"
import {cn} from "@/lib/utils"
import type {NoteName} from "@/types/music"
import {practiceAudio} from "@/widgets/practice/audio"
import {FRET_COUNT, InstrumentAnswer, PIANO_FROM, PIANO_TO} from "@/widgets/practice/InstrumentAnswer"
import {PracticeShell} from "@/widgets/practice/PracticeShell"

/** What was picked: a place on the instrument (find mode) or a note name (name mode). */
type Choice = {spot: Spot} | {note: NoteName}

/**
 * Two ways round: "find" names a note and asks for its place on the neck or keys;
 * "name" lights a place and asks for its note.
 */
export default function FindNotePracticePage() {
    const {t} = useTranslation()
    const {notation, tuning} = useSettings()
    const instrument = useInstrument()
    const audio = practiceAudio(instrument)
    const [mode, setMode] = useState<FindMode>("tap")
    const spots = useMemo(() => (instrument === "guitar" ? guitarSpots(tuning, FRET_COUNT) : pianoSpots(PIANO_FROM, PIANO_TO)), [instrument, tuning])

    const makeQuestion = useCallback(
        (stats: Parameters<typeof findQuestion>[2], previous: string | undefined) => findQuestion(mode, spots, stats, previous),
        [mode, spots],
    )
    const session = usePracticeSession<FindQuestion, Choice>({exercise: `${instrument}:find:${mode}`, level: mode, makeQuestion, itemOf: question => question.note})
    const {question, answer} = session
    const name = (note: NoteName) => formatNote(note, notation)

    const pickSpot = (spot: Spot) => {
        if (!question) return
        audio.note(spot.midi)
        if (!answer && mode === "tap") session.submit(mod12(spot.midi) === chroma(question.note), {spot})
    }

    const pickName = (note: NoteName) => {
        if (!question?.spot || answer) return
        audio.note(question.spot.midi)
        session.submit(chroma(note) === chroma(question.note), {note})
    }

    const changeMode = (next: FindMode) => {
        setMode(next)
        session.reset()
    }

    const prompt = !question ? "" : mode === "tap"
        ? t(instrument === "guitar" ? "practice.find.promptTapGuitar" : "practice.find.promptTapPiano", {note: name(question.note)})
        : t("practice.find.promptName")

    const choice = answer?.choice
    const choiceName = choice ? ("note" in choice ? choice.note : spellingOf(choice.spot.midi)) : undefined

    return (
        <PracticeShell
            title={t("practice.find.title")}
            description={t("practice.find.description")}
            session={session}
            levelLabel={t("practice.mode")}
            levels={FIND_MODES.map(value => ({value, label: t(`practice.find.modes.${value}`)}))}
            level={mode}
            onLevel={changeMode}
            onStart={session.start}
            startHint={t("practice.find.startHint")}
            prompt={prompt}
            correctText={question && answer ? t("practice.correctAnswer", {answer: name(question.note)}) : undefined}
            choiceText={choiceName ? t("practice.yourAnswer", {answer: name(choiceName)}) : undefined}
            formatItem={name}
        >
            <InstrumentAnswer
                instrument={instrument}
                correctNote={answer ? question?.note : undefined}
                wrongSpot={choice && "spot" in choice && !answer?.correct ? choice.spot : undefined}
                litSpot={mode === "name" ? question?.spot : undefined}
                revealLit={Boolean(answer)}
                onPick={pickSpot}
                ariaLabel={prompt}
            />

            {mode === "name" && (
                <div role="group" aria-label={t("practice.find.promptName")} className="grid grid-cols-6 gap-2 sm:grid-cols-12">
                    {ROOT_NOTES.map(note => {
                        const isAnswer = answer && chroma(note) === chroma(question?.note ?? "")
                        const isWrongPick = answer && !answer.correct && choice && "note" in choice && choice.note === note
                        return (
                            <button
                                key={note}
                                type="button"
                                onClick={() => pickName(note)}
                                disabled={Boolean(answer)}
                                className={cn(
                                    "h-11 border text-sm font-semibold transition-colors",
                                    isAnswer ? "border-emerald-600 bg-emerald-600 text-white"
                                        : isWrongPick ? "border-rose-600 bg-rose-600 text-white"
                                        : "border-base-200 hover:border-dashed hover:border-brand-600 hover:text-brand-700 disabled:opacity-50 dark:border-base-800 dark:hover:text-brand-300",
                                )}
                            >
                                {name(note)}
                            </button>
                        )
                    })}
                </div>
            )}
        </PracticeShell>
    )
}
