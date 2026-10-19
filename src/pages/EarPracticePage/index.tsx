import {useCallback, useEffect, useMemo, useState} from "react"
import {useTranslation} from "react-i18next"
import {Volume2} from "lucide-react"
import {Button} from "@/components/ui/button"
import {Segmented} from "@/components/ui/segmented"
import {useInstrument} from "@/hooks/useInstrument"
import {usePracticeSession} from "@/hooks/usePracticeSession"
import {useSettings} from "@/hooks/useSettings"
import {EAR_LEVELS, EAR_MATCHES, earQuestion, guitarSpots, pianoSpots, spellingOf, type EarLevel, type EarMatch, type EarQuestion, type Spot} from "@/lib/practice/questions"
import {chroma, formatNote, mod12} from "@/lib/theory/notes"
import {practiceAudio} from "@/widgets/practice/audio"
import {FRET_COUNT, InstrumentAnswer, PIANO_FROM, PIANO_TO} from "@/widgets/practice/InstrumentAnswer"
import {PracticeShell} from "@/widgets/practice/PracticeShell"

/** Piano questions stay between C2 and C7: the outer keys are hard to hear apart. */
const PIANO_QUESTION_RANGE = [36, 96] as const

/** "G3": the note with its octave, for the exact-pitch answers. */
const octaveOf = (midi: number) => Math.floor(midi / 12) - 1

/**
 * Hear the lit note, then another one up to an octave away; find the second on the instrument.
 * Both start anywhere on the neck or keys, and the first is never named until the answer.
 */
export default function EarPracticePage() {
    const {t} = useTranslation()
    const {notation, tuning} = useSettings()
    const instrument = useInstrument()
    const audio = practiceAudio(instrument)
    const [level, setLevel] = useState<EarLevel>("natural")
    const [match, setMatch] = useState<EarMatch>("note")

    const questionSpots = useMemo(() => (instrument === "guitar"
        ? guitarSpots(tuning, FRET_COUNT)
        : pianoSpots(Math.max(PIANO_FROM, PIANO_QUESTION_RANGE[0]), Math.min(PIANO_TO, PIANO_QUESTION_RANGE[1]))), [instrument, tuning])

    const makeQuestion = useCallback(
        (stats: Parameters<typeof earQuestion>[2], previous: string | undefined) => earQuestion(level, questionSpots, stats, previous),
        [level, questionSpots],
    )
    const session = usePracticeSession<EarQuestion, Spot>({exercise: `${instrument}:ear`, level: `${level}:${match}`, makeQuestion, itemOf: question => question.note})
    const {question, answer} = session

    const play = useCallback(() => {
        if (question) audio.sequence([question.reference.midi, question.target.midi])
    }, [question, audio])

    // Each new question plays by itself; the first one waits for the Start click.
    useEffect(() => {
        if (question && !answer) play()
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the question changes
    }, [question])

    const isRight = (spot: Spot) => question !== null && (match === "pitch" ? spot.midi === question.target.midi : mod12(spot.midi) === chroma(question.note))

    const pick = (spot: Spot) => {
        if (!question) return
        audio.note(spot.midi)
        if (!answer) session.submit(isRight(spot), spot)
    }

    const changeLevel = (next: EarLevel) => {
        setLevel(next)
        session.reset()
    }
    const changeMatch = (next: EarMatch) => {
        setMatch(next)
        session.reset()
    }

    const name = (note: string) => formatNote(note, notation)
    // Exact-pitch answers name the octave too (G3), so a right note in the wrong octave is clear.
    const spotName = (midi: number) => `${name(spellingOf(midi))}${match === "pitch" ? octaveOf(midi) : ""}`

    return (
        <PracticeShell
            title={t("practice.ear.title")}
            description={t("practice.ear.description")}
            session={session}
            levelLabel={t("practice.level")}
            levels={EAR_LEVELS.map(value => ({value, label: t(`practice.ear.levels.${value}`)}))}
            level={level}
            onLevel={changeLevel}
            extraControls={(
                <>
                    <span className="text-xs font-semibold tracking-wide text-base-500 uppercase sm:ml-2">{t("practice.ear.match")}</span>
                    <Segmented
                        label={t("practice.ear.match")}
                        value={match}
                        onChange={changeMatch}
                        options={EAR_MATCHES.map(value => ({value, label: t(`practice.ear.matches.${value}`)}))}
                    />
                </>
            )}
            onStart={session.start}
            startHint={t("practice.ear.startHint")}
            prompt={t("practice.ear.prompt")}
            onReplay={play}
            correctText={question && answer ? t("practice.correctAnswer", {answer: spotName(question.target.midi)}) : undefined}
            choiceText={answer ? t("practice.yourAnswer", {answer: spotName(answer.choice.midi)}) : undefined}
            answerActions={question && answer && !answer.correct && (
                <>
                    <Button variant="secondary" onClick={() => audio.note(answer.choice.midi)}><Volume2/>{t("practice.hearChoice")}</Button>
                    <Button variant="secondary" onClick={() => audio.note(question.target.midi)}><Volume2/>{t("practice.hearAnswer")}</Button>
                </>
            )}
            formatItem={name}
        >
            <InstrumentAnswer
                instrument={instrument}
                litSpot={question?.reference}
                litLabel="♪"
                revealLit={Boolean(answer)}
                correctNote={answer ? question?.note : undefined}
                correctMidi={answer && match === "pitch" ? question?.target.midi : undefined}
                wrongSpot={answer && !answer.correct ? answer.choice : undefined}
                onPick={pick}
                ariaLabel={t("practice.ear.prompt")}
            />
        </PracticeShell>
    )
}
