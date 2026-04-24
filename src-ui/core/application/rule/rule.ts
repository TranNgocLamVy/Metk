import { RuleData, RuleOutputData, ConstraintRequirementType, RuleConstraintData } from "@/shared/schema/rulesetSchema";
import { TilesetRefManager } from "@/core/manager/tilesetRefManager";
import { BaseObject, BaseObjectEvents } from "../baseObject";
import { RulesetRefData } from "@/shared/schema/layerSchema";
import { RulesetRefManager } from "@/core/manager/rulesetRefManager";

interface RuleEvent extends BaseObjectEvents {
    onChange: () => void
}

export class Rule extends BaseObject<RuleEvent> {
    public readonly id: string;
    private constraints: RuleConstraint[];
    private outputs: RuleOutputData[];

    constructor(
        data: RuleData,
        private readonly size: number,
        public readonly tilesetRefManager: TilesetRefManager,
        public readonly rulesetRefManager: RulesetRefManager
    ) {
        super();
        this.id = data.id;
        this.constraints = data.constraints.map((constraint) => new RuleConstraint(constraint, this, this.rulesetRefManager));
        if (this.constraints.length < this.size * this.size) {
            for (let i = this.constraints.length; i < this.size * this.size; i++) {
                this.constraints.push(new RuleConstraint({ requirement: "ANY", targetIndexs: [] }, this, this.rulesetRefManager));
            }
        }
        this.outputs = data.outputs ? this.processOutputs(data.outputs) : [];
    }

    private processConstraints(data: string): RuleConstraintData[] {
        const constraints: RuleConstraintData[] = [];
        // TODO: Implement process constraints
        return constraints;
    }

    private processOutputs(data: string): RuleOutputData[] {
        const outputs: RuleOutputData[] = [];
        data.split(",").forEach((output) => {
            const parts = output.split(":");
            const parsedTileId = isNaN(parseInt(parts[0])) ? -1 : parseInt(parts[0]);
            const parsedTilesetIndex = isNaN(parseInt(parts[1])) ? -1 : parseInt(parts[1]);
            const parsedWeight = isNaN(parseInt(parts[2])) ? 1 : parseInt(parts[2]);
            if (parsedTileId === -1 || parsedTilesetIndex === -1) return;
            outputs.push({ tileId: parsedTileId, tilesetIndex: parsedTilesetIndex, weight: parsedWeight });
        });
        return outputs;
    }

    public update(data: RuleData): void {
        this.constraints = data.constraints.map((constraint) => new RuleConstraint(constraint, this, this.rulesetRefManager));
        if (this.constraints.length < this.size * this.size) {
            for (let i = this.constraints.length; i < this.size * this.size; i++) {
                this.constraints.push(new RuleConstraint({ requirement: "ANY", targetIndexs: [] }, this, this.rulesetRefManager));
            }
        }
        this.outputs = data.outputs ? this.processOutputs(data.outputs) : [];

        this.eventEmitter.emit("onChange");
    }

    public addOutput(tileId: number, tilesetId: string, weight: number): void;
    public addOutput(tileId: number, tilesetIndex: number, weight: number): void;
    public addOutput(tileId: number, tileset: string | number, weight: number): void {
        const tilesetIndex = typeof tileset === "string" ? this.tilesetRefManager.getTilesetIndexById(tileset) : tileset;
        this.outputs.push({ tileId, tilesetIndex, weight });
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
        return this.constraints[index];
    }

    public setChance(tileId: number, tilesetId: string, weight: number): void {
        const tilesetIndex = this.tilesetRefManager.getTilesetIndexById(tilesetId);
        this.outputs = this.outputs.map((o) => ({ tileId: o.tileId, tilesetIndex: o.tilesetIndex, weight: o.tileId === tileId && o.tilesetIndex === tilesetIndex ? weight : o.weight }));
        this.eventEmitter.emit("onChange");
    }

    public isSatisfied(input: (RulesetRefData | null)[][]): boolean {
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const constraintIndex = y * this.size + x;
                const constraint = this.constraints[constraintIndex];
                const targetSet = input[y]?.[x];
                if (!constraint.isSatisfied(targetSet ? targetSet.rulesetId : null)) {
                    return false;
                }
            }
        }
        return true;
    }

    public calculateOutput(): { tileId: number, tilesetId: string } | null {
        const outputs = this.getOutputs();
        if (!outputs || outputs.length === 0) return null;

        //TODO: Randomly select one output base on its weight scale.
        const selectedOutput = outputs[0];
        if (!selectedOutput) return null;

        const tilesetId = this.tilesetRefManager.getTilesetIdByIndex(selectedOutput.tilesetIndex);
        if (!tilesetId) return null;

        return { tileId: selectedOutput.tileId, tilesetId: tilesetId };
    }

    public getOutputs(): RuleOutputData[] {
        return this.outputs;
    }

    public getConstaints(): RuleConstraint[] {
        return this.constraints;
    }

    public serialize(): RuleData {
        return {
            id: this.id,
            constraints: this.constraints.map((constraint) => constraint.serialize()),
            outputs: this.outputs.map((output) => `${output.tileId}:${output.tilesetIndex}:${output.weight}`).join(","),
        }
    }
}

export class RuleConstraint {
    private targetIndexs: number[];
    private requirement: ConstraintRequirementType;

    constructor(
        data: RuleConstraintData,
        private readonly rule: Rule,
        private readonly rulesetRefManager: RulesetRefManager
    ) {
        this.targetIndexs = data.targetIndexs;
        this.requirement = data.requirement;
    }

    public getTargetIds(): string[] {
        return this.targetIndexs.map(target => this.rulesetRefManager.getRulesetIdByIndex(target)).filter(target => target !== null);
    }

    public addTargetById(targetId: string): void {
        const targetIndex = this.rulesetRefManager.getRulesetIndexById(targetId);
        if (targetIndex !== -1) {
            this.targetIndexs.push(targetIndex);
            this.rule.eventEmitter.emit("onChange");
        }
    }

    public removeTargetById(targetId: string): void {
        const targetIndex = this.rulesetRefManager.getRulesetIndexById(targetId);
        if (targetIndex !== -1) {
            this.targetIndexs = this.targetIndexs.filter((target) => target !== targetIndex);
            this.rule.eventEmitter.emit("onChange");
        }
    }

    public clearAll(): void {
        this.targetIndexs = [];
        this.rule.eventEmitter.emit("onChange");
    }

    public setRequirement(requirement: ConstraintRequirementType): void {
        this.requirement = requirement;
        this.rule.eventEmitter.emit("onChange");
    }

    public getRequirement(): ConstraintRequirementType {
        return this.requirement;
    }

    public isSatisfied(targetId: string | null): boolean {
        if (targetId === null) {
            switch (this.requirement) {
                case "ANY":
                    return true;
                case "EMPTY":
                    return true;
                case "NOT_EMPTY":
                    return false;
            }
            return false;
        }
        const targetIndex = this.rulesetRefManager.getRulesetIndexById(targetId);
        if (targetIndex === -1) return false;
        switch (this.requirement) {
            case "ANY":
                return true;
            case "EMPTY":
                return targetId === null;
            case "NOT_EMPTY":
                return targetId !== null && !this.targetIndexs.includes(targetIndex);
            case "IS":
                return targetId !== null && this.targetIndexs.includes(targetIndex);
            case "NOT":
                return targetId === null || !this.targetIndexs.includes(targetIndex);
        }
    }

    public serialize(): RuleConstraintData {
        return {
            requirement: this.requirement,
            targetIndexs: this.targetIndexs,
        }
    }
}