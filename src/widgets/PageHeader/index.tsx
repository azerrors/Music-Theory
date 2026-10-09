import type {ReactNode} from "react"

interface PageHeaderProps {
    title: ReactNode
    description?: ReactNode
    actions?: ReactNode
}

export function PageHeader({title, description, actions}: PageHeaderProps) {
    return (
        <header className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl space-y-1.5">
                <h1 className="text-3xl font-bold tracking-tight text-balance">{title}</h1>
                {description && <p className="text-stone-600 text-pretty dark:text-stone-400">{description}</p>}
            </div>
            {actions && <div className="flex gap-2">{actions}</div>}
        </header>
    )
}
