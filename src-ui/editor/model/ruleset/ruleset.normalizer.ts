import { RuleData, RulesetData } from "@/shared/data-types/ruleset.data";
import { TilesetRefData } from "@/shared/data-types/tileset.data";
import { validate } from "@/shared/utils/validate.utils";

const normalizeCloneFrom = (value: unknown): string | undefined => {
    return typeof value === "string" && value.length > 0 ? value : undefined;
};

const cloneFromField = (value: unknown): { cloneFrom?: string } => {
    const cloneFrom = normalizeCloneFrom(value);
    return cloneFrom ? { cloneFrom } : {};
};

const normalizeRuleData = (value: unknown): RuleData | null => {
    try {
        const data = validate.requiredObject({ value, field: "rule" });
        return {
            id: validate.requiredString({ value: data.id, field: "rule.id" }),
            ...cloneFromField(data.cloneFrom),
            constraints: validate.string({ value: data.constraints, defaultValue: "" }),
            outputs: validate.string({ value: data.outputs, defaultValue: "" }),
        };
    } catch {
        return null;
    }
};

const normalizeTilesetRef = (value: unknown): TilesetRefData | null => {
    try {
        const data = validate.requiredObject({ value, field: "ruleset.tilesets.refs[]" });
        return {
            id: validate.requiredString({ value: data.id, field: "ruleset.tilesets.refs[].id" }),
            index: validate.number({ value: data.index, defaultValue: 0, min: 0, integer: true }),
            name: validate.string({ value: data.name, defaultValue: "Untitled Tileset" }),
        };
    } catch {
        return null;
    }
};

const normalizeRulesetRef = (value: unknown): RulesetData["rulesets"]["refs"][number] | null => {
    try {
        const data = validate.requiredObject({ value, field: "ruleset.rulesets.refs[]" });
        return {
            id: validate.requiredString({ value: data.id, field: "ruleset.rulesets.refs[].id" }),
            index: validate.number({ value: data.index, defaultValue: 0, min: 0, integer: true }),
            name: validate.string({ value: data.name, defaultValue: "Untitled Ruleset" }),
        };
    } catch {
        return null;
    }
};

export const normalizeRulesetData = (rulesetData: unknown): RulesetData => {
    const data = validate.requiredObject({ value: rulesetData, field: "ruleset" });
    const tilesets = validate.object<Record<string, unknown>>({ value: data.tilesets, defaultValue: {} });
    const rulesets = validate.object<Record<string, unknown>>({ value: data.rulesets, defaultValue: {} });

    return {
        id: validate.requiredString({ value: data.id, field: "ruleset.id" }),
        ...cloneFromField(data.cloneFrom),
        name: validate.string({ value: data.name, defaultValue: "Untitled Rule Set" }),
        color: validate.string({ value: data.color, defaultValue: "#ffffff" }),
        size: validate.number({ value: data.size, defaultValue: 5, min: 1, integer: true }),
        rules: validate.array<unknown>({ value: data.rules, defaultValue: [] })
            .map(normalizeRuleData)
            .filter((rule): rule is RuleData => rule !== null),
        tilesets: {
            refs: validate.array<unknown>({ value: tilesets.refs, defaultValue: [] })
                .map(normalizeTilesetRef)
                .filter((ref): ref is TilesetRefData => ref !== null),
            nextIndex: validate.number({ value: tilesets.nextIndex, defaultValue: 0, min: 0, integer: true }),
        },
        rulesets: {
            refs: validate.array<unknown>({ value: rulesets.refs, defaultValue: [] })
                .map(normalizeRulesetRef)
                .filter((ref): ref is RulesetData["rulesets"]["refs"][number] => ref !== null),
            nextIndex: validate.number({ value: rulesets.nextIndex, defaultValue: 0, min: 0, integer: true }),
        },
    };
};

export const extractRulesetId = (rulesetData: unknown): string => {
    const data = validate.requiredObject({ value: rulesetData, field: "ruleset" });
    return validate.requiredString({ value: data.id, field: "ruleset.id" });
};
