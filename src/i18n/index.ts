import i18n from "i18next"
import {initReactI18next} from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"

import azCommon from "./locales/AZ/common.json"
import azGlossary from "./locales/AZ/glossary.json"
import azTheory from "./locales/AZ/theory.json"
import enCommon from "./locales/EN/common.json"
import enGlossary from "./locales/EN/glossary.json"
import enTheory from "./locales/EN/theory.json"
import ruCommon from "./locales/RU/common.json"
import ruGlossary from "./locales/RU/glossary.json"
import ruTheory from "./locales/RU/theory.json"

export const LANGUAGES = ["az", "en", "ru"] as const
export type Language = (typeof LANGUAGES)[number]

export const resources = {
    az: {common: azCommon, theory: azTheory, glossary: azGlossary},
    en: {common: enCommon, theory: enTheory, glossary: enGlossary},
    ru: {common: ruCommon, theory: ruTheory, glossary: ruGlossary},
} as const

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: "az",
        supportedLngs: LANGUAGES,
        nonExplicitSupportedLngs: true,
        defaultNS: "common",
        ns: ["common", "theory", "glossary"],
        interpolation: {escapeValue: false},
        detection: {
            // Azerbaijani by default; only an explicit choice in the header switches language.
            order: ["localStorage"],
            lookupLocalStorage: "language",
            caches: ["localStorage"],
        },
    })

i18n.on("languageChanged", language => {
    document.documentElement.lang = language
})

export default i18n
