import { appKernel } from "@/application/bootstrap/app-kernel";
import { SettingValue } from "@/application/settings/setting.types";
import { create } from "zustand";

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
    values: appKernel.settings.getAllResolvedSettings(),
    isLoaded: false,
    loadSettings: async () => {
        const result = await appKernel.settings.load();
        if (result.status === "Success") {
            set({
                values: appKernel.settings.getAllResolvedSettings(),
                isLoaded: true,
            });
        }
    },
    get: <TValue extends SettingValue>(key: string): TValue => {
        return appKernel.settings.get<TValue>(key);
    },
    update: async (key: string, value: SettingValue) => {
        const result = await appKernel.settings.update(key, value);
        if (result.status === "Success") {
            set({ values: appKernel.settings.getAllResolvedSettings() });
        }
    },
    reset: async (key: string) => {
        const result = await appKernel.settings.reset(key);
        if (result.status === "Success") {
            set({ values: appKernel.settings.getAllResolvedSettings() });
        }
    },
    syncFromManager: () => {
        set({ values: appKernel.settings.getAllResolvedSettings() });
    },
}));

appKernel.settings.onDidChangeSetting(() => {
    useSettingStore.getState().syncFromManager();
});
