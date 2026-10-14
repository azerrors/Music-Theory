import {Link} from "react-router"
import {useTranslation} from "react-i18next"
import {ArrowRight, Guitar, Piano} from "lucide-react"
import {Card} from "@/components/ui/card"
import {PATHS, PIANO_PATHS} from "@/router/paths"

const OPTIONS = [
    {instrument: "guitar", to: PATHS.home, icon: Guitar, note: null},
    {instrument: "piano", to: PIANO_PATHS.home, icon: Piano, note: "picker.soon"},
] as const

export default function InstrumentPickerPage() {
    const {t} = useTranslation()

    return (
        <div className="mx-auto max-w-4xl space-y-10 pt-4 sm:pt-10">
            <section className="space-y-4 text-center">
                <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">{t("picker.title")}</h1>
                <p className="mx-auto max-w-2xl text-lg text-stone-600 text-pretty dark:text-stone-400">{t("picker.subtitle")}</p>
            </section>

            <section className="grid gap-5 sm:grid-cols-2">
                {OPTIONS.map(({instrument, to, icon: Icon, note}) => (
                    <Link key={instrument} to={to} className="group rounded-2xl">
                        <Card className="flex h-full flex-col gap-4 p-7 transition-colors group-hover:border-brand-400 dark:group-hover:border-brand-700">
                            <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                                <Icon className="size-8"/>
                            </span>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold tracking-tight">{t(`instrument.${instrument}`)}</h2>
                                <p className="text-stone-600 text-pretty dark:text-stone-400">{t(`picker.${instrument}`)}</p>
                                {note && <p className="text-xs font-medium text-stone-500">{t(note)}</p>}
                            </div>
                            <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 dark:text-brand-400">
                                {t("picker.open")} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5"/>
                            </span>
                        </Card>
                    </Link>
                ))}
            </section>
        </div>
    )
}
