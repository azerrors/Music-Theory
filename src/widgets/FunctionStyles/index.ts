import type {HarmonicFunction} from "@/lib/theory/progressions"

export const FUNCTIONS: HarmonicFunction[] = ["tonic", "subdominant", "dominant"]

/** One colour per harmonic function: a bar over each chord, a chip in tables and legends. */
export const FUNCTION_STYLES: Record<HarmonicFunction, {bar: string; chip: string}> = {
    tonic: {bar: "bg-amber-400", chip: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"},
    subdominant: {bar: "bg-teal-500", chip: "bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-200"},
    dominant: {bar: "bg-rose-500", chip: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200"},
}
