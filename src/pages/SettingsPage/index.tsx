import {useTranslation} from "react-i18next"
import {Card} from "@/components/ui/card"
import {PageHeader} from "@/widgets/PageHeader"
import {SettingsPanel} from "@/widgets/SettingsPanel"

/** The same settings as the header's drawer, as a page of its own (it has a link and a URL). */
export default function SettingsPage() {
    const {t} = useTranslation()

    return (
        <div className="max-w-2xl space-y-8">
            <PageHeader title={t("settings.title")} description={t("settings.description")}/>
            <Card>
                <SettingsPanel/>
            </Card>
        </div>
    )
}
