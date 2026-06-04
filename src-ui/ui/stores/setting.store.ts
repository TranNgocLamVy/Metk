import { appKernel } from "@/application/bootstrap/app-kernel";
import type { DefaultSettingKey, DefaultSettingValue } from "@/application/settings/default-settings";
import { SettingValue } from "@/application/settings/setting.types";
import { create } from "zustand";

type SettingStoreState = {
    values: Record<string, SettingValue>;
    isLoaded: boolean;
    loadSettings: () => Promise<void>;
    get: <TKey extends DefaultSettingKey>(key: TKey) => DefaultSettingValue<TKey>;
    update: <TKey extends DefaultSettingKey>(key: TKey, value: NoInfer<DefaultSettingValue<TKey>>) => Promise<void>;
    reset: (key: DefaultSettingKey) => Promise<void>;
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
    get: <TKey extends DefaultSettingKey>(key: TKey): DefaultSettingValue<TKey> => {
        return appKernel.settings.get(key);
    },
    update: async <TKey extends DefaultSettingKey>(key: TKey, value: NoInfer<DefaultSettingValue<TKey>>) => {
        const result = await appKernel.settings.update(key, value);
        if (result.status === "Success") {
            set({ values: appKernel.settings.getAllResolvedSettings() });
        }
    },
    reset: async (key: DefaultSettingKey) => {
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
