import {Loader2, Volume2} from "lucide-react"
import {useTranslation} from "react-i18next"
import {Button, type ButtonProps} from "@/components/ui/button"
import type {Instrument} from "@/hooks/useInstrument"
import {usePianoPlayer} from "@/hooks/usePianoPlayer"
import {usePlayer} from "@/hooks/usePlayer"

interface PlayButtonProps extends Omit<ButtonProps, "onClick"> {
    midi: number[]
    /** "strum" plays a chord, "arpeggio" plays the notes one by one. */
    mode?: "strum" | "arpeggio"
    instrument?: Instrument
    label?: string
}

export function PlayButton({midi, mode = "strum", instrument = "guitar", label, variant = "secondary", size = "sm", ...props}: PlayButtonProps) {
    const {t} = useTranslation()
    const guitar = usePlayer()
    const piano = usePianoPlayer()
    const isLoading = instrument === "piano" ? piano.isLoading : guitar.isLoading

    const play = () => {
        if (instrument === "piano") void (mode === "strum" ? piano.chord(midi) : piano.arpeggio(midi))
        else void (mode === "strum" ? guitar.strum(midi) : guitar.arpeggiate(midi))
    }

    return (
        <Button variant={variant} size={size} onClick={play} disabled={midi.length === 0} {...props}>
            {isLoading ? <Loader2 className="animate-spin"/> : <Volume2/>}
            {label ?? t("actions.play")}
        </Button>
    )
}
