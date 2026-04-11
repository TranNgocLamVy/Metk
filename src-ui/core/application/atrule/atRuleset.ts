import { ATRule } from "./atRule";
import { ATOutputData, ATRulesetData } from "@/shared/schema/atRuleSchema";
import { FilePathSystem } from "@/infrastructure/projectPathSystem";
import { TilesetRefManager } from "@/core/manager/tilesetRefManager";
import { BaseObject, BaseObjectEvents } from "../baseObject";
import { ATRulesetRefManager } from "@/core/manager/atRulesetRefManager";
import { v4 as uuidv4 } from "uuid";

interface ATRulesetEvent extends BaseObjectEvents {
    onChange: () => void
}

export class ATRuleset extends BaseObject<ATRulesetEvent> {
    public readonly id: string;
    public name: string;
    public color: string;
    private rules: ATRule[] = [];

    constructor(
        atRuleData: ATRulesetData,
        public readonly atRulesetPathSystem: FilePathSystem,
        public readonly tilesetRefManager: TilesetRefManager, 
        public readonly atRulesetRefManager: ATRulesetRefManager
    ) {
        super();
        
        this.id = atRuleData.id;
        this.name = atRuleData.name;
        this.color = atRuleData.color;
        this.rules = atRuleData.rules.map((rule) => new ATRule(rule, this.tilesetRefManager));

        this.tilesetRefManager.load(atRuleData.tilesets);
    }

    public async load(): Promise<void> {

    }

    public getRule(id: string): ATRule | null {
        return this.rules.find((rule) => rule.id === id) ?? null;
    }

    public getAllRules(): ATRule[] {
        return this.rules;
    }

    public addRule(rule: ATRule): void {
        this.rules.push(rule);
    }

    public addEmptyRule(): void {
        const newRule = new ATRule({ id: uuidv4(), size: 5, constraints: [], outputs: "" }, this.tilesetRefManager);
        this.rules.push(newRule);
    }

    public duplicateRule(rule: ATRule): void {
        this.rules.push(new ATRule(rule.serialize(), this.tilesetRefManager));
    }

    public removeRule(rule: ATRule): void {
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

    public serialize(): ATRulesetData {
        return {
            id: this.id,
            name: this.name,
            color: this.color,
            rules: this.rules.map((rule) => rule.serialize()),
            tilesets: this.tilesetRefManager.serialize(),
            rulesets: this.atRulesetRefManager.serialize(),
        }
    }
}