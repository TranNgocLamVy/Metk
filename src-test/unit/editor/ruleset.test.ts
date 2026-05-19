import { describe, expect, it, vi } from "vitest";

import { Ruleset } from "@/editor/model/ruleset/ruleset";
import { createReferenceContext, createRulesetData } from "./editor-test-utils";

describe("Ruleset", () => {
    it("calculates output from the first satisfied rule", () => {
        const context = createReferenceContext({ tilesets: ["tileset-a"], rulesets: ["terrain"] });
        const ruleset = new Ruleset(
            createRulesetData({
                id: "terrain",
                name: "Terrain",
                size: 3,
                tilesets: { refs: [{ index: 0, id: "tileset-a", name: "Tileset A" }], nextIndex: 1 },
                rules: [
                    { id: "requires-neighbor", constraints: "2:0:0", outputs: "1:0:1" },
                    { id: "fallback", constraints: "", outputs: "2:0:1" },
                ],
            }),
            context.filePathSystem,
            context.tilesetRefManager,
            context.rulesetRefManager,
        );

        expect(ruleset.calculateOutput([
            [null, null, null],
            [null, { rulesetId: "terrain" }, null],
            [null, null, null],
        ])).toEqual({ tileId: 2, tilesetId: "tileset-a" });
    });

    it("updates matching rulesets, removes absent rules, and emits an update event", () => {
        const context = createReferenceContext({ tilesets: ["tileset-a"], rulesets: ["terrain"] });
        const ruleset = new Ruleset(
            createRulesetData({
                id: "terrain",
                name: "Terrain",
                color: "#111111",
                rules: [
                    { id: "rule-a", constraints: "", outputs: "1:0:1" },
                    { id: "rule-b", constraints: "", outputs: "" },
                ],
            }),
            context.filePathSystem,
            context.tilesetRefManager,
            context.rulesetRefManager,
        );
        const onUpdated = vi.fn();
        ruleset.eventEmitter.on("onUpdated", onUpdated);

        ruleset.updateRuleset(createRulesetData({
            id: "terrain",
            name: "Updated Terrain",
            color: "#222222",
            rules: [
                { id: "rule-a", constraints: "", outputs: "3:0:1" },
                { id: "rule-c", constraints: "", outputs: "" },
            ],
        }));

        expect(ruleset.name).toBe("Updated Terrain");
        expect(ruleset.color).toBe("#222222");
        expect(ruleset.getAllRules().map((rule) => rule.id)).toEqual(["rule-a", "rule-c"]);
        expect(ruleset.getRule("rule-a")?.serialize().outputs).toBe("3:0:1");
        expect(onUpdated).toHaveBeenCalledTimes(1);
    });

    it("serializes rule, tileset reference, and ruleset reference state after removals", () => {
        const context = createReferenceContext({ tilesets: ["tileset-a"], rulesets: ["terrain", "neighbor"] });
        const ruleset = new Ruleset(
            createRulesetData({
                id: "terrain",
                rulesets: { refs: [{ index: 0, id: "terrain", name: "Terrain" }, { index: 1, id: "neighbor", name: "Neighbor" }], nextIndex: 2 },
                tilesets: { refs: [{ index: 0, id: "tileset-a", name: "Tileset A" }], nextIndex: 1 },
                rules: [{ id: "rule-a", constraints: "2:0:1", outputs: "4:0:1" }],
            }),
            context.filePathSystem,
            context.tilesetRefManager,
            context.rulesetRefManager,
        );

        expect(ruleset.removeRulesetRef("neighbor")).toBe(true);
        expect(ruleset.removeTilesetRef("tileset-a")).toBe(true);
        expect(ruleset.removeTilesetRef("missing-tileset")).toBe(false);

        expect(ruleset.serialize()).toEqual(expect.objectContaining({
            id: "terrain",
            rules: [expect.objectContaining({ id: "rule-a", outputs: "" })],
            tilesets: { refs: [], nextIndex: 1 },
            rulesets: { refs: [{ index: 0, id: "terrain", name: "terrain name" }], nextIndex: 2 },
        }));
    });
});
