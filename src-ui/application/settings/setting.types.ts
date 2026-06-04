export type SettingType = "string" | "number" | "boolean" | "enum";

export type SettingValue = string | number | boolean;

export type SettingScope = "application";

export type UserSettingsData = {
    version: number;
    values: Record<string, SettingValue>;
};

export type SettingEnumOption = {
    value: string;
    label: string;
    description?: string;
};

type SettingBaseDefinition<TType extends SettingType, TValue extends SettingValue> = {
    key: string;
    label: string;
    description: string;
    type: TType;
    defaultValue: TValue;
    order?: number;
    requiresReload?: boolean;
    scope?: SettingScope;
};

export type StringSettingDefinition = SettingBaseDefinition<"string", string> & {
    minLength?: number;
    maxLength?: number;
};

export type NumberSettingDefinition = SettingBaseDefinition<"number", number> & {
    min?: number;
    max?: number;
    step?: number;
};

export type BooleanSettingDefinition = SettingBaseDefinition<"boolean", boolean>;

export type EnumSettingDefinition = SettingBaseDefinition<"enum", string> & {
    enumValues: SettingEnumOption[];
};

export type SettingDefinition =
    | StringSettingDefinition
    | NumberSettingDefinition
    | BooleanSettingDefinition
    | EnumSettingDefinition;

export type SettingGroup = {
    key: string;
    label: string;
    description: string;
    order?: number;
    settings: SettingDefinition[];
};

export type SettingPage = {
    key: string;
    label: string;
    description: string;
    order?: number;
    groups: SettingGroup[];
};

export type RegisteredSettingDefinition = SettingDefinition & {
    fullKey: string;
    pageKey: string;
    groupKey: string;
    scope: SettingScope;
};

export type SettingInspection = {
    key: string;
    exists: boolean;
    isConfigured: boolean;
    source: "user" | "default" | "unknown";
    definition?: RegisteredSettingDefinition;
    defaultValue?: SettingValue;
    userValue?: SettingValue;
    resolvedValue?: SettingValue;
    error?: string;
};

export type SettingChangeEvent = {
    key: string;
    oldValue: SettingValue;
    newValue: SettingValue;
    definition: RegisteredSettingDefinition;
};
