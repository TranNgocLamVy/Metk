import { beforeEach, describe, expect, it, vi } from "vitest";

const pixiMock = vi.hoisted(() => {
    class Sprite {
        public alpha = 1;
        public width = 0;
        public height = 0;
        public tint: any = null;
        public position = {
            x: 0,
            y: 0,
            set: vi.fn((x: number, y: number) => {
                this.position.x = x;
                this.position.y = y;
            }),
        };

        constructor(public texture?: any) {}
    }

    class Color {
        constructor(public value: any) {}
    }

    class Point {
        constructor(public x = 0, public y = 0) {}
    }

    return {
        Sprite: vi.fn(Sprite),
        Color: vi.fn(Color),
        Point,
        Texture: { WHITE: { id: "white-texture" } },
    };
});

vi.mock("pixi.js", () => pixiMock);

import { DrawRuleStrategy } from "@/graphics/strategies/draw-rule.strategy";
import { DrawTileStrategy } from "@/graphics/strategies/draw-tile.strategy";
import { SetRulesCommand } from "@/application/commands/tile/set-rules.command";
import { SetTilesCommand } from "@/application/commands/tile/set-tiles.command";
import { RuleLayer } from "@/editor/model/tilemap/layer/rule-layer";
import { TileLayer } from "@/editor/model/tilemap/layer/tile-layer";

import { createTilemap } from "../../application/commands/layer/layer-command-test-utils";

const createOverlay = () => ({
    children: [] as any[],
    addChild: vi.fn(function (this: any, child: any) {
        this.children.push(child);
        return child;
    }),
});

const createTileSelectionSession = () => {
    const tileset = {
        id: "tileset-a",
        getCoordinatesFromTile: vi.fn((tileId: number) => ({
            0: { row: 0, col: 0 },
            2: { row: 1, col: 0 },
            3: { row: 1, col: 1 },
        })[tileId] ?? null),
        getTileFromCoordinates: vi.fn((row: number, col: number) => {
            const id = row * 2 + col;
            return { id, tileset };
        }),
    };

    return {
        tileset,
        selectionState: { selectedTilesSet: [0, 3] },
    };
};

const createStrategyHarness = () => {
    const tilemap = createTilemap();
    const tileLayer = tilemap.rootLayer.findLayer("tile-root") as TileLayer;
    const ruleLayer = tilemap.rootLayer.findLayer("rule-root") as RuleLayer;
    const tileRenderer = {
        layer: tileLayer,
        posToCoord: vi.fn((pos: Position) => ({ col: Math.floor(pos.x / 16), row: Math.floor(pos.y / 16) })),
        coordToPos: vi.fn((coord: Coordinate) => ({ x: coord.col * 16, y: coord.row * 16 })),
    };
    const ruleRenderer = {
        layer: ruleLayer,
        posToCoord: vi.fn((pos: Position) => ({ col: Math.floor(pos.x / 16), row: Math.floor(pos.y / 16) })),
        coordToPos: vi.fn((coord: Coordinate) => ({ x: coord.col * 16, y: coord.row * 16 })),
    };
    const historyManager = {
        startTransaction: vi.fn(),
        execute: vi.fn(),
        commitTransaction: vi.fn(),
    };
    const textureA = { id: "texture-a", width: 16, height: 16 };
    const editorFacade = {
        textureManager: {
            getTileTexture: vi.fn(() => textureA),
        },
        getActiveTilesetSession: vi.fn(() => createTileSelectionSession()),
        getCurrentHistoryManager: vi.fn(() => historyManager),
        workspaceManager: {
            currentWorkspace: {
                rulesetSessionManager: {
                    getSelectedRuleId: vi.fn(() => "ruleset-a"),
                },
            },
        },
        currentProject: {
            rulesetManager: {
                getRulesetById: vi.fn((id: string) => ({ id, color: "#44aa66" })),
            },
        },
    };
    const session = {
        tilemap,
    };

    return { tilemap, tileLayer, ruleLayer, tileRenderer, ruleRenderer, historyManager, textureA, editorFacade, session };
};

describe("DrawTileStrategy", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("handles tile layer renderers and compares positions by tile coordinates", () => {
        const { tileRenderer } = createStrategyHarness();
        const strategy = new DrawTileStrategy();

        expect(strategy.canHandle(tileRenderer as any, {} as any)).toBe(true);
        expect(strategy.comparePosition({ x: 1, y: 1 }, { x: 15, y: 15 }, tileRenderer as any)).toBe(true);
        expect(strategy.comparePosition({ x: 1, y: 1 }, { x: 17, y: 1 }, tileRenderer as any)).toBe(false);
        expect(strategy.comparePosition(null as any, { x: 1, y: 1 }, tileRenderer as any)).toBe(false);
    });

    it("builds sparse tile payloads from the selected tileset region", () => {
        const { tileRenderer, editorFacade, session, textureA } = createStrategyHarness();
        const strategy = new DrawTileStrategy();

        const payload = strategy.getPayload({ x: 16, y: 16 }, tileRenderer as any, editorFacade as any, session as any);

        expect(payload.map((item) => ({
            key: item.key,
            coordinate: item.coordinate,
            tileId: item.tileId,
            tilesetId: item.tilesetId,
            position: item.position,
        }))).toEqual([
            { key: "1,1", coordinate: { col: 1, row: 1 }, tileId: 0, tilesetId: "tileset-a", position: { x: 16, y: 16 } },
            { key: "2,2", coordinate: { col: 2, row: 2 }, tileId: 3, tilesetId: "tileset-a", position: { x: 32, y: 32 } },
        ]);
        expect(payload[0].sprite.texture).toBe(textureA);
        expect(payload[0].sprite.alpha).toBe(DrawTileStrategy.spriteAlpha);
    });

    it("skips out-of-bounds cells and missing textures", () => {
        const { tileRenderer, editorFacade, session } = createStrategyHarness();
        const strategy = new DrawTileStrategy();
        (editorFacade.textureManager.getTileTexture as any).mockImplementation((tilesetId: string, tileId: number) => tileId === 0 ? null : { id: "ok" });

        const payload = strategy.getPayload({ x: 32, y: 32 }, tileRenderer as any, editorFacade as any, session as any);

        expect(payload.map((item) => item.key)).toEqual(["3,3"]);
    });

    it("draws hover preview sprites into the overlay and returns nothing without a tileset selection", () => {
        const { tileRenderer, editorFacade, session } = createStrategyHarness();
        const overlay = createOverlay();
        const strategy = new DrawTileStrategy();

        expect(strategy.drawHoverPreview({ x: 0, y: 0 }, tileRenderer as any, editorFacade as any, session as any, overlay as any)).toHaveLength(2);
        expect(overlay.addChild).toHaveBeenCalledTimes(2);

        (editorFacade.getActiveTilesetSession as any).mockReturnValue(null);
        expect(strategy.drawHoverPreview({ x: 0, y: 0 }, tileRenderer as any, editorFacade as any, session as any, overlay as any)).toEqual([]);
    });

    it("commits tile payloads through a SetTilesCommand transaction", () => {
        const { tileRenderer, editorFacade, historyManager } = createStrategyHarness();
        const strategy = new DrawTileStrategy();

        strategy.commit(tileRenderer as any, [
            { key: "0,0", coordinate: { col: 0, row: 0 }, position: { x: 0, y: 0 }, sprite: {} as any, tileId: 7, tilesetId: "tileset-a" },
        ], editorFacade as any);

        expect(historyManager.startTransaction).toHaveBeenCalledTimes(1);
        expect(historyManager.execute.mock.calls[0][0]).toBeInstanceOf(SetTilesCommand);
        expect(historyManager.commitTransaction).toHaveBeenCalledTimes(1);

        (editorFacade.getCurrentHistoryManager as any).mockReturnValue(null);
        strategy.commit(tileRenderer as any, [{ key: "1,1", coordinate: { col: 1, row: 1 }, position: { x: 16, y: 16 }, sprite: {} as any }], editorFacade as any);
        expect(historyManager.execute).toHaveBeenCalledTimes(1);
    });
});

describe("DrawRuleStrategy", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("handles rule layer renderers and returns selected rule payloads", () => {
        const { ruleRenderer, editorFacade, session } = createStrategyHarness();
        const strategy = new DrawRuleStrategy();

        expect(strategy.canHandle(ruleRenderer as any, {} as any)).toBe(true);
        expect(strategy.getBrushSize(editorFacade as any)).toEqual({ width: 1, height: 1 });

        const payload = strategy.getPayload({ x: 16, y: 0 }, ruleRenderer as any, editorFacade as any, session as any);

        expect(payload).toHaveLength(1);
        expect(payload[0]).toMatchObject({
            key: "1,0",
            coordinate: { col: 1, row: 0 },
            position: { x: 16, y: 0 },
            rulesetId: "ruleset-a",
        });
        expect(payload[0].sprite.texture).toEqual({ id: "white-texture" });
        expect(payload[0].sprite.alpha).toBe(DrawRuleStrategy.spriteAlpha);
    });

    it("returns no rule payload without selected/project rules or outside map bounds", () => {
        const { ruleRenderer, editorFacade, session } = createStrategyHarness();
        const strategy = new DrawRuleStrategy();

        (editorFacade.workspaceManager.currentWorkspace.rulesetSessionManager.getSelectedRuleId as any).mockReturnValue(null);
        expect(strategy.getPayload({ x: 0, y: 0 }, ruleRenderer as any, editorFacade as any, session as any)).toEqual([]);

        (editorFacade.workspaceManager.currentWorkspace.rulesetSessionManager.getSelectedRuleId as any).mockReturnValue("ruleset-a");
        (editorFacade as any).currentProject = null;
        expect(strategy.getPayload({ x: 0, y: 0 }, ruleRenderer as any, editorFacade as any, session as any)).toEqual([]);

        (editorFacade as any).currentProject = { rulesetManager: { getRulesetById: vi.fn(() => ({ id: "ruleset-a", color: "#fff" })) } };
        expect(strategy.getPayload({ x: 999, y: 0 }, ruleRenderer as any, editorFacade as any, session as any)).toEqual([]);
    });

    it("draws rule hover previews and commits rule payloads through a transaction", () => {
        const { ruleRenderer, editorFacade, session, historyManager } = createStrategyHarness();
        const overlay = createOverlay();
        const strategy = new DrawRuleStrategy();

        const sprites = strategy.drawHoverPreview({ x: 0, y: 0 }, ruleRenderer as any, editorFacade as any, session as any, overlay as any);

        expect(sprites).toHaveLength(1);
        expect(overlay.addChild).toHaveBeenCalledWith(sprites[0]);

        strategy.commit(ruleRenderer as any, [
            { key: "0,0", coordinate: { col: 0, row: 0 }, position: { x: 0, y: 0 }, sprite: {} as any, rulesetId: "ruleset-a" },
        ], editorFacade as any);

        expect(historyManager.startTransaction).toHaveBeenCalledTimes(1);
        expect(historyManager.execute.mock.calls[0][0]).toBeInstanceOf(SetRulesCommand);
        expect(historyManager.commitTransaction).toHaveBeenCalledTimes(1);
    });
});
