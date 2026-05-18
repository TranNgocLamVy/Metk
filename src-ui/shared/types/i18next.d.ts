import { defaultNS, resources } from "@/editor/services/i18n";

declare module 'i18next' {
    interface CustomTypeOptions {
        defaultNS: typeof defaultNS;
        resources: typeof resources['en'];
    }
}