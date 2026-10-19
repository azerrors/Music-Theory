export function Logo() {
    return (
        <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden>
            <rect width="32" height="32" rx="8" className="fill-brand-strong"/>
            <g className="stroke-brand-100" strokeWidth="1.6">
                <path d="M9 6v20M13 6v20M17 6v20M21 6v20"/>
                <path d="M7 11h16M7 16h16M7 21h16" strokeOpacity=".5"/>
            </g>
            <circle cx="17" cy="13.5" r="2.6" className="fill-brand-100"/>
        </svg>
    )
}
