import {Loader2, Volume2} from "lucide-react"
import {useTranslation} from "react-i18next"
import {Button, type ButtonProps} from "@/components/ui/button"
import {usePlayer} from "@/hooks/usePlayer"

interface PlayButtonProps extends Omit<ButtonProps, "onClick"> {
    midi: number[]
    /** "strum" plays a chord, "arpeggio" plays the notes one by one. */
    mode?: "strum" | "arpeggio"
    label?: string
}

export function PlayButton({midi, mode = "strum", label, variant = "secondary", size = "sm", ...props}: PlayButtonProps) {
    const {t} = useTranslation()
    const player = usePlayer()

    const play = () => {
        void (mode === "strum" ? player.strum(midi) : player.arpeggiate(midi))
    }

    return (
        <Button variant={variant} size={size} onClick={play} disabled={midi.length === 0} {...props}>
            {player.isLoading ? <Loader2 className="animate-spin"/> : <Volume2/>}
            {label ?? t("actions.play")}
        </Button>
    )
}
