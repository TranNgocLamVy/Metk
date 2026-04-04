import { ATRule } from "./atRule";
import { ATOutputData, ATRulesetData } from "@/shared/schema/atRuleSchema";
import { FilePathSystem } from "@/infrastructure/projectPathSystem";
import { TilesetRefManager } from "@/core/manager/tilesetRefManager";
import { BaseObject, BaseObjectEvents } from "../baseObject";
import { ATRulesetRefManager } from "@/core/manager/atRulesetRefManager";

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
        this.atRulesetPathSystem = tilesetRefManager.filePathSystem;
        this.id = atRuleData.id;
        this.name = atRuleData.name;
        this.color = atRuleData.color;
        this.rules = atRuleData.rules.map((rule) => new ATRule(rule, this.tilesetRefManager));

        this.tilesetRefManager.load(atRuleData.tileset);
    }

    public async load(): Promise<void> {

    }

    public addRule(rule: ATRule): void {
        this.rules.push(rule);
    }

    public removeRule(rule: ATRule): void {
        this.rules = this.rules.filter((r) => r !== rule);
    }

    public getOutput(): ATOutputData | null {
        for (const rule of this.rules) {
            const outputs = rule.getOutputs();
            // TODO: Choose random base on chance
            if (outputs) return outputs[0];
        }
        return null;
    }

    public serialize(): ATRulesetData {
        return {
            id: this.id,
            name: this.name,
            color: this.color,
            rules: this.rules.map((rule) => rule.serialize()),
            tileset: this.tilesetRefManager.serialize(),
        }
    }
}