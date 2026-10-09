import {isRouteErrorResponse, Link, useRouteError} from "react-router"
import {useTranslation} from "react-i18next"
import {buttonVariants} from "@/components/ui/button"
import {PATHS} from "@/router/paths"

export function RouteErrorPage() {
    const {t} = useTranslation()
    const error = useRouteError()
    const isNotFound = isRouteErrorResponse(error) && error.status === 404

    return (
        <div className="grid min-h-screen place-items-center p-6 text-center">
            <div className="space-y-3">
                <h1 className="text-2xl font-bold">{t(isNotFound ? "notFound.title" : "error.title")}</h1>
                <p className="text-stone-600 dark:text-stone-400">{t(isNotFound ? "notFound.description" : "error.description")}</p>
                <Link to={PATHS.home} className={buttonVariants()}>{t("notFound.goHome")}</Link>
            </div>
        </div>
    )
}
