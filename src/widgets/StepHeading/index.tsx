import type {ReactNode} from "react"

interface StepHeadingProps {
    number: number
    title: ReactNode
    /** Actions on the right, e.g. play buttons. */
    children?: ReactNode
}

/** Numbered section title for pages that walk through a few steps. */
export function StepHeading({number, title, children}: StepHeadingProps) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-3 text-xl font-semibold tracking-tight">
                <span className="grid size-7 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">{number}</span>
                {title}
            </h2>
            {children}
        </div>
    )
}
