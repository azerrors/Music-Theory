import {Link} from "react-router"
import {useTranslation} from "react-i18next"
import {buttonVariants} from "@/components/ui/button"

export default function NotFoundPage() {
    const {t} = useTranslation()

    return (
        <div className="grid min-h-80 place-items-center text-center">
            <div className="space-y-3">
                <p className="text-6xl font-bold text-brand-600">404</p>
                <h1 className="text-2xl font-bold">{t("notFound.title")}</h1>
                <p className="text-base-600 dark:text-base-400">{t("notFound.description")}</p>
                <Link to="/" className={buttonVariants()}>{t("notFound.goHome")}</Link>
            </div>
        </div>
    )
}
