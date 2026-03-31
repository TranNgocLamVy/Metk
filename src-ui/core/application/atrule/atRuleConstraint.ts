import { ATConstraint, ATRuleConstraintData } from "@/shared/schema/atRuleSchema";

export class ATRuleConstraint {
    private targets: string[];
    private constraint: ATConstraint;
    
    constructor(data: ATRuleConstraintData) {
        this.targets = data.targets;
        this.constraint = data.constraint;
    }

    public getTargets(): string[] {
        return this.targets;
    }
    
    public addTarget(targetId: string): void {
        this.targets.push(targetId);
    }

    public removeTarget(targetId: string): void {
        this.targets = this.targets.filter((target) => target !== targetId);
    }

    public clearAll(): void {
        this.targets = [];
    }

    public setConstraint(constraint: ATConstraint): void {
        this.constraint = constraint;
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