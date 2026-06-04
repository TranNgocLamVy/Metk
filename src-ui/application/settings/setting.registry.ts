import {
    RegisteredSettingDefinition,
    ResolvedSettingsFromPages,
    SettingKeyFromPages,
    SettingPage,
} from "./setting.types";

export class SettingRegistry<TPages extends readonly SettingPage[]> {
    private readonly settings = new Map<string, RegisteredSettingDefinition>();

    constructor(private readonly pages: TPages) {
        this.registerPages(pages);
    }

    public getDefinition(key: SettingKeyFromPages<TPages>): RegisteredSettingDefinition | undefined;
    public getDefinition(key: string): RegisteredSettingDefinition | undefined;
    public getDefinition(key: string): RegisteredSettingDefinition | undefined {
        return this.settings.get(key);
    }

    public has(key: string): boolean {
        return this.settings.has(key);
    }

    public getDefaultValue<TKey extends SettingKeyFromPages<TPages>>(
        key: TKey,
    ): ResolvedSettingsFromPages<TPages>[TKey] {
        const definition = this.settings.get(key);
        if (!definition) throw new Error(`Unknown setting key: ${key}`);
        return definition.defaultValue as ResolvedSettingsFromPages<TPages>[TKey];
    }

    public getPages(): TPages {
        return this.pages;
    }

    public getAll(): RegisteredSettingDefinition[] {
        return Array.from(this.settings.values());
    }

    private registerPages(pages: readonly SettingPage[]): void {
        for (const page of pages) {
            for (const group of page.groups) {
                for (const setting of group.settings) {
                    const fullKey = this.createFullKey(page.key, group.key, setting.key);
                    if (this.settings.has(fullKey)) {
                        throw new Error(`Duplicate setting key: ${fullKey}`);
                    }

                    this.settings.set(fullKey, {
                        ...setting,
                        fullKey,
                        pageKey: page.key,
                        groupKey: group.key,
                        scope: setting.scope ?? "application",
                    });
                }
            }
        }
    }

    private createFullKey(pageKey: string, groupKey: string, settingKey: string): string {
        return `${pageKey}.${groupKey}.${settingKey}`;
    }
}
