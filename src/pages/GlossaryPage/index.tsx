import {useEffect, useState} from "react"
import {Link, useLocation} from "react-router"
import {useTranslation} from "react-i18next"
import {ArrowRight, Search} from "lucide-react"
import {Card} from "@/components/ui/card"
import {GLOSSARY_GROUPS, GLOSSARY_TERMS} from "@/constants/glossary"
import {cn} from "@/lib/utils"
import {PageHeader} from "@/widgets/PageHeader"
import {ExampleButton} from "@/widgets/Term"

export default function GlossaryPage() {
    const {t} = useTranslation("glossary")
    const {hash} = useLocation()
    const [query, setQuery] = useState("")
    const highlighted = decodeURIComponent(hash.replace(/^#/, ""))

    // Links from a term popover land here with #termId; scroll that card into view.
    useEffect(() => {
        if (!highlighted) return
        document.getElementById(highlighted)?.scrollIntoView({behavior: "smooth", block: "center"})
    }, [highlighted])

    const needle = query.trim().toLocaleLowerCase()
    const matches = GLOSSARY_TERMS.filter(term =>
        !needle || `${t(`terms.${term.id}.title`)} ${t(`terms.${term.id}.body`)}`.toLocaleLowerCase().includes(needle),
    )

    return (
        <div className="space-y-8">
            <PageHeader title={t("title")} description={t("description")}/>

            <label className="relative block max-w-md">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400"/>
                <input
                    type="search"
                    value={query}
                    onChange={event => setQuery(event.target.value)}
                    placeholder={t("search")}
                    aria-label={t("search")}
                    className="h-10 w-full rounded-lg border border-stone-300 bg-white pr-3 pl-9 text-sm hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900"
                />
            </label>

            {matches.length === 0 && <p className="text-sm text-stone-500">{t("searchEmpty")}</p>}

            {GLOSSARY_GROUPS.map(group => {
                const terms = matches.filter(term => term.group === group)
                if (terms.length === 0) return null
                return (
                    <section key={group} className="space-y-3">
                        <h2 className="text-lg font-semibold tracking-tight">{t(`groups.${group}`)}</h2>
                        <div className="grid gap-3 md:grid-cols-2">
                            {terms.map(term => (
                                <Card
                                    key={term.id}
                                    id={term.id}
                                    className={cn("scroll-mt-24 space-y-2 p-4", term.id === highlighted && "border-brand-500 ring-2 ring-brand-500/30")}
                                >
                                    <h3 className="font-semibold">{t(`terms.${term.id}.title`)}</h3>
                                    <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">{t(`terms.${term.id}.body`)}</p>
                                    {(term.example || term.link) && (
                                        <div className="flex flex-wrap items-center gap-3 pt-1">
                                            {term.example && <ExampleButton example={term.example}/>}
                                            {term.link && (
                                                <Link to={term.link} className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline dark:text-brand-400">
                                                    {t("seeOnSite")} <ArrowRight className="size-3.5"/>
                                                </Link>
                                            )}
                                        </div>
                                    )}
                                </Card>
                            ))}
                        </div>
                    </section>
                )
            })}
        </div>
    )
}
