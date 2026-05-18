import { RuleData, RuleOutputData, RuleConstraintData, RuleRequirement } from "@/shared/schema/ruleset.schema";
import { TilesetRefManager } from "@/application/resources/references/tileset-ref.manager";
import { BaseObject, BaseObjectEvents } from "../base-object";
import { RulesetRefData } from "@/shared/schema/layer.schema";
import { RulesetRefManager } from "@/application/resources/references/ruleset-ref.manager";

interface RuleEvent extends BaseObjectEvents {
    onChange: () => void
}

export class Rule extends BaseObject<RuleEvent> {
    public readonly id: string;
    private constraints: RuleConstraint[];
    private outputs: RuleOutput[];

    constructor(
        data: RuleData,
        private readonly size: number,
        public readonly tilesetRefManager: TilesetRefManager,
        public readonly rulesetRefManager: RulesetRefManager
    ) {
        super();
        this.id = data.id;
        this.constraints = this.processConstraints(data.constraints);
        this.outputs = this.processOutputs(data.outputs);
    }

    private processConstraints(data: string): RuleConstraint[] {
        const constraints: RuleConstraint[] = [];
        if (data) {
            data.split(",").forEach((constraint) => {
                const parts = constraint.split(":");
                const parsedRequirement = parseInt(parts[0]) as RuleRequirement;
                const parsedAllowEmpty = parts[1] === "1";
                const parsedTargetIndexs = parts[2] ? parts[2].split(".").map(Number) : [];
                constraints.push(new RuleConstraint({ requirement: parsedRequirement, targetIndexs: parsedTargetIndexs, allowEmpty: parsedAllowEmpty }, this.rulesetRefManager));
            });
        }
        if (constraints.length < this.size * this.size) {
            for (let i = constraints.length; i < this.size * this.size; i++) {
                constraints.push(new RuleConstraint({ requirement: RuleRequirement.ANY, targetIndexs: [], allowEmpty: false }, this.rulesetRefManager));
            }
        }
        return constraints;
    }

    private processOutputs(data: string): RuleOutput[] {
        const outputs: RuleOutput[] = [];
        if (!data) return outputs;
        data.split(",").forEach((output) => {
            const parts = output.split(":");
            const parsedTileId = isNaN(parseInt(parts[0])) ? -1 : parseInt(parts[0]);
            const parsedTilesetIndex = isNaN(parseInt(parts[1])) ? -1 : parseInt(parts[1]);
            const parsedWeight = isNaN(parseInt(parts[2])) ? 1 : parseInt(parts[2]);
            if (parsedTileId === -1 || parsedTilesetIndex === -1) return;
            outputs.push(new RuleOutput({ tileId: parsedTileId, tilesetIndex: parsedTilesetIndex, weight: parsedWeight }, this.tilesetRefManager));
        });
        return outputs;
    }

    public update(data: RuleData): void {
        this.constraints = data.constraints ? this.processConstraints(data.constraints) : [];
        this.outputs = data.outputs ? this.processOutputs(data.outputs) : [];
        this.eventEmitter.emit("onChange");
    }

    public addOutput(tileId: number, tilesetId: string, weight: number): void {
        const tilesetIndex = this.tilesetRefManager.getTilesetRefIndex(tilesetId);
        if (tilesetIndex === -1) return;
        this.outputs.push(new RuleOutput({ tileId, tilesetIndex, weight }, this.tilesetRefManager));
        this.eventEmitter.emit("onChange");
    }

    public removeOutput(tileId: number, tilesetId: string): void {
        const tilesetIndex = this.tilesetRefManager.getTilesetRefIndex(tilesetId);
        if (tilesetIndex === -1) return;
        this.outputs = this.outputs.filter((o) => o.tileId !== tileId || o.tilesetIndex !== tilesetIndex);
        this.eventEmitter.emit("onChange");
    }

    public getConstraint(index: number): RuleConstraint {
        return this.constraints[index];
    }

    public isSatisfied(input: (RulesetRefData | null)[][]): boolean {
        const middleIndex = ((this.size * this.size) - 1) / 2;
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const constraintIndex = y * this.size + x;
                if (constraintIndex === middleIndex) continue;
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

        const tilesetId = this.tilesetRefManager.getTilesetRefId(selectedOutput.tilesetIndex)!;
        if (!tilesetId) return null;

        return { tileId: selectedOutput.tileId, tilesetId: tilesetId };
    }

    public getOutputs(): RuleOutput[] {
        return this.outputs;
    }

    public getConsrtaints(): RuleConstraint[] {
        return this.constraints;
    }

    public removeRulesetRef(rulesetIndex: number): void {
        this.constraints.forEach((constraint) => constraint.removeTarget(rulesetIndex));
    }

    public removeTilesetRef(tilesetIndex: number): void {
        this.outputs = this.outputs.filter((output) => output.tilesetIndex !== tilesetIndex);
    }

    public serialize(): RuleData {
        return {
            id: this.id,
            constraints: this.constraints.map((constraint) => constraint.serialize()).join(","),
            outputs: this.outputs.map((output) => output.serialize()).join(","),
        }
    }
}

export class RuleOutput {
    public tileId: number;
    public tilesetIndex: number;
    private weight: number;

    constructor(
        data: RuleOutputData,
        private readonly tilesetRefManager: TilesetRefManager
    ) {
        this.tileId = data.tileId;
        this.tilesetIndex = data.tilesetIndex;
        this.weight = data.weight;
    }
    
    public getOutputData(): { tileId: number, tilesetId: string, weight: number } | null {
        const tilesetId = this.tilesetRefManager.getTilesetRefId(this.tilesetIndex);
        if (!tilesetId) return null;
        return { tileId: this.tileId, tilesetId: tilesetId, weight: this.weight };
    }

    public setOutput(tileId: number, tilesetId: string): void {
        const tilesetIndex = this.tilesetRefManager.getTilesetRefIndex(tilesetId);
        if (tilesetIndex === -1) return;
        this.tileId = tileId;
    }

    public setWeight(weight: number): void {
        this.weight = weight;
    }

    public serialize(): string {
        return `${this.tileId}:${this.tilesetIndex}:${this.weight}`;
    }
}

export class RuleConstraint {
    private targetIndexs: Set<number> = new Set();
    private targetIds: Set<string> = new Set();
    private requirement: RuleRequirement = RuleRequirement.ANY;
    private allowEmpty: boolean = true;

    constructor(
        data: RuleConstraintData,
        private readonly rulesetRefManager: RulesetRefManager
    ) {
        this.targetIndexs = new Set(data.targetIndexs);
        this.requirement = data.requirement;
        this.allowEmpty = data.allowEmpty;

        this.targetIndexs.forEach((index) => {
            const targetId = this.rulesetRefManager.getRulesetRefId(index);
            if (targetId) this.targetIds.add(targetId);
        });
    }

    public getTargetIds(): string[] {
        return Array.from(this.targetIds);  
    }

    public addTarget(target: string | number): void {
        const targetIndex = typeof target === "string" ? this.rulesetRefManager.getRulesetRefIndex(target) : target;
        if (targetIndex === -1) return;
        this.targetIndexs.add(targetIndex);
        const targetId = this.rulesetRefManager.getRulesetRefId(targetIndex);
        if (targetId) this.targetIds.add(targetId);
    }

    public removeTarget(target: string | number): void {
        const targetIndex = typeof target === "string" ? this.rulesetRefManager.getRulesetRefIndex(target) : target;
        if (targetIndex === -1) return;
        this.targetIndexs.delete(targetIndex);
        const targetId = this.rulesetRefManager.getRulesetRefId(targetIndex);
        if (targetId) this.targetIds.delete(targetId);
    }

    public setRequirement(requirement: RuleRequirement): void {
        this.requirement = requirement;
    }

    public getRequirement(): RuleRequirement {
        return this.requirement;
    }

    public setAllowEmpty(allowEmpty: boolean): void {
        this.allowEmpty = allowEmpty;
    }

    public getAllowEmpty(): boolean {
        return this.allowEmpty;
    }

    public isSatisfied(targetId: string | null): boolean {
        if (this.requirement === RuleRequirement.ANY) {
            return true;
        } else if (this.requirement === RuleRequirement.EMPTY) {
            return targetId === null;
        } else if (this.requirement === RuleRequirement.IS) {
            if (targetId === null) return this.allowEmpty;
            return this.targetIds.has(targetId);
        } else if (this.requirement === RuleRequirement.NOT) {
            if (targetId === null) return !this.allowEmpty;
            return !this.targetIds.has(targetId);
        }
        return false;
    }

    public serialize(): string {
        return `${this.requirement}:${this.allowEmpty ? 1 : 0}:${Array.from(this.targetIndexs).join(".")}`;
    }
}