import { ATRuleSet } from "./atRuleSet";

enum ATCondition {
    ANY,
    REQUIRE,
    EMPTY
}

export type ATRuleReqData = {
    target: string;
    condition: ATCondition;
}

export class ATRuleReq {
    public get target(): string { return this.data.target; }
    public get condition(): ATCondition { return this.data.condition; }
    constructor(private data: ATRuleReqData) { }
    
    public updateRequirement(payload: Partial<ATRuleReqData>) {
        this.data = {...this.data, ...payload};
    }
    public isSatisfied(ruleset: ATRuleSet): boolean {
        // TODO: implement
        return false;
    }
}