import {useEffect, useRef, useState, type ReactNode} from "react"
import {cn} from "@/lib/utils"

interface RenderWhenNearProps {
    children: ReactNode
    /** Height held while the content isn't built yet, so the scrollbar doesn't jump. */
    placeholderHeight: number
    className?: string
}

/** How far below the screen to start building a section, so it is ready before it scrolls in. */
const LOOK_AHEAD = "800px"

/**
 * Builds its children only once they come near the screen, then keeps them. Long pages of chord
 * pictures (~200 cards, ~15 000 elements) otherwise stall a phone for seconds on first render.
 */
export function RenderWhenNear({children, placeholderHeight, className}: RenderWhenNearProps) {
    const ref = useRef<HTMLDivElement>(null)
    // No observer (very old browsers, some test setups): just render straight away.
    const [isNear, setIsNear] = useState(() => typeof IntersectionObserver === "undefined")

    useEffect(() => {
        const element = ref.current
        if (!element || isNear) return
        const observer = new IntersectionObserver(entries => {
            if (entries.some(entry => entry.isIntersecting)) setIsNear(true)
        }, {rootMargin: `${LOOK_AHEAD} 0px`})
        observer.observe(element)
        return () => observer.disconnect()
    }, [isNear])

    return (
        <div ref={ref} className={cn(className)} style={isNear ? undefined : {minHeight: placeholderHeight}}>
            {isNear && children}
        </div>
    )
}
