import { Rule } from "./rule";
import { ATOutputData, RulesetData } from "@/shared/schema/ruleSchema";
import { FilePathSystem } from "@/infrastructure/projectPathSystem";
import { TilesetRefManager } from "@/core/manager/tilesetRefManager";
import { BaseObject, BaseObjectEvents } from "../baseObject";
import { v4 as uuidv4 } from "uuid";
import { RulesetRefManager } from "@/core/manager/rulesetRefManager";

interface RulesetEvent extends BaseObjectEvents {
    onChange: () => void
}

export class Ruleset extends BaseObject<RulesetEvent> {
    public readonly id: string;
    public name: string;
    public color: string;
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
        this.rules = ruleData.rules.map((rule) => new Rule(rule, this.tilesetRefManager));

        this.tilesetRefManager.load(ruleData.tilesets);
    }

    public updateRuleset(rulesetData: RulesetData): void {
        if (!rulesetData) return;
        if (this.id !== rulesetData.id) {
            console.warn(`Trying to update Ruleset with mismatching id. Current id: ${this.id}, provided id: ${rulesetData.id}`);
            return;
        }
        this.name = rulesetData.name;
        this.color = rulesetData.color;

        this.tilesetRefManager.load(rulesetData.tilesets);
        this.rulesetRefManager.load(rulesetData.rulesets);

        const processedRuleIds = new Set<string>();

        for (const ruleData of rulesetData.rules) {
            processedRuleIds.add(ruleData.id);
            const existingRule = this.getRule(ruleData.id);

            if (existingRule) {
                existingRule.update(ruleData);
            } else {
                this.addRule(new Rule(ruleData, this.tilesetRefManager));
            }
        }

        this.rules = this.rules.filter((rule) => processedRuleIds.has(rule.id));

        this.eventEmitter.emit("onChange");
    }

    public async load(): Promise<void> {

    }

    public getRule(id: string): Rule | null {
        return this.rules.find((rule) => rule.id === id) ?? null;
    }

    public getAllRules(): Rule[] {
        return this.rules;
    }

    public addRule(rule: Rule): void {
        this.rules.push(rule);
    }

    public addEmptyRule(): void {
        const newRule = new Rule({ id: uuidv4(), size: 5, constraints: [], outputs: "" }, this.tilesetRefManager);
        this.rules.push(newRule);
    }

    public duplicateRule(rule: Rule): void {
        this.rules.push(new Rule(rule.serialize(), this.tilesetRefManager));
    }

    public removeRule(rule: Rule): void {
        this.rules = this.rules.filter((r) => r !== rule);
    }

    public getOutput(): ATOutputData | null {
        for (const rule of this.rules) {
            const outputs = rule.getOutputs();
            // TODO: Choose random base on chance
            if (outputs && outputs.length > 0) return outputs[0];
        }
        return null;
    }

    public serialize(): RulesetData {
        return {
            id: this.id,
            name: this.name,
            color: this.color,
            rules: this.rules.map((rule) => rule.serialize()),
            tilesets: this.tilesetRefManager.serialize(),
            rulesets: this.rulesetRefManager.serialize(),
        }
    }
}