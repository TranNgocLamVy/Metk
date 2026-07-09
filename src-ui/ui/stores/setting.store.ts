import { appKernel } from "@/application/bootstrap/app-kernel";
import type { DefaultSettingKey, DefaultSettingValue } from "@/application/settings/default-settings";
import { SettingValue } from "@/application/settings/setting.types";
import { create } from "zustand";

type SettingStoreState = {
    values: Record<string, SettingValue>;
    isLoaded: boolean;
}

type SettingStoreActions = {
    loadSettings: () => Promise<void>;
    get: <TKey extends DefaultSettingKey>(key: TKey) => DefaultSettingValue<TKey>;
    update: <TKey extends DefaultSettingKey>(key: TKey, value: NoInfer<DefaultSettingValue<TKey>>) => Promise<void>;
    reset: (key: DefaultSettingKey) => Promise<void>;
    syncFromManager: () => void;
};

type SettingStore = SettingStoreState & {
    actions: SettingStoreActions;
}

const useSettingStore = create<SettingStore>((set) => ({
    values: appKernel.settings.getAllResolvedSettings(),
    isLoaded: false,
    actions: {
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
    },
}));

appKernel.settings.onDidChangeSetting("any", () => {
    useSettingStore.getState().actions.syncFromManager();
});

export const useSettingValues = () => useSettingStore((state) => state.values);
export const useAreSettingsLoaded = () => useSettingStore((state) => state.isLoaded);
export const useSettingActions = () => useSettingStore((state) => state.actions);

export const getSettingStoreState = () => useSettingStore.getState();
