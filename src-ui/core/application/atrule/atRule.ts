import { TileRef } from "../tile/layer/tileLayer";
import { ATRuleReq, ATRuleReqData } from "./atRuleRequirement";
import { ATRuleSet } from "./atRuleSet";

export type ATRuleData = {
    id: string;
    size: {
        width: number;
        height: number;
    }
    reqData: ATRuleReqData[][];
}

export class ATRule {
    public get id(): string { return this.data.id; }
    private ruleReq: ATRuleReq[][] = [];

    constructor(private data: ATRuleData) {
        this.data.reqData.forEach((reqData) => {
            this.ruleReq.push(reqData.map((req) => new ATRuleReq(req)));
        });
    }

    public isSatisfied(input: (ATRuleSet | null)[][]): boolean {
        // TODO: implement
        return false;
    }

    public getOutput(): TileRef {
        // TODO: implement
        throw new Error("Not implemented.");
    }
}