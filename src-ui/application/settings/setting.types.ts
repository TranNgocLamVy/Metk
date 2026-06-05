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

export type VisibleSettingBaseDefinition = {
    label: string;
    description: string;
}

export type InvisibleSettingBaseDefinition = {
    visible: false;
}

type SettingBaseDefinition<TType extends SettingType, TValue extends SettingValue> = {
    key: string;
    type: TType;
    defaultValue: TValue;
    order?: number;
    requiresReload?: boolean;
    scope?: SettingScope;
} & (VisibleSettingBaseDefinition | InvisibleSettingBaseDefinition);

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
    enumValues: readonly SettingEnumOption[];
};

export type SettingDefinition =
    | StringSettingDefinition
    | NumberSettingDefinition
    | BooleanSettingDefinition
    | EnumSettingDefinition;

export type VisibleSettingGroup = {
    key: string;
    label: string;
    description: string;
    order?: number;
    settings: readonly SettingDefinition[];
}

export type InvisibleSettingGroup = {
    key: string;
    visible: false;
    order?: number;
    settings: readonly SettingDefinition[];
}

export type SettingGroup = VisibleSettingGroup | InvisibleSettingGroup;


export type VisibleSettingPage = {
    key: string;
    label: string;
    description: string;
    order?: number;
    groups: readonly SettingGroup[];
}

export type InvisibleSettingPage = {
    key: string;
    visible: false;
    order?: number;
    groups: readonly SettingGroup[];
}

export type SettingPage = VisibleSettingPage | InvisibleSettingPage;

export type SettingEntryFromPages<TPages extends readonly SettingPage[]> =
    TPages[number] extends infer TPage
        ? TPage extends { key: infer TPageKey extends string; groups: readonly unknown[] }
            ? TPage["groups"][number] extends infer TGroup
                ? TGroup extends { key: infer TGroupKey extends string; settings: readonly unknown[] }
                    ? TGroup["settings"][number] extends infer TSetting
                        ? TSetting extends SettingDefinition & { key: infer TSettingKey extends string }
                            ? {
                                key: `${TPageKey}.${TGroupKey}.${TSettingKey}`;
                                definition: TSetting;
                                value: SettingValueFromDefinition<TSetting>;
                            }
                            : never
                        : never
                    : never
                : never
            : never
        : never;

export type SettingKeyFromPages<TPages extends readonly SettingPage[]> =
    SettingEntryFromPages<TPages> extends infer TEntry
        ? TEntry extends { key: infer TKey extends string }
            ? TKey
            : never
        : never;

export type SettingDefinitionFromPages<
    TPages extends readonly SettingPage[],
    TKey extends SettingKeyFromPages<TPages>,
> = SettingEntryFromPages<TPages> extends infer TEntry
    ? TEntry extends { key: TKey; definition: infer TDefinition extends SettingDefinition }
        ? TDefinition
        : never
    : never;

export type SettingValueFromPages<
    TPages extends readonly SettingPage[],
    TKey extends SettingKeyFromPages<TPages>,
> = SettingEntryFromPages<TPages> extends infer TEntry
    ? TEntry extends { key: TKey; value: infer TValue extends SettingValue }
        ? TValue
        : never
    : never;

export type ResolvedSettingsFromPages<TPages extends readonly SettingPage[]> = {
    [TKey in SettingKeyFromPages<TPages>]: SettingValueFromPages<TPages, TKey>;
};

export type RegisteredSettingDefinition<
    TDefinition extends SettingDefinition = SettingDefinition,
    TFullKey extends string = string,
> = TDefinition & {
    fullKey: TFullKey;
    pageKey: string;
    groupKey: string;
    scope: SettingScope;
};

export type RegisteredSettingDefinitionFromPages<
    TPages extends readonly SettingPage[],
    TKey extends SettingKeyFromPages<TPages>,
> = RegisteredSettingDefinition<SettingDefinitionFromPages<TPages, TKey>, TKey>;

export type SettingInspection<
    TKey extends string = string,
    TValue extends SettingValue = SettingValue,
    TDefinition extends RegisteredSettingDefinition = RegisteredSettingDefinition,
> = {
    key: TKey;
    exists: boolean;
    isConfigured: boolean;
    source: "user" | "default" | "unknown";
    definition?: TDefinition;
    defaultValue?: TValue;
    userValue?: TValue;
    resolvedValue?: TValue;
    error?: string;
};

export type SettingChangeEvent<
    TKey extends string = string,
    TValue extends SettingValue = SettingValue,
    TDefinition extends RegisteredSettingDefinition = RegisteredSettingDefinition,
> = {
    key: TKey;
    oldValue: TValue;
    newValue: TValue;
    definition: TDefinition;
};

export type SettingChangeEventFromPages<TPages extends readonly SettingPage[]> =
    SettingEntryFromPages<TPages> extends infer TEntry
        ? TEntry extends {
            key: infer TKey extends SettingKeyFromPages<TPages>;
            value: infer TValue extends SettingValue;
        }
            ? SettingChangeEvent<
                TKey,
                TValue,
                RegisteredSettingDefinitionFromPages<TPages, TKey>
            >
            : never
        : never;

type SettingValueFromDefinition<TDefinition extends SettingDefinition> =
    TDefinition extends { type: "boolean" }
        ? boolean
        : TDefinition extends { type: "number" }
            ? number
            : TDefinition extends { type: "string" }
                ? string
                : TDefinition extends { type: "enum"; enumValues: readonly (infer TOption)[] }
                    ? TOption extends { value: infer TValue extends string }
                        ? TValue
                        : never
                    : never;
