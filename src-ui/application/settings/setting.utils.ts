import { Result } from "@/shared/types/result";
import { Console } from "@/ui/notifications/console-gateway";
import { appKernel } from "../bootstrap/app-kernel";
import { DefaultSettingKey, DefaultSettingValue } from "./default-settings";

const settings = appKernel.settings;

export async function toggleSetting<TKey extends DefaultSettingKey>(key: TKey){
    const currentValue = settings.get(key);

    if (typeof currentValue !== "boolean") {
        Console.warn({ message: `Setting ${key} is not boolean` });
        return;
    }

    const result = await settings.update(key, !currentValue as any);

    if (result.status !== Result.Status.Success) {
        Console.error({ message: result.message });
    }
};


export async function updateSetting<TKey extends DefaultSettingKey>(key: TKey, value: NoInfer<DefaultSettingValue<TKey>>): Promise<Result> {
    try {
        const result = await appKernel.settings.update(key, value);

        if (result.status !== Result.Status.Success) {
            Console.error({ message: result.message });
        }

        return result;
    } catch (error) {
        const message = `Failed to update setting ${key}: ${String(error)}`;
        Console.error({ message });

        return Result.Error(message);
    }
}

export function getSetting<TKey extends DefaultSettingKey>(key: TKey) {
    return settings.get(key);
}