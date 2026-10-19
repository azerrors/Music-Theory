import {Loader2} from "lucide-react"
import {useTranslation} from "react-i18next"

export function PageLoader() {
    const {t} = useTranslation()

    return (
        <div className="grid min-h-64 place-items-center text-base-500" role="status">
            <Loader2 className="size-6 animate-spin" aria-hidden/>
            <span className="sr-only">{t("actions.loading")}</span>
        </div>
    )
}
