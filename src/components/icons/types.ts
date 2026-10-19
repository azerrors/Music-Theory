import type {ForwardRefExoticComponent, HTMLAttributes, RefAttributes} from "react"

/** What every icon in this folder exposes: start and stop its animation from outside. */
export interface AnimatedIconHandle {
    startAnimation: () => void
    stopAnimation: () => void
}

export type AnimatedIcon = ForwardRefExoticComponent<HTMLAttributes<HTMLDivElement> & {size?: number} & RefAttributes<AnimatedIconHandle>>
