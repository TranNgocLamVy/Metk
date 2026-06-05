import EventEmitter from "eventemitter3";

import { JsonStorageService } from "@/infrastructure/json-storage.service";
import { Result } from "@/shared/types/result";
import type { DefaultSettingPages } from "./default-settings";
import { SettingRegistry } from "./setting.registry";
import {
    NumberSettingDefinition,
    RegisteredSettingDefinition,
    RegisteredSettingDefinitionFromPages,
    ResolvedSettingsFromPages,
    SettingChangeEventFromPages,
    SettingInspection,
    SettingKeyFromPages,
    SettingPage,
    SettingValue,
    SettingValueFromPages,
    UserSettingsData,
} from "./setting.types";

type SettingManagerEvents = {
    didChangeSetting: (event: RuntimeSettingChangeEvent) => void;
};

type RuntimeSettingChangeEvent = {
    key: string;
    oldValue: SettingValue;
    newValue: SettingValue;
    definition: RegisteredSettingDefinition;
};

type SettingChangeEventForKey<
    TPages extends readonly SettingPage[],
    TKey extends SettingKeyFromPages<TPages>,
> = Extract<SettingChangeEventFromPages<TPages>, { key: TKey }>;

const defaultUserSettingsData = (): UserSettingsData => ({
    version: 1,
    values: {},
});

export class SettingManager<TPages extends readonly SettingPage[] = DefaultSettingPages> {
    private readonly eventEmitter = new EventEmitter<SettingManagerEvents>();
    private userSettings: UserSettingsData = defaultUserSettingsData();

    constructor(
        private readonly registry: SettingRegistry<TPages>,
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

    public get<TKey extends SettingKeyFromPages<TPages>>(key: TKey): SettingValueFromPages<TPages, TKey> {
        const definition = this.registry.getDefinition(key);
        if (!definition) throw new Error(`Unknown setting key: ${key}`);

        return this.resolveValue(definition) as SettingValueFromPages<TPages, TKey>;
    }

    public getAllResolvedSettings(): ResolvedSettingsFromPages<TPages> {
        const resolvedSettings: Record<string, SettingValue> = {};
        for (const definition of this.registry.getAll()) {
            resolvedSettings[definition.fullKey] = this.resolveValue(definition);
        }

        return resolvedSettings as ResolvedSettingsFromPages<TPages>;
    }

    public inspect<TKey extends SettingKeyFromPages<TPages>>(
        key: TKey,
    ): SettingInspection<
        TKey,
        SettingValueFromPages<TPages, TKey>,
        RegisteredSettingDefinitionFromPages<TPages, TKey>
    > {
        const definition = this.registry.getDefinition(key);
        if (!definition) {
            return {
                key,
                exists: false,
                isConfigured: false,
                source: "unknown",
                error: `Unknown setting key: ${key}`,
            } as SettingInspection<
                TKey,
                SettingValueFromPages<TPages, TKey>,
                RegisteredSettingDefinitionFromPages<TPages, TKey>
            >;
        }

        const userValue = this.userSettings.values[key] as SettingValueFromPages<TPages, TKey> | undefined;
        const hasUserValue = userValue !== undefined;
        const defaultValue = definition.defaultValue as SettingValueFromPages<TPages, TKey>;

        return {
            key,
            exists: true,
            isConfigured: hasUserValue,
            source: hasUserValue ? "user" : "default",
            definition: definition as unknown as RegisteredSettingDefinitionFromPages<TPages, TKey>,
            defaultValue,
            userValue,
            resolvedValue: hasUserValue ? userValue : defaultValue,
        };
    }

    public async update<TKey extends SettingKeyFromPages<TPages>>(
        key: TKey,
        value: NoInfer<SettingValueFromPages<TPages, TKey>>,
    ): Promise<Result> {
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
            this.eventEmitter.emit("didChangeSetting", { key, oldValue, newValue, definition } as SettingChangeEventFromPages<TPages>);
        }

        return Result.Success();
    }

    public async reset<TKey extends SettingKeyFromPages<TPages>>(key: TKey): Promise<Result> {
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
            this.eventEmitter.emit("didChangeSetting", { key, oldValue, newValue, definition } as SettingChangeEventFromPages<TPages>);
        }

        return Result.Success();
    }

    public onDidChangeSetting(listener: (event: SettingChangeEventFromPages<TPages>) => void): () => void;

    public onDidChangeSetting<TKey extends SettingKeyFromPages<TPages>>(key: TKey, listener: (event: SettingChangeEventForKey<TPages, TKey>) => void): () => void;

    public onDidChangeSetting(key: "any", listener: (event: SettingChangeEventFromPages<TPages>) => void): () => void;

    public onDidChangeSetting<TKey extends SettingKeyFromPages<TPages>>(keyOrListener: TKey | "any" | ((event: SettingChangeEventFromPages<TPages>) => void), listener?: unknown): () => void {
        if (typeof keyOrListener === "function") {
            const typedListener = keyOrListener;

            const wrappedListener = (event: RuntimeSettingChangeEvent) => {
                typedListener(event as SettingChangeEventFromPages<TPages>);
            };

            this.eventEmitter.on("didChangeSetting", wrappedListener);
            return () => this.eventEmitter.off("didChangeSetting", wrappedListener);
        }

        const key = keyOrListener;

        const wrappedListener = (event: RuntimeSettingChangeEvent) => {
            if (key !== "any" && event.key !== key) return;

            if (key === "any") {
                const listenerForAny = listener as (event: SettingChangeEventFromPages<TPages>) => void;
                listenerForAny(event as SettingChangeEventFromPages<TPages>);
                return;
            }

            const listenerForKey = listener as (event: SettingChangeEventForKey<TPages, TKey>) => void;
            listenerForKey(event as SettingChangeEventForKey<TPages, TKey>);
        };

        this.eventEmitter.on("didChangeSetting", wrappedListener);
        return () => this.eventEmitter.off("didChangeSetting", wrappedListener);
    }

    private resolveValue<TKey extends SettingKeyFromPages<TPages>>(
        definition: RegisteredSettingDefinitionFromPages<TPages, TKey>,
    ): SettingValueFromPages<TPages, TKey>;
    private resolveValue(definition: RegisteredSettingDefinition): SettingValue;
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
