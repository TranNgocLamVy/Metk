import { ATRuleData, ATOutputData, ATRuleConstraintData } from "@/shared/schema/atRuleSchema";
import { ATRuleConstraint} from "./atRuleConstraint";
import { ATRuleSet } from "./atRuleSet";

export class ATRule {
    public readonly id: string;
    public size: { width: number; height: number };
    private constraints: ATRuleConstraint[];
    private output: ATOutputData | null;
    constructor(data: ATRuleData) {
        this.id = data.id;
        this.size = data.size;
        this.constraints = data.constraints.map((constraint) => new ATRuleConstraint(constraint));
        if (this.constraints.length < this.size.width * this.size.height) {
            for (let i = this.constraints.length; i < this.size.width * this.size.height; i++) {
                this.constraints.push(new ATRuleConstraint({ constraint: "ANY", targets: [] }));
            }
        }
        this.output = data.output;
    }

    public setOutput(output: ATOutputData): void {
        this.output = output;
    }

    public isSatisfied(input: (ATRuleSet | null)[][]): boolean {
        for (let y = 0; y < this.size.height; y++) {
            for (let x = 0; x < this.size.width; x++) {
                const constraintIndex = y * this.size.width + x;
                const constraint = this.constraints[constraintIndex];
                const targetSet = input[y][x];
                if (!constraint.isSatisfied(targetSet ? targetSet.id : null)) {
                    return false;
                }
            }
        }
        return true;
    }

    public getOutput(): ATOutputData | null {
        return this.output;
    }

    public getConstaints(): ATRuleConstraint[] {
        return this.constraints;
    }

    public serialize(): ATRuleData {
        return {
            id: this.id,
            size: this.size,
            constraints: this.constraints.map((constraint) => constraint.serialize()),
            output: this.output,
        }
    }
}