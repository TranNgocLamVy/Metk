import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import enBackend from "@/assets/locales/en/backend.json";
import enCommon from "@/assets/locales/en/common.json";
import viBackend from "@/assets/locales/vi/backend.json";
import viCommon from "@/assets/locales/vi/common.json";

const defaultNS = 'common';
const resources = {
    en: {
        common: enCommon,
        backend: enBackend,
    },
    vi: {
        common: viCommon,
        backend: viBackend,
    }
} as const;

class I18nService {
    private static instance: I18nService;

    private constructor(resources: any) {
        i18n.use(LanguageDetector)
            .use(initReactI18next)
            .init({
                resources,
                fallbackLng: 'en',
                defaultNS,
                ns: ['common', 'editor', 'explorer', 'backend'],
                interpolation: {
                    escapeValue: false,
                },
                detection: {
                    order: ['localStorage', 'navigator'],
                    caches: ['localStorage'],
                },
            });
    }

    public static getIns(): I18nService {
        if (!I18nService.instance) I18nService.init(resources);
        return I18nService.instance;
    }

    public static init(resources: any) {
        if (I18nService.instance) return;
        I18nService.instance = new I18nService(resources);
    }

    public t(key: string, ns: string = defaultNS): string {
        return i18n.t(key, { ns });
    }

    public async changeLanguage(lng: string): Promise<void> {
        await i18n.changeLanguage(lng);
    }

    public addResources(lng: string, ns: string, resources: object) {
        i18n.addResourceBundle(lng, ns, resources, true, true);
    }

    public tBackendError(errorCode: string, fallback?: string): string {
        return i18n.t(errorCode, { ns: 'backend', defaultValue: fallback ?? i18n.t('errors.unknown', { ns: 'common' }) });
    }
}

export const i18nService = I18nService.getIns();
export default i18n;