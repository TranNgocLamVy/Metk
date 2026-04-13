import { ATRuleDataSchema, ATOutputData, ATConstraint, ATRuleConstraintData } from "@/shared/schema/atRuleSchema";
import { ATRuleset } from "./atRuleset";
import { TilesetRefManager } from "@/core/manager/tilesetRefManager";
import { BaseObject, BaseObjectEvents } from "../baseObject";

interface ATRuleEvent extends BaseObjectEvents {
    onChange: () => void
}

export class ATRule extends BaseObject<ATRuleEvent> {
    public readonly id: string;
    public size: number;
    private constraints: ATRuleConstraint[];
    private outputs: ATOutputData[];

    constructor(data: ATRuleDataSchema, public readonly tilesetRefManager: TilesetRefManager) {
        super();
        this.id = data.id;
        this.size = data.size;
        this.constraints = data.constraints.map((constraint) => new ATRuleConstraint(constraint, this));
        if (this.constraints.length < this.size * this.size) {
            for (let i = this.constraints.length; i < this.size * this.size; i++) {
                this.constraints.push(new ATRuleConstraint({ constraint: "ANY", targets: [] }, this));
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

    public update(data: ATRuleDataSchema): void {
        this.size = data.size;
        
        this.constraints = data.constraints.map((constraint) => new ATRuleConstraint(constraint, this));
        
        if (this.constraints.length < this.size * this.size) {
            for (let i = this.constraints.length; i < this.size * this.size; i++) {
                this.constraints.push(new ATRuleConstraint({ constraint: "ANY", targets: [] }, this));
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

    public getConstraint(index: number): ATRuleConstraint {
        return this.constraints[index];
    }

    public setChance(tileId: number, tilesetId: string, chance: number): void {
        const tilesetIndex = this.tilesetRefManager.getTilesetIndexById(tilesetId);
        this.outputs = this.outputs.map((o) => ({ tileId: o.tileId, tilesetIndex: o.tilesetIndex, chance: o.tileId === tileId && o.tilesetIndex === tilesetIndex ? chance : o.chance }));
        this.eventEmitter.emit("onChange");
    }

    public isSatisfied(input: (ATRuleset | null)[][]): boolean {
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const constraintIndex = y * this.size + x;
                const constraint = this.constraints[constraintIndex];
                const targetSet = input[y]?.[x];
                if (!constraint.isSatisfied(targetSet ? targetSet.id : null)) {
                    return false;
                }
            }
        }
        return true;
    }

    public getOutputs(): ATOutputData[] {
        return this.outputs;
    }

    public getConstaints(): ATRuleConstraint[] {
        return this.constraints;
    }

    public serialize(): ATRuleDataSchema {
        return {
            id: this.id,
            size: this.size,
            constraints: this.constraints.map((constraint) => constraint.serialize()),
            outputs: this.outputs.map((output) => `${output.tileId}:${output.tilesetIndex}:${output.chance}`).join(" "),
        }
    }
}

export class ATRuleConstraint {
    private targets: string[];
    private constraint: ATConstraint;
    
    constructor(data: ATRuleConstraintData, private readonly atRule: ATRule) {
        this.targets = data.targets;
        this.constraint = data.constraint;
    }

    public getTargets(): string[] {
        return this.targets;
    }
    
    public addTarget(targetId: string): void {
        this.targets.push(targetId);
        this.atRule.eventEmitter.emit("onChange");
    }

    public removeTarget(targetId: string): void {
        this.targets = this.targets.filter((target) => target !== targetId);
        this.atRule.eventEmitter.emit("onChange");
    }

    public clearAll(): void {
        this.targets = [];
        this.atRule.eventEmitter.emit("onChange");
    }

    public setConstraint(constraint: ATConstraint): void {
        this.constraint = constraint;
        this.atRule.eventEmitter.emit("onChange");
    }

    public getConstraint(): ATConstraint {
        return this.constraint;
    }

    public isSatisfied(targetId: string | null): boolean {
        switch (this.constraint) {
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

    public serialize(): ATRuleConstraintData {
        return {
            constraint: this.constraint,
            targets: this.targets,
        }
    }
}