import { TilesetRefData } from "./tileset.data";

export enum RuleRequirement {
    ANY = 0,
    EMPTY = 1,
    IS = 2,
    NOT = 3,
}

export type RuleConstraintData = {
    requirement: RuleRequirement;
    targetIndexs: number[];
    allowEmpty: boolean;
};

export type RuleOutputData = {
    tileId: number;
    tilesetIndex: number;
    weight: number;
};

export type RuleData = {
    id: string;
    constraints: string;
    outputs: string;
};

export type RulesetRefData = {
    index: number;
    id: string;
    name: string;
};

export type RulesetData = {
    id: string;
    name: string;
    color: string;
    size: number;
    rules: RuleData[];
    tilesets: {
        refs: TilesetRefData[];
        nextIndex: number;
    };
    rulesets: {
        refs: RulesetRefData[];
        nextIndex: number;
    };
};

export type CreateRulesetPayload = Pick<RulesetData, "id" | "name" | "color" | "size">;

export type RulesetMetadata = {
    name: string;
    id: string;
    rulesetRelPath: string;
    color: string;
};
