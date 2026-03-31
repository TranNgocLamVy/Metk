import { TilesetManager } from "@/core/manager/tilesetManager";
import { ATRule } from "./atRule";
import { ATOutputData, ATRuleSetData } from "@/shared/schema/atRuleSchema";

export class ATRuleSet {
    public readonly id: string;
    public name: string;
    public color: string;
    private rules: ATRule[] = [];
    constructor(data: ATRuleSetData, public readonly tilesetManager: TilesetManager) {
        this.id = data.id;
        this.name = data.name;
        this.color = data.color;
        this.rules = data.rules.map((rule) => new ATRule(rule));
    }

    public addRule(rule: ATRule): void {
        this.rules.push(rule);
    }

    public removeRule(rule: ATRule): void {
        this.rules = this.rules.filter((r) => r !== rule);
    }

    public getOutput(): ATOutputData | null {
        for (const rule of this.rules) {
            const output = rule.getOutput();
            if (output) return output;
        }
        return null;
    }

    public serialize(): ATRuleSetData {
        return {
            id: this.id,
            name: this.name,
            color: this.color,
            rules: this.rules.map((rule) => rule.serialize()),
        }
    }
}