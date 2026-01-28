import { create } from "zustand";
import { persist } from "zustand/middleware";

import { i18nService } from "@/core/service/i18n";

interface SettingsState {
    language: string;
    setLanguage: (lang: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            language: 'en',
            setLanguage: async (lang: string) => {
                await i18nService.changeLanguage(lang);
                set({ language: lang });
            },
        }),
        {
            name: 'metk-settings',
            // TODO: Migrate to src-tauri/data/configs.json using a custom storage engine
            // storage: tauriConfigStorage, 
        }
    )
);