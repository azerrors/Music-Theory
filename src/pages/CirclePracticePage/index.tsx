import {useCallback, useState} from "react"
import {useTranslation} from "react-i18next"
import {useInstrument} from "@/hooks/useInstrument"
import {usePracticeSession} from "@/hooks/usePracticeSession"
import {useSettings} from "@/hooks/useSettings"
import {CIRCLE_LEVELS, circleQuestion, sameSlot, slotKey, slotNote, type CircleLevel, type CircleQuestion, type CircleSlot} from "@/lib/practice/questions"
import {CIRCLE_MAJORS, keySignature} from "@/lib/theory/circle"
import {chroma, formatNote} from "@/lib/theory/notes"
import {CircleWheel, type SlotTone} from "@/widgets/CircleWheel"
import {ringLabel} from "@/widgets/CircleWheel/geometry"
import {practiceAudio} from "@/widgets/practice/audio"
import {PracticeShell} from "@/widgets/practice/PracticeShell"

/** The tonic triad of a key, played after each answer so the key is heard as well as seen. */
function triad(slot: CircleSlot, base: number): number[] {
    const root = base + chroma(slotNote(slot))
    return [root, root + (slot.ring === "major" ? 4 : 3), root + 7]
}

/** The slice a question starts from, when it has one: shown even with names hidden. */
function startSlot(question: CircleQuestion): CircleSlot | undefined {
    if (question.kind === "steps") return {ring: "major", index: CIRCLE_MAJORS.indexOf(question.from)}
    if (question.kind === "relative") return {ring: question.fromRing, index: question.answer.index}
    return undefined
}

/** Steps round the circle, keys by their signature, and relative keys, answered on the circle itself. */
export default function CirclePracticePage() {
    const {t} = useTranslation()
    const {notation} = useSettings()
    const instrument = useInstrument()
    const audio = practiceAudio(instrument)
    const [level, setLevel] = useState<CircleLevel>("labels")

    const makeQuestion = useCallback(
        (stats: Parameters<typeof circleQuestion>[0], previous: string | undefined) => circleQuestion(stats, previous),
        [],
    )
    const session = usePracticeSession<CircleQuestion, CircleSlot>({exercise: `${instrument}:circle`, level, makeQuestion, itemOf: question => slotKey(question.answer)})
    const {question, answer} = session
    const name = (note: string) => formatNote(note, notation)
    const label = (slot: CircleSlot) => ringLabel(slot.ring, slot.index, notation)

    const pick = (slot: CircleSlot) => {
        if (!question || answer) return
        audio.chord(triad(question.answer, instrument === "guitar" ? 48 : 60))
        session.submit(sameSlot(slot, question.answer), slot)
    }

    const changeLevel = (next: CircleLevel) => {
        setLevel(next)
        session.reset()
    }

    let prompt = ""
    if (question?.kind === "steps") {
        prompt = t(question.direction === "clockwise" ? "practice.circle.stepsClockwise" : "practice.circle.stepsCounter", {from: name(question.from), steps: question.steps})
    } else if (question?.kind === "signature") {
        const {type, count} = question.signature
        prompt = type === "none" ? t("practice.circle.signatureNone") : t(type === "sharp" ? "practice.circle.signatureSharp" : "practice.circle.signatureFlat", {count})
    } else if (question?.kind === "relative") {
        prompt = t(question.fromRing === "major" ? "practice.circle.relativeToMinor" : "practice.circle.relativeToMajor", {from: name(question.from)})
    }

    const start = question ? startSlot(question) : undefined
    const toneOf = (slot: CircleSlot): SlotTone | undefined => {
        if (answer && question && sameSlot(slot, question.answer)) return "right"
        if (answer && !answer.correct && sameSlot(slot, answer.choice)) return "wrong"
        if (start && sameSlot(slot, start)) return "from"
        return undefined
    }
    const labelOf = (slot: CircleSlot) => (level === "labels" || toneOf(slot) ? label(slot) : null)

    // The hub: "?" while asking; then the answer's key signature.
    let center = "?"
    if (answer && question) {
        const signature = keySignature(slotNote(question.answer), question.answer.ring)
        center = signature.type === "none" ? "0" : `${signature.count}${signature.type === "sharp" ? "♯" : "♭"}`
    }

    return (
        <PracticeShell
            title={t("practice.circle.title")}
            description={t("practice.circle.description")}
            session={session}
            levelLabel={t("practice.level")}
            levels={CIRCLE_LEVELS.map(value => ({value, label: t(`practice.circle.levels.${value}`)}))}
            level={level}
            onLevel={changeLevel}
            onStart={session.start}
            startHint={t("practice.circle.startHint")}
            prompt={prompt}
            correctText={question && answer ? t("practice.correctAnswer", {answer: label(question.answer)}) : undefined}
            choiceText={answer ? t("practice.yourAnswer", {answer: label(answer.choice)}) : undefined}
            formatItem={item => {
                const [ring, index] = item.split(":")
                return label({ring: ring === "minor" ? "minor" : "major", index: Number(index)})
            }}
        >
            <CircleWheel labelOf={labelOf} toneOf={toneOf} onPick={answer ? undefined : pick} center={center} ariaLabel={prompt}/>
        </PracticeShell>
    )
}
