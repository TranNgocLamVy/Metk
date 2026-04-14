import { RuleData, RuleOutputData, RuleConstraintType, RuleConstraintData } from "@/shared/schema/ruleSchema";
import { Ruleset } from "./ruleset";
import { TilesetRefManager } from "@/core/manager/tilesetRefManager";
import { BaseObject, BaseObjectEvents } from "../baseObject";
import { RulesetRefData } from "@/shared/schema/layerSchema";

interface RuleEvent extends BaseObjectEvents {
    onChange: () => void
}

export class Rule extends BaseObject<RuleEvent> {
    public readonly id: string;
    private constraintts: RuleConstraint[];
    private outputs: RuleOutputData[];

    constructor(
        data: RuleData,
        private readonly size: number,
        public readonly tilesetRefManager: TilesetRefManager
    ) {
        super();
        this.id = data.id;
        this.constraintts = data.constraintts.map((constraintt) => new RuleConstraint(constraintt, this));
        if (this.constraintts.length < this.size * this.size) {
            for (let i = this.constraintts.length; i < this.size * this.size; i++) {
                this.constraintts.push(new RuleConstraint({ constraintt: "ANY", targets: [] }, this));
            }
        }
        
        this.outputs = data.outputs ? data.outputs.split(" ").map((output) => {
            const parts = output.split(":");
            return { 
                tileId: parseInt(parts[0]), 
                tilesetIndex: parseInt(parts[1]), 
                chance: parseInt(parts[2]) 
            };
        }) : [];
    }

    public update(data: RuleData): void {
        this.constraintts = data.constraintts.map((constraintt) => new RuleConstraint(constraintt, this));
        
        if (this.constraintts.length < this.size * this.size) {
            for (let i = this.constraintts.length; i < this.size * this.size; i++) {
                this.constraintts.push(new RuleConstraint({ constraintt: "ANY", targets: [] }, this));
            }
        }
        
        this.outputs = data.outputs ? data.outputs.split(" ").map((output) => {
            const parts = output.split(":");
            return { 
                tileId: parseInt(parts[0]), 
                tilesetIndex: parseInt(parts[1]), 
                chance: parseInt(parts[2]) 
            };
        }) : [];

        this.eventEmitter.emit("onChange");
    }

    public addOutput(tileId: number, tilesetId: string, chance: number): void;
    public addOutput(tileId: number, tilesetIndex: number, chance: number): void;
    public addOutput(tileId: number, tileset: string | number, chance: number): void {
        const tilesetIndex = typeof tileset === "string" ? this.tilesetRefManager.getTilesetIndexById(tileset) : tileset;
        this.outputs.push({ tileId, tilesetIndex, chance });
        this.eventEmitter.emit("onChange");
    }

    public removeOutput(tileId: number, tilesetId: string): void;
    public removeOutput(tileId: number, tilesetIndex: number): void;
    public removeOutput(tileId: number, tileset: string | number): void {
        const tilesetIndex = typeof tileset === "string" ? this.tilesetRefManager.getTilesetIndexById(tileset) : tileset;
        this.outputs = this.outputs.filter((o) => o.tileId !== tileId || o.tilesetIndex !== tilesetIndex);
        this.eventEmitter.emit("onChange");
    }

    public getConstraint(index: number): RuleConstraint {
        return this.constraintts[index];
    }

    public setChance(tileId: number, tilesetId: string, chance: number): void {
        const tilesetIndex = this.tilesetRefManager.getTilesetIndexById(tilesetId);
        this.outputs = this.outputs.map((o) => ({ tileId: o.tileId, tilesetIndex: o.tilesetIndex, chance: o.tileId === tileId && o.tilesetIndex === tilesetIndex ? chance : o.chance }));
        this.eventEmitter.emit("onChange");
    }

    public isSatisfied(input: (RulesetRefData | null)[][]): boolean {
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const constrainttIndex = y * this.size + x;
                const constraintt = this.constraintts[constrainttIndex];
                const targetSet = input[y]?.[x];
                if (!constraintt.isSatisfied(targetSet ? targetSet.rulesetId : null)) {
                    return false;
                }
            }
        }
        return true;
    }

    public calculateOutput(): { tileId: number, tilesetId: string } | null {
        const outputs = this.getOutputs();
        //TODO: Randomly select one output base on its chance scale.
        const selectedOutput = outputs[0];
        const tilesetId = this.tilesetRefManager.getTilesetIdByIndex(selectedOutput.tilesetIndex);
        if (!tilesetId) return null;
        return { tileId: selectedOutput.tileId, tilesetId: tilesetId };
    }

    public getOutputs(): RuleOutputData[] {
        return this.outputs;
    }

    public getConstaints(): RuleConstraint[] {
        return this.constraintts;
    }

    public serialize(): RuleData {
        return {
            id: this.id,
            constraintts: this.constraintts.map((constraintt) => constraintt.serialize()),
            outputs: this.outputs.map((output) => `${output.tileId}:${output.tilesetIndex}:${output.chance}`).join(" "),
        }
    }
}

export class RuleConstraint {
    private targets: string[];
    private constraintt: RuleConstraintType;
    
    constructor(data: RuleConstraintData, private readonly rule: Rule) {
        this.targets = data.targets;
        this.constraintt = data.constraintt;
    }

    public getTargets(): string[] {
        return this.targets;
    }
    
    public addTarget(targetId: string): void {
        this.targets.push(targetId);
        this.rule.eventEmitter.emit("onChange");
    }

    public removeTarget(targetId: string): void {
        this.targets = this.targets.filter((target) => target !== targetId);
        this.rule.eventEmitter.emit("onChange");
    }

    public clearAll(): void {
        this.targets = [];
        this.rule.eventEmitter.emit("onChange");
    }

    public setConstraint(constraintt: RuleConstraintType): void {
        this.constraintt = constraintt;
        this.rule.eventEmitter.emit("onChange");
    }

    public getConstraint(): RuleConstraintType {
        return this.constraintt;
    }

    public isSatisfied(targetId: string | null): boolean {
        switch (this.constraintt) {
            case "EMPTY":
                return targetId === null;
            case "ANY":
                return true;
            case "REQUIRE":
                return targetId !== null && this.targets.includes(targetId);
            case "NOT":
                return targetId === null || !this.targets.includes(targetId);
        }
    }

    public serialize(): RuleConstraintData {
        return {
            constraintt: this.constraintt,
            targets: this.targets,
        }
    }
}