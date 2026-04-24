import { Rule } from "./rule";
import { RuleOutputData, RulesetData } from "@/shared/schema/rulesetSchema";
import { FilePathSystem } from "@/infrastructure/projectPathSystem";
import { TilesetRefManager } from "@/core/manager/tilesetRefManager";
import { BaseObject, BaseObjectEvents } from "../baseObject";
import { v4 as uuidv4 } from "uuid";
import { RulesetRefManager } from "@/core/manager/rulesetRefManager";
import { RulesetRefData } from "@/shared/schema/layerSchema";
import { Console } from "@/shared/services/consoleService";

interface RulesetEvent extends BaseObjectEvents {
    onChange: () => void
}

export class Ruleset extends BaseObject<RulesetEvent> {
    public readonly id: string;
    public name: string;
    public color: string;
    public size: number;
    private rules: Rule[] = [];

    constructor(
        ruleData: RulesetData,
        public readonly rulesetPathSystem: FilePathSystem,
        public readonly tilesetRefManager: TilesetRefManager,
        public readonly rulesetRefManager: RulesetRefManager
    ) {
        super();

        this.id = ruleData.id;
        this.name = ruleData.name;
        this.color = ruleData.color;
        this.size = ruleData.size;
        this.rules = ruleData.rules.map((rule) => new Rule(rule, this.size, this.tilesetRefManager, this.rulesetRefManager));
        
        this.rulesetRefManager.addRulesetToRefs(this.id); // First ruleset ref is always the current ruleset
    }

    public updateRuleset(rulesetData: RulesetData): void {
        if (!rulesetData) return;
        if (this.id !== rulesetData.id) {
            Console.warn(`Trying to update Ruleset with mismatching id. Current id: ${this.id}, provided id: ${rulesetData.id}`);
            return;
        }
        this.name = rulesetData.name;
        this.color = rulesetData.color;
        this.tilesetRefManager.load(rulesetData.tilesets.refs, rulesetData.tilesets.nextIndex);
        this.rulesetRefManager.load(rulesetData.rulesets.refs, rulesetData.rulesets.nextIndex);
        const processedRuleIds = new Set<string>();
        for (const ruleData of rulesetData.rules) {
            processedRuleIds.add(ruleData.id);
            const existingRule = this.getRule(ruleData.id);
            if (existingRule) {
                existingRule.update(ruleData);
            } else {
                const newRule = new Rule(ruleData, this.size, this.tilesetRefManager, this.rulesetRefManager);
                this.rules.push(newRule);
            }
        }
        this.rules = this.rules.filter((rule) => processedRuleIds.has(rule.id));
        this.eventEmitter.emit("onChange");
    }

    public calculateOutput(context: (RulesetRefData | null)[][]): { tileId: number, tilesetId: string } | null {
        for (const rule of this.rules) {
            if (rule.isSatisfied(context)) {
                const output = rule.calculateOutput();
                if (output != null) return output;
            }
        }
        return null;
    }

    public async load(): Promise<void> { }

    public async unload(): Promise<void> { }

    public getRule(id: string): Rule | null { return this.rules.find((rule) => rule.id === id) ?? null }

    public getAllRules(): Rule[] { return this.rules }

    public addEmptyRule(): void {
        const newRule = new Rule({ id: uuidv4(), constraints: [], outputs: "" }, this.size, this.tilesetRefManager, this.rulesetRefManager);
        this.rules.push(newRule);
    }

    public duplicateRule(ruleId: string): void {
        const rule = this.getRule(ruleId);
        if (!rule) return;
        const newRule = new Rule(rule.serialize(), this.size, this.tilesetRefManager, this.rulesetRefManager);
        this.rules.push(newRule);
    }

    public removeRule(rule: Rule): void { this.rules = this.rules.filter((r) => r !== rule) }

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
}