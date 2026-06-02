import { RulesetRefManager } from "@/application/resources/references/ruleset-ref.manager";
import { TilesetRefManager } from "@/application/resources/references/tileset-ref.manager";
import { FilePathSystem } from "@/infrastructure/project-path-system";
import { RulesetRefData } from "@/shared/data-types/layer.data";
import { RuleData, RulesetData } from "@/shared/data-types/ruleset.data";
import { Console } from "@/shared/services/console.service";
import { Result } from "@/shared/types/result";
import { v4 as uuidv4 } from "uuid";
import { BaseObject, BaseObjectEvents } from "../base-object";
import { Rule } from "./rule";
import { normalizeRulesetData } from "./ruleset.normalizer";

interface RulesetEvent extends BaseObjectEvents {
    onUpdated: () => void
}

export class Ruleset extends BaseObject<RulesetEvent> {
    public readonly id: string;
    public name: string;
    public color: string;
    public size: number;
    private rules: Rule[] = [];

    public constructor(
        data: RulesetData,
        public readonly rulesetPathSystem: FilePathSystem,
        public readonly tilesetRefManager: TilesetRefManager,
        public readonly rulesetRefManager: RulesetRefManager,

    ) {
        super(`ruleset:${data.id}`);

        this.id = data.id;
        this.name = data.name;
        this.color = data.color;
        this.size = data.size;

        this.tilesetRefManager.loadData(data.tilesets.refs, data.tilesets.nextIndex);
        this.rulesetRefManager.loadData(data.rulesets.refs, data.rulesets.nextIndex);

        const hasSerializedSelfRef = data.rulesets.refs.some((ref) => ref.index === 0 && ref.id === this.id);
        if (!hasSerializedSelfRef) {
            this.rulesetRefManager.addRulesetToRefs(this.id); // First ruleset ref is always the current ruleset
            this.rulesetRefManager.replaceRulesetRef(0, this.id);
        }

        this.rules = data.rules.map((ruleData) => {
            const rule = new Rule(ruleData, this.size, this.tilesetRefManager, this.rulesetRefManager, this.objectId)
            return rule;
        });
    }

    public static createFromFileData(rulesetData: unknown,rulesetPathSystem: FilePathSystem,tilesetRefManager: TilesetRefManager,rulesetRefManager: RulesetRefManager): Result<Ruleset> {
        try {
            const data = normalizeRulesetData(rulesetData);
            return Result.Success(new Ruleset(data, rulesetPathSystem, tilesetRefManager, rulesetRefManager));
        } catch (error) {
            return Result.Error(`Failed to create ruleset: ${String(error)}`);
        }
    }

    public updateRuleset(rulesetData: RulesetData): void {
        let data: RulesetData;
        try {
            data = normalizeRulesetData(rulesetData);
        } catch {
            return;
        }
        if (this.id !== data.id) {
            Console.warn({
                message: `Trying to update Ruleset with mismatching id. Current id: ${this.id}, provided id: ${data.id}`, // TODO: i18n
            });
            return;
        }
        this.name = data.name;
        this.color = data.color;
        this.tilesetRefManager.loadData(data.tilesets.refs, data.tilesets.nextIndex);
        this.rulesetRefManager.loadData(data.rulesets.refs, data.rulesets.nextIndex);
        const processedRuleIds = new Set<string>();
        const existingRules = new Map(this.rules.map((rule) => [rule.id, rule]));
        const nextRules: Rule[] = [];

        for (const ruleData of data.rules) {
            processedRuleIds.add(ruleData.id);
            const existingRule = existingRules.get(ruleData.id);
            if (existingRule) {
                existingRule.update(ruleData);
                nextRules.push(existingRule);
            } else {
                const newRule = new Rule(ruleData, this.size, this.tilesetRefManager, this.rulesetRefManager, this.objectId);
                nextRules.push(newRule);
            }
        }

        const removedRules = this.rules.filter((rule) => !processedRuleIds.has(rule.id));
        removedRules.forEach((rule) => rule.destroy());
        this.rules = nextRules;
        this.eventEmitter.emit("onUpdated");
    }

    public calculateOutput(editorFacade: (RulesetRefData | null)[][]): { tileId: number, tilesetId: string } | null {
        for (const rule of this.rules) {
            if (rule.isSatisfied(editorFacade)) {
                const output = rule.calculateOutput();
                if (output != null) return output;
            }
        }
        return null;
    }

    public getRule(id: string): Rule | null { return this.rules.find((rule) => rule.id === id) ?? null }

    public getAllRules(): Rule[] { return this.rules }

    public addEmptyRule(at?: number): void {
        const ruleData: RuleData = { id: uuidv4(), constraints: "", outputs: "" };
        const newRule = new Rule(ruleData, this.size, this.tilesetRefManager, this.rulesetRefManager, this.objectId);
        if (at !== undefined) {
            this.rules.splice(at, 0, newRule);
        } else {
            this.rules.push(newRule);
        }
    }

    public duplicateRule(ruleId: string): void {
        const rule = this.getRule(ruleId);
        if (!rule) return;
        const ruleData = rule.serialize();
        ruleData.id = uuidv4();
        const newRule = new Rule(ruleData, this.size, this.tilesetRefManager, this.rulesetRefManager, this.objectId);
        this.rules.push(newRule);
    }

    public moveRule(ruleId: string, targetRuleId: string, position: "before" | "after"): boolean {
        const sourceIndex = this.rules.findIndex((rule) => rule.id === ruleId);
        if (sourceIndex === -1 || ruleId === targetRuleId) return false;

        const [rule] = this.rules.splice(sourceIndex, 1);
        const targetIndex = this.rules.findIndex((targetRule) => targetRule.id === targetRuleId);
        if (targetIndex === -1 || !rule) {
            if (rule) this.rules.splice(sourceIndex, 0, rule);
            return false;
        }

        this.rules.splice(position === "before" ? targetIndex : targetIndex + 1, 0, rule);
        return true;
    }

    public removeRule(ruleId: string): void {
        const removedRule = this.getRule(ruleId);
        if (removedRule) removedRule.destroy();
        this.rules = this.rules.filter((r) => r.id !== ruleId);
    }

    public removeRulesetRef(ruleset: string | number): boolean {
        const rulesetIndex = this.rulesetRefManager.removeRulesetRef(ruleset);
        if (rulesetIndex === -1) return false;
        this.rules.forEach((rule) => rule.removeRulesetRef(rulesetIndex));
        return true;
    }

    public removeTilesetRef(tileset: string | number): boolean {
        const tilesetIndex = this.tilesetRefManager.removeTilesetRef(tileset);
        if (tilesetIndex === -1) return false;
        this.rules.forEach((rule) => rule.removeTilesetRef(tilesetIndex));
        return true;
    }

    public serialize(): RulesetData {
        return {
            id: this.id,
            name: this.name,
            color: this.color,
            size: this.size,
            rules: this.rules.map((rule) => rule.serialize()),
            tilesets: this.tilesetRefManager.serialize(),
            rulesets: this.rulesetRefManager.serialize(),
        }
    }
    
    public override getObjectChildren(): BaseObject<any>[] {
        return this.rules;
    }

    public override destroy(): void {
        this.rules.forEach((rule) => rule.destroy());
        super.destroy();
    }
}
