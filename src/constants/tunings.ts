import type {Tuning} from "@/types/music"

export const TUNINGS: Tuning[] = [
    {id: "standard", strings: ["E2", "A2", "D3", "G3", "B3", "E4"]},
    {id: "dropD", strings: ["D2", "A2", "D3", "G3", "B3", "E4"]},
    {id: "halfStepDown", strings: ["Eb2", "Ab2", "Db3", "Gb3", "Bb3", "Eb4"]},
    {id: "dadgad", strings: ["D2", "A2", "D3", "G3", "A3", "D4"]},
    {id: "openG", strings: ["D2", "G2", "D3", "G3", "B3", "D4"]},
]

export const STANDARD_TUNING = TUNINGS[0]!
