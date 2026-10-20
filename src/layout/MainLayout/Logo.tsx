/*
 * The mark: a guitar pick with a string down its middle and a little keyboard across it, guitar
 * and piano in one shape. /logo.png is white lines on transparent; it is used as a mask, so the
 * lines take the accent's light tint on the accent tile, whichever accent is picked.
 */
export function Logo() {
    return (
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-strong" aria-hidden>
            <span
                className="size-7 bg-brand-100"
                style={{maskImage: "url(/logo.png)", maskSize: "contain", maskRepeat: "no-repeat", maskPosition: "center"}}
            />
        </span>
    )
}
