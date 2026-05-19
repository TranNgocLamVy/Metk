import { describe, expect, it, vi } from "vitest";

import { RuleLayer } from "@/editor/model/tilemap/layer/rule-layer";
import { RootLayer } from "@/editor/model/tilemap/layer/root-layer";
import { Ruleset } from "@/editor/model/ruleset/ruleset";
import { RuleLayerData } from "@/shared/schema/layer.schema";
import {
    createReferenceContext,
    createRulesetData,
    loadRulesetRefs,
    loadTilesetRefs,
    registerLoadedRuleset,
} from "./editor-test-utils";

const createRuleLayer = (overrides: Partial<RuleLayerData> = {}) => {
    const context = createReferenceContext({ tilesets: ["tileset-a"], rulesets: ["terrain"] });
    loadTilesetRefs(context.tilesetRefManager, ["tileset-a"]);
    loadRulesetRefs(context.rulesetRefManager, ["terrain"]);

    const ruleset = new Ruleset(
        createRulesetData({
            id: "terrain",
            name: "Terrain",
            size: 3,
            tilesets: { refs: [{ index: 0, id: "tileset-a", name: "Tileset A" }], nextIndex: 1 },
            rules: [{ id: "fallback", constraints: "", outputs: "12:0:1" }],
        }),
        context.filePathSystem,
        context.tilesetRefManager,
        context.rulesetRefManager,
    );
    registerLoadedRuleset(context.rulesetManager, ruleset);

    const parent = new RootLayer([], context.tilesetRefManager, context.rulesetRefManager);
    const data: RuleLayerData = {
        id: "rule-layer",
        parentId: "root",
        type: "auto_rule",
        name: "Auto Rules",
        x: 0,
        y: 0,
        width: 3,
        height: 3,
        opacity: 1,
        visible: true,
        locked: false,
        offsetx: 0,
        offsety: 0,
        layerData: "0:-1:-1,0,0\n0,0,0\n0,0,0",
        ...overrides,
    };

    return {
        layer: new RuleLayer(data, parent, context.tilesetRefManager, context.rulesetRefManager),
        context,
    };
};

describe("RuleLayer", () => {
    it("returns rule references with calculated output data when output indices are valid", () => {
        const { layer } = createRuleLayer({ layerData: "0:12:0,0,0\n0,0,0\n0,0,0" });

        expect(layer.getRulesetRefAt({ col: 0, row: 0 })).toEqual({
            rulesetId: "terrain",
            output: { tileId: 12, tilesetId: "tileset-a" },
        });
        expect(layer.getRulesetRefAt({ col: 2, row: 2 })).toBeNull();
        expect(layer.getRulesetRefAt({ col: -1, row: 0 })).toBeNull();
    });

    it("sets and removes rule references while returning previous ruleset ids", () => {
        const { layer } = createRuleLayer({ layerData: "0,0,0\n0,0,0\n0,0,0" });
        const changed = vi.fn();
        layer.eventEmitter.on("rulesetRefsOutputChanged", changed);

        const setResult = layer.setRuleRefsAt([{ coordinate: { col: 1, row: 1 }, rulesetId: "terrain" }]);
        expect(setResult).toEqual({
            status: "Success",
            data: [{ coordinate: { col: 1, row: 1 }, oldRulesetId: null }],
        });
        expect(layer.getRulesetRefAt({ col: 1, row: 1 })).toEqual({
            rulesetId: "terrain",
            output: { tileId: 12, tilesetId: "tileset-a" },
        });

        const removeResult = layer.setRuleRefsAt([{ coordinate: { col: 1, row: 1 }, rulesetId: null }]);
        expect(removeResult).toEqual({
            status: "Success",
            data: [{ coordinate: { col: 1, row: 1 }, oldRulesetId: "terrain" }],
        });
        expect(layer.getRulesetRefAt({ col: 1, row: 1 })).toBeNull();
        expect(changed).toHaveBeenCalledTimes(2);
    });

    it("recalculates all rule outputs and serializes deterministic layer data", () => {
        const { layer } = createRuleLayer({ layerData: "0:-1:-1,0,0\n0,0:-1:-1,0\n0,0,0" });
        const changed = vi.fn();
        layer.eventEmitter.on("rulesetRefsOutputChanged", changed);

        layer.reCalculateAllOutputs();

        expect(layer.serialize()).toEqual(expect.objectContaining({
            id: "rule-layer",
            parentId: "root",
            type: "auto_rule",
            layerData: "0:12:0,0,0\n0,0:12:0,0\n0,0,0",
        }));
        expect(changed).toHaveBeenCalledWith([{ col: 0, row: 0 }, { col: 1, row: 1 }]);
    });

    it("clears cells that reference removed rulesets or tileset outputs", () => {
        const { layer } = createRuleLayer({ layerData: "0:12:0,0,0\n0,0:-1:-1,0\n0,0,0" });

        layer.removeTilesetRef(0);
        expect(layer.serialize().layerData).toBe("0,0,0\n0,0:-1:-1,0\n0,0,0");

        layer.removeRulesetRef(0);
        expect(layer.serialize().layerData).toBe("0,0,0\n0,0,0\n0,0,0");
    });
});
