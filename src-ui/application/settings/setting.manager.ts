import EventEmitter from "eventemitter3";

import { JsonStorageService } from "@/infrastructure/json-storage.service";
import { Result } from "@/shared/types/result";
import { SettingRegistry } from "./setting.registry";
import { NumberSettingDefinition, RegisteredSettingDefinition, SettingChangeEvent, SettingInspection, SettingValue, UserSettingsData } from "./setting.types";

type SettingManagerEvents = {
    didChangeSetting: (event: SettingChangeEvent) => void;
};

const defaultUserSettingsData = (): UserSettingsData => ({
    version: 1,
    values: {},
});

export class SettingManager {
    private readonly eventEmitter = new EventEmitter<SettingManagerEvents>();
    private userSettings: UserSettingsData = defaultUserSettingsData();

    constructor(
        private readonly registry: SettingRegistry,
        private readonly storage: JsonStorageService<UserSettingsData>,
        private readonly filePath: string = "settings.json",
    ) { }

    public async load(): Promise<Result> {
        try {
            const loadResult = await this.storage.load(this.filePath);
            if (loadResult.status !== Result.Status.Success) {
                this.userSettings = defaultUserSettingsData();
                return Result.Success();
            }
            this.userSettings = this.normalizeUserSettingsData(loadResult.data);
            return Result.Success();
        } catch (error) {
            this.userSettings = defaultUserSettingsData();
            return Result.Success();
        }
    }

    public async save(): Promise<Result> {
        try {
            return await this.storage.save(this.filePath, this.userSettings);
        } catch (error) {
            return Result.Error(`Failed to save settings: ${String(error)}`);
        }
    }

    public get<TValue extends SettingValue>(key: string): TValue {
        const definition = this.registry.getDefinition(key);
        if (!definition) throw new Error(`Unknown setting key: ${key}`);

        return this.resolveValue(definition) as TValue;
    }

    public getAllResolvedSettings(): Record<string, SettingValue> {
        const resolvedSettings: Record<string, SettingValue> = {};
        for (const definition of this.registry.getAll()) {
            resolvedSettings[definition.fullKey] = this.resolveValue(definition);
        }

        return resolvedSettings;
    }

    public inspect(key: string): SettingInspection {
        const definition = this.registry.getDefinition(key);
        if (!definition) {
            return {
                key,
                exists: false,
                isConfigured: false,
                source: "unknown",
                error: `Unknown setting key: ${key}`,
            };
        }

        const userValue = this.userSettings.values[key];
        const hasUserValue = userValue !== undefined;

        return {
            key,
            exists: true,
            isConfigured: hasUserValue,
            source: hasUserValue ? "user" : "default",
            definition,
            defaultValue: definition.defaultValue,
            userValue,
            resolvedValue: hasUserValue ? userValue : definition.defaultValue,
        };
    }

    public async update(key: string, value: SettingValue): Promise<Result> {
        const definition = this.registry.getDefinition(key);
        if (!definition) return Result.Error(`Unknown setting key: ${key}`);

        const validationResult = this.validateValue(definition, value);
        if (validationResult.status !== Result.Status.Success) return validationResult;

        const oldValue = this.resolveValue(definition);
        const previousUserSettings = this.cloneUserSettingsData();
        const hadUserValue = this.userSettings.values[key] !== undefined;

        if (value === definition.defaultValue) {
            delete this.userSettings.values[key];
        } else {
            this.userSettings.values[key] = value;
        }

        const newValue = this.resolveValue(definition);
        const hasChangedStorage = hadUserValue || value !== definition.defaultValue;
        if (!hasChangedStorage && oldValue === newValue) return Result.Success();

        const saveResult = await this.save();
        if (saveResult.status !== Result.Status.Success) {
            this.userSettings = previousUserSettings;
            return saveResult;
        }

        if (oldValue !== newValue) {
            this.eventEmitter.emit("didChangeSetting", { key, oldValue, newValue, definition });
        }

        return Result.Success();
    }

    public async reset(key: string): Promise<Result> {
        const definition = this.registry.getDefinition(key);
        if (!definition) return Result.Error(`Unknown setting key: ${key}`);

        if (this.userSettings.values[key] === undefined) return Result.Success();

        const oldValue = this.resolveValue(definition);
        const previousUserSettings = this.cloneUserSettingsData();
        delete this.userSettings.values[key];

        const saveResult = await this.save();
        if (saveResult.status !== Result.Status.Success) {
            this.userSettings = previousUserSettings;
            return saveResult;
        }

        const newValue = this.resolveValue(definition);
        if (oldValue !== newValue) {
            this.eventEmitter.emit("didChangeSetting", { key, oldValue, newValue, definition });
        }

        return Result.Success();
    }

    public onDidChangeSetting(listener: (event: SettingChangeEvent) => void): () => void {
        this.eventEmitter.on("didChangeSetting", listener);
        return () => this.eventEmitter.off("didChangeSetting", listener);
    }

    private resolveValue(definition: RegisteredSettingDefinition): SettingValue {
        const userValue = this.userSettings.values[definition.fullKey];
        return userValue !== undefined ? userValue : definition.defaultValue;
    }

    private cloneUserSettingsData(): UserSettingsData {
        return {
            version: this.userSettings.version,
            values: { ...this.userSettings.values },
        };
    }

    private normalizeUserSettingsData(data: unknown): UserSettingsData {
        if (!this.isUserSettingsData(data)) return defaultUserSettingsData();

        const normalizedData = defaultUserSettingsData();
        normalizedData.version = data.version;

        for (const [key, value] of Object.entries(data.values)) {
            const definition = this.registry.getDefinition(key);
            if (!definition) continue;
            if (!this.isSettingValue(value)) continue;
            if (this.validateValue(definition, value).status !== Result.Status.Success) continue;
            if (value === definition.defaultValue) continue;

            normalizedData.values[key] = value;
        }

        return normalizedData;
    }

    private isUserSettingsData(data: unknown): data is UserSettingsData {
        if (!data || typeof data !== "object") return false;

        const candidate = data as Partial<UserSettingsData>;
        return typeof candidate.version === "number"
            && !!candidate.values
            && typeof candidate.values === "object"
            && !Array.isArray(candidate.values);
    }

    private isSettingValue(value: unknown): value is SettingValue {
        return typeof value === "string"
            || typeof value === "number"
            || typeof value === "boolean";
    }

    private validateValue(definition: RegisteredSettingDefinition, value: SettingValue): Result {
        switch (definition.type) {
            case "boolean":
                return typeof value === "boolean"
                    ? Result.Success()
                    : Result.Error(`Setting ${definition.fullKey} expects a boolean value`);
            case "string":
                return this.validateStringValue(definition, value);
            case "number":
                return this.validateNumberValue(definition, value);
            case "enum":
                return this.validateEnumValue(definition, value);
        }
    }

    private validateStringValue(definition: RegisteredSettingDefinition, value: SettingValue): Result {
        if (typeof value !== "string") {
            return Result.Error(`Setting ${definition.fullKey} expects a string value`);
        }

        if (definition.type !== "string") return Result.Error(`Setting ${definition.fullKey} is not a string setting`);
        if (definition.minLength !== undefined && value.length < definition.minLength) {
            return Result.Error(`Setting ${definition.fullKey} must be at least ${definition.minLength} characters`);
        }
        if (definition.maxLength !== undefined && value.length > definition.maxLength) {
            return Result.Error(`Setting ${definition.fullKey} must be at most ${definition.maxLength} characters`);
        }

        return Result.Success();
    }

    private validateNumberValue(definition: RegisteredSettingDefinition, value: SettingValue): Result {
        if (typeof value !== "number" || !Number.isFinite(value)) {
            return Result.Error(`Setting ${definition.fullKey} expects a finite number value`);
        }

        if (definition.type !== "number") return Result.Error(`Setting ${definition.fullKey} is not a number setting`);
        if (definition.min !== undefined && value < definition.min) {
            return Result.Error(`Setting ${definition.fullKey} must be greater than or equal to ${definition.min}`);
        }
        if (definition.max !== undefined && value > definition.max) {
            return Result.Error(`Setting ${definition.fullKey} must be less than or equal to ${definition.max}`);
        }
        if (!this.matchesStep(definition, value)) {
            return Result.Error(`Setting ${definition.fullKey} must match step ${definition.step}`);
        }

        return Result.Success();
    }

    private validateEnumValue(definition: RegisteredSettingDefinition, value: SettingValue): Result {
        if (typeof value !== "string") {
            return Result.Error(`Setting ${definition.fullKey} expects an enum string value`);
        }

        if (definition.type !== "enum") return Result.Error(`Setting ${definition.fullKey} is not an enum setting`);
        if (!definition.enumValues.some((option) => option.value === value)) {
            return Result.Error(`Setting ${definition.fullKey} does not support enum value ${value}`);
        }

        return Result.Success();
    }

    private matchesStep(definition: NumberSettingDefinition | RegisteredSettingDefinition, value: number): boolean {
        if (definition.type !== "number" || definition.step === undefined) return true;
        if (definition.step <= 0) return false;

        const base = definition.min ?? 0;
        const steps = (value - base) / definition.step;
        return Math.abs(steps - Math.round(steps)) < Number.EPSILON * 100;
    }
}
