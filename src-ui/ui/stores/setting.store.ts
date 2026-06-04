import { create } from "zustand";

import { settingManager, SettingValue } from "@/application/settings";

type SettingStoreState = {
    values: Record<string, SettingValue>;
    isLoaded: boolean;
    loadSettings: () => Promise<void>;
    get: <TValue extends SettingValue>(key: string) => TValue;
    update: (key: string, value: SettingValue) => Promise<void>;
    reset: (key: string) => Promise<void>;
    syncFromManager: () => void;
};

export const useSettingStore = create<SettingStoreState>((set) => ({
    values: settingManager.getAllResolvedSettings(),
    isLoaded: false,
    loadSettings: async () => {
        const result = await settingManager.load();
        if (result.status === "Success") {
            set({
                values: settingManager.getAllResolvedSettings(),
                isLoaded: true,
            });
        }
    },
    get: <TValue extends SettingValue>(key: string): TValue => {
        return settingManager.get<TValue>(key);
    },
    update: async (key: string, value: SettingValue) => {
        const result = await settingManager.update(key, value);
        if (result.status === "Success") {
            set({ values: settingManager.getAllResolvedSettings() });
        }
    },
    reset: async (key: string) => {
        const result = await settingManager.reset(key);
        if (result.status === "Success") {
            set({ values: settingManager.getAllResolvedSettings() });
        }
    },
    syncFromManager: () => {
        set({ values: settingManager.getAllResolvedSettings() });
    },
}));

settingManager.onDidChangeSetting(() => {
    useSettingStore.getState().syncFromManager();
});
