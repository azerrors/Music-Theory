import type {Instrument} from "@/hooks/useInstrument"

export interface InstrumentArt {
    src: string
    /** CSS mask size and position on wide screens and on phones. */
    size: string
    position: string
    mobileSize: string
    mobilePosition: string
}

/**
 * Line drawings: white lines on black, meant to be used as a luminance mask over a
 * plain colour, so the lines take the theme's colour (and the accent on hover).
 */
export const INSTRUMENT_ART: Record<Instrument, InstrumentArt> = {
    guitar: {src: "/art/guitar.png", size: "125% auto", position: "30% 50%", mobileSize: "190% auto", mobilePosition: "30% 15%"},
    piano: {src: "/art/piano.webp", size: "100% auto", position: "50% 40%", mobileSize: "130% auto", mobilePosition: "40% 15%"},
}
