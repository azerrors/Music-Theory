import type {ReactNode} from "react"
import {useTranslation} from "react-i18next"
import {Card} from "@/components/ui/card"
import {Segmented} from "@/components/ui/segmented"
import {Select} from "@/components/ui/select"
import {Switch} from "@/components/ui/switch"
import {TUNINGS} from "@/constants/tunings"
import {useSettings} from "@/hooks/useSettings"
import {PageHeader} from "@/widgets/PageHeader"

function SettingRow({label, hint, hintId, children}: {label: string; hint?: string; hintId?: string; children: ReactNode}) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
            <div className="max-w-md space-y-0.5">
                <p className="font-medium">{label}</p>
                {hint && <p id={hintId} className="text-sm text-stone-500">{hint}</p>}
            </div>
            {children}
        </div>
    )
}

export default function SettingsPage() {
    const {t} = useTranslation()
    const settings = useSettings()

    return (
        <div className="max-w-3xl space-y-8">
            <PageHeader title={t("settings.title")} description={t("settings.description")}/>

            <Card className="divide-y divide-stone-200 dark:divide-stone-800">
                <SettingRow label={t("settings.notation")}>
                    <Segmented
                        label={t("settings.notation")}
                        value={settings.notation}
                        onChange={notation => settings.update({notation})}
                        options={[
                            {value: "letter", label: t("settings.notationLetter")},
                            {value: "solfege", label: t("settings.notationSolfege")},
                        ]}
                    />
                </SettingRow>

                <SettingRow label={t("settings.labels")}>
                    <Segmented
                        label={t("settings.labels")}
                        value={settings.labelMode}
                        onChange={labelMode => settings.update({labelMode})}
                        options={[
                            {value: "note", label: t("settings.labelNote")},
                            {value: "degree", label: t("settings.labelDegree")},
                        ]}
                    />
                </SettingRow>

                <SettingRow label={t("settings.leftHanded")} hint={t("settings.leftHandedHint")} hintId="left-handed-hint">
                    <Switch
                        checked={settings.leftHanded}
                        onChange={leftHanded => settings.update({leftHanded})}
                        aria-describedby="left-handed-hint"
                    />
                </SettingRow>

                <SettingRow label={t("settings.tuning")} hint={t("settings.tuningHint")}>
                    <Select
                        aria-label={t("settings.tuning")}
                        value={settings.tuningId}
                        onChange={event => settings.update({tuningId: event.target.value})}
                        className="w-64"
                    >
                        {TUNINGS.map(tuning => (
                            <option key={tuning.id} value={tuning.id}>{t(`settings.tunings.${tuning.id}`)}</option>
                        ))}
                    </Select>
                </SettingRow>
            </Card>
        </div>
    )
}
