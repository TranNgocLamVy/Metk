import { Rule } from "./rule";
import { RuleData, RulesetData } from "@/shared/schema/rulesetSchema";
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
        rulesetData: RulesetData,
        public readonly rulesetPathSystem: FilePathSystem,
        public readonly tilesetRefManager: TilesetRefManager,
        public readonly rulesetRefManager: RulesetRefManager
    ) {
        super();

        this.id = rulesetData.id;
        this.name = rulesetData.name;
        this.color = rulesetData.color;
        this.size = rulesetData.size;
        this.rules = rulesetData.rules.map((rule) => new Rule(rule, this.size, this.tilesetRefManager, this.rulesetRefManager));

        this.tilesetRefManager.loadData(rulesetData.tilesets.refs, rulesetData.tilesets.nextIndex);
        this.rulesetRefManager.loadData(rulesetData.rulesets.refs, rulesetData.rulesets.nextIndex);
        
        this.rulesetRefManager.addRulesetToRefs(this.id); // First ruleset ref is always the current ruleset
        this.rulesetRefManager.replaceRulesetRef(0, this.id);
    }

    public updateRuleset(rulesetData: RulesetData): void {
        if (!rulesetData) return;                                                                                                                                                                                                              
        if (this.id !== rulesetData.id) {
            Console.warn({
                message: `Trying to update Ruleset with mismatching id. Current id: ${this.id}, provided id: ${rulesetData.id}`, // TODO: i18n
            });
            return;
        }
        this.name = rulesetData.name;
        this.color = rulesetData.color;
        this.tilesetRefManager.loadData(rulesetData.tilesets.refs, rulesetData.tilesets.nextIndex);
        this.rulesetRefManager.loadData(rulesetData.rulesets.refs, rulesetData.rulesets.nextIndex);
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
        const ruleData: RuleData = { id: uuidv4(), constraints: "", outputs: "" };
        const newRule = new Rule(ruleData, this.size, this.tilesetRefManager, this.rulesetRefManager);
        this.rules.push(newRule);
    }

    public duplicateRule(ruleId: string): void {
        const rule = this.getRule(ruleId);
        if (!rule) return;
        const ruleData = rule.serialize();
        ruleData.id = uuidv4();
        const newRule = new Rule(ruleData, this.size, this.tilesetRefManager, this.rulesetRefManager);
        this.rules.push(newRule);
    }

    public removeRule(ruleId: string): void { this.rules = this.rules.filter((r) => r.id !== ruleId) }

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
}