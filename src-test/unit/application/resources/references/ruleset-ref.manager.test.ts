import { describe, expect, it, vi } from "vitest";

import { RulesetRefManager } from "@/application/resources/references/ruleset-ref.manager";

const createManager = () => {
    const rulesetManager = {
        getRulesetMetadataById: vi.fn((id: string) => {
            if (id.startsWith("missing")) return null;
            return { id, name: `${id} name`, color: "#ffffff", rulesetRelPath: `rulesets/${id}.json` };
        }),
    };

    return {
        manager: new RulesetRefManager(rulesetManager as any, {} as any),
        rulesetManager,
    };
};

describe("RulesetRefManager", () => {
    it("normalizes empty loaded data and assigns new references from zero", () => {
        const { manager } = createManager();

        manager.loadData(null as any, null as any);

        expect(manager.getRulesetRefIndex("grass-rule")).toBe(0);
        expect(manager.serialize()).toEqual({
            refs: [{ index: 0, id: "grass-rule", name: "grass-rule name" }],
            nextIndex: 1,
        });
    });

    it("returns existing reference indexes without duplicating entries", () => {
        const { manager, rulesetManager } = createManager();
        manager.loadData([{ index: 2, id: "grass-rule", name: "Grass Rule" }], 4);

        expect(manager.getRulesetRefIndex("grass-rule")).toBe(2);
        expect(manager.getRefIds()).toEqual(["grass-rule"]);
        expect(rulesetManager.getRulesetMetadataById).not.toHaveBeenCalled();
    });

    it("returns -1 when metadata is unavailable for a new reference", () => {
        const { manager } = createManager();
        manager.loadData([], 0);

        expect(manager.getRulesetRefIndex("missing-rule")).toBe(-1);
        expect(manager.serialize()).toEqual({ refs: [], nextIndex: 0 });
    });

    it("replaces references by id or index and removes them without reindexing", () => {
        const { manager } = createManager();
        manager.loadData([
            { index: 0, id: "grass-rule", name: "Grass Rule" },
            { index: 6, id: "water-rule", name: "Water Rule" },
        ], 8);

        manager.replaceRulesetRef("grass-rule", "sand-rule");
        manager.replaceRulesetRef(6, "lava-rule");

        expect(manager.getRulesetRefId(0)).toBe("sand-rule");
        expect(manager.getRulesetRefId(6)).toBe("lava-rule");
        expect(manager.removeRulesetRef("sand-rule")).toBe(0);
        expect(manager.removeRulesetRef(6)).toBe(6);
        expect(manager.removeRulesetRef("missing-rule")).toBe(-1);
        expect(manager.serialize()).toEqual({ refs: [], nextIndex: 8 });
    });
});
