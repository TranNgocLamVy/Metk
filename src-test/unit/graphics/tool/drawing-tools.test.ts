import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/application/editor.facade", () => ({
    EditorFacade: class { },
}));

vi.mock("pixi.js", () => {
    class Point {
        constructor(public x = 0, public y = 0) { }
    }
    class Container {
        public children: any[] = [];
        public addChild = vi.fn((child: any) => {
            this.children.push(child);
            return child;
        });
    }
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
        public destroy = vi.fn();
        constructor(public texture?: any) { }
    }
    class Graphics {
        public clear = vi.fn(() => this);
        public moveTo = vi.fn(() => this);
        public lineTo = vi.fn(() => this);
        public stroke = vi.fn(() => this);
        public rect = vi.fn(() => this);
        public fill = vi.fn(() => this);
        public destroy = vi.fn();
    }
    class Color {
        constructor(public value: any) { }
    }

    return {
        Point,
        Container,
        Sprite,
        Graphics,
        Color,
        Texture: { WHITE: { id: "white-texture", width: 16, height: 16 } },
    };
});

import { RuleLayer } from "@/editor/model/tilemap/layer/rule-layer";
import { TileLayer } from "@/editor/model/tilemap/layer/tile-layer";
import { RuleBucketTool } from "@/graphics/tool/rule/rule-bucket.tool";
import { RuleEraserTool } from "@/graphics/tool/rule/rule-eraser.tool";
import { RuleLineTool } from "@/graphics/tool/rule/rule-line.tool";
import { RuleRectangleTool } from "@/graphics/tool/rule/rule-rectangle.tool";
import { RuleStampTool } from "@/graphics/tool/rule/rule-stamp.tool";
import { TileBucketTool } from "@/graphics/tool/tile/tile-bucket.tool";
import { TileEraserTool } from "@/graphics/tool/tile/tile-eraser.tool";
import { TileLineTool } from "@/graphics/tool/tile/tile-line.tool";
import { TileRectangleTool } from "@/graphics/tool/tile/tile-rectangle.tool";
import { TileStampTool } from "@/graphics/tool/tile/tile-stamp.tool";

import {
    createEditorHarness,
    createTileLayerRenderer,
    createViewHarness,
    pointer,
} from "./tool-test-utils";

const createDrawingHarness = () => {
    const editor = createEditorHarness();
    const view = createViewHarness(editor.session);
    const tileLayer = editor.tilemap.rootLayer.findLayer("tile-root") as TileLayer;
    const ruleLayer = editor.tilemap.rootLayer.findLayer("rule-root") as RuleLayer;
    const tileRenderer = createTileLayerRenderer(tileLayer, editor.tilemap);
    const ruleRenderer = {
        ...createTileLayerRenderer(tileLayer, editor.tilemap),
        layer: ruleLayer,
    };

    (editor.editorFacade as any).textureManager = {
        getTileTexture: vi.fn(() => ({ id: "tile-texture", width: 16, height: 16 })),
        getErrorTexture: vi.fn(async () => ({ id: "error-texture", width: 16, height: 16 })),
    };
    (editor.editorFacade as any).getActiveTilesetSession = vi.fn(() => ({
        selectionState: { selectedTilesSet: [1] },
        tileset: {
            getCoordinatesFromTile: vi.fn(() => ({ row: 0, col: 0 })),
            getTileFromCoordinates: vi.fn(() => ({ id: 1, tileset: { id: "tileset-a" } })),
        },
    }));
    (editor.editorFacade as any).currentWorkspace = {
        ...((editor.editorFacade as any).currentWorkspace ?? {}),
        rulesetSessionManager: {
            getSelectedRuleId: vi.fn(() => "ruleset-a"),
        },
        tilemapSessionManager: {
            getSessionByTilemapId: vi.fn(() => editor.session),
            activeSession: editor.session,
        },
    };
    (editor.editorFacade as any).currentProject = {
        rulesetManager: {
            getRulesetById: vi.fn(() => ({ id: "ruleset-a", color: "#22c55e" })),
        },
    };

    return { ...editor, ...view, tileLayer, ruleLayer, tileRenderer, ruleRenderer };
};

describe("layer-specific drawing tools", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("TileStampTool commits SetTilesCommand updates", () => {
        const { editorFacade, view, viewport, tileLayer, tileRenderer, historyManager } = createDrawingHarness();
        const tool = new TileStampTool(editorFacade);
        tool.onEnable();
        tool.setTargetLayerRenderer(tileRenderer as any);
        tool.attachView(view as any);

        viewport.emitPointer("pointerdown", pointer(0, 0));
        viewport.emitPointer("pointerup", pointer(0, 0));

        expect(tileLayer.getTileRefAt({ col: 0, row: 0 })).toEqual({ tileId: 1, tilesetId: "tileset-a" });
        expect(historyManager.execute).toHaveBeenCalledTimes(1);
    });

    it("RuleStampTool commits SetRulesCommand updates", () => {
        const { editorFacade, view, viewport, ruleLayer, ruleRenderer, historyManager } = createDrawingHarness();
        const tool = new RuleStampTool(editorFacade);
        tool.onEnable();
        tool.setTargetLayerRenderer(ruleRenderer as any);
        tool.attachView(view as any);

        viewport.emitPointer("pointerdown", pointer(1, 1));
        viewport.emitPointer("pointerup", pointer(1, 1));

        expect(ruleLayer.getRulesetRefAt({ col: 1, row: 1 })?.rulesetId).toBe("ruleset-a");
        expect(historyManager.execute).toHaveBeenCalledTimes(1);
    });

    it("TileEraserTool only erases tile refs", () => {
        const { editorFacade, view, viewport, tileLayer, tileRenderer, historyManager } = createDrawingHarness();
        const tool = new TileEraserTool(editorFacade);
        tool.onEnable();
        tool.setTargetLayerRenderer(tileRenderer as any);
        tool.attachView(view as any);

        expect(tileLayer.getTileRefAt({ col: 1, row: 0 })).toEqual({ tileId: 2, tilesetId: "tileset-a" });

        viewport.emitPointer("pointerdown", pointer(1, 0));
        viewport.emitPointer("pointerup", pointer(1, 0));

        expect(tileLayer.getTileRefAt({ col: 1, row: 0 })).toBeNull();
        expect(historyManager.execute).toHaveBeenCalledTimes(1);
    });

    it("RuleEraserTool only erases rule refs", () => {
        const { editorFacade, view, viewport, ruleLayer, ruleRenderer, historyManager } = createDrawingHarness();
        const tool = new RuleEraserTool(editorFacade);
        tool.onEnable();
        tool.setTargetLayerRenderer(ruleRenderer as any);
        tool.attachView(view as any);

        expect(ruleLayer.getRulesetRefAt({ col: 0, row: 0 })?.rulesetId).toBe("ruleset-a");

        viewport.emitPointer("pointerdown", pointer(0, 0));
        viewport.emitPointer("pointerup", pointer(0, 0));

        expect(ruleLayer.getRulesetRefAt({ col: 0, row: 0 })).toBeNull();
        expect(historyManager.execute).toHaveBeenCalledTimes(1);
    });

    it("TileBucketTool fills contiguous matching tile refs", () => {
        const { editorFacade, view, viewport, tileLayer, tileRenderer, historyManager } = createDrawingHarness();
        const tool = new TileBucketTool(editorFacade);
        tool.onEnable();
        tool.setTargetLayerRenderer(tileRenderer as any);
        tool.attachView(view as any);

        viewport.emitPointer("pointerdown", pointer(0, 1));

        expect(tileLayer.getTileRefAt({ col: 0, row: 1 })).toEqual({ tileId: 1, tilesetId: "tileset-a" });
        expect(tileLayer.getTileRefAt({ col: 1, row: 0 })).toEqual({ tileId: 2, tilesetId: "tileset-a" });
        expect(historyManager.execute).toHaveBeenCalledTimes(1);
    });

    it("RuleBucketTool fills contiguous matching ruleset refs", () => {
        const { editorFacade, view, viewport, ruleLayer, ruleRenderer, historyManager } = createDrawingHarness();
        const tool = new RuleBucketTool(editorFacade);
        tool.onEnable();
        tool.setTargetLayerRenderer(ruleRenderer as any);
        tool.attachView(view as any);

        viewport.emitPointer("pointerdown", pointer(1, 1));

        expect(ruleLayer.getRulesetRefAt({ col: 1, row: 1 })?.rulesetId).toBe("ruleset-a");
        expect(historyManager.execute).toHaveBeenCalledTimes(1);
    });

    it("TileLineTool commits tile updates along the calculated line", () => {
        const { editorFacade, view, viewport, tileLayer, tileRenderer, historyManager } = createDrawingHarness();
        const tool = new TileLineTool(editorFacade);
        tool.onEnable();
        tool.setTargetLayerRenderer(tileRenderer as any);
        tool.attachView(view as any);

        viewport.emitPointer("pointerdown", pointer(0, 0));
        viewport.emitPointer("pointermove", pointer(1, 0));
        viewport.emitPointer("pointerup", pointer(1, 0));

        expect(tileLayer.getTileRefAt({ col: 0, row: 0 })).toEqual({ tileId: 1, tilesetId: "tileset-a" });
        expect(tileLayer.getTileRefAt({ col: 1, row: 0 })).toEqual({ tileId: 1, tilesetId: "tileset-a" });
        expect(historyManager.execute).toHaveBeenCalledTimes(1);
    });

    it("RuleLineTool commits rule updates along the calculated line", () => {
        const { editorFacade, view, viewport, ruleLayer, ruleRenderer, historyManager } = createDrawingHarness();
        const tool = new RuleLineTool(editorFacade);
        tool.onEnable();
        tool.setTargetLayerRenderer(ruleRenderer as any);
        tool.attachView(view as any);

        viewport.emitPointer("pointerdown", pointer(0, 1));
        viewport.emitPointer("pointermove", pointer(1, 1));
        viewport.emitPointer("pointerup", pointer(1, 1));

        expect(ruleLayer.getRulesetRefAt({ col: 0, row: 1 })?.rulesetId).toBe("ruleset-a");
        expect(ruleLayer.getRulesetRefAt({ col: 1, row: 1 })?.rulesetId).toBe("ruleset-a");
        expect(historyManager.execute).toHaveBeenCalledTimes(1);
    });

    it("TileRectangleTool commits filled rectangle tile updates", () => {
        const { editorFacade, view, viewport, tileLayer, tileRenderer, historyManager } = createDrawingHarness();
        const tool = new TileRectangleTool(editorFacade);
        tool.onEnable();
        tool.setTargetLayerRenderer(tileRenderer as any);
        tool.attachView(view as any);

        viewport.emitPointer("pointerdown", pointer(0, 0));
        viewport.emitPointer("pointermove", pointer(1, 1));
        viewport.emitPointer("pointerup", pointer(1, 1));

        expect(tileLayer.getTileRefAt({ col: 0, row: 0 })).toEqual({ tileId: 1, tilesetId: "tileset-a" });
        expect(tileLayer.getTileRefAt({ col: 1, row: 0 })).toEqual({ tileId: 1, tilesetId: "tileset-a" });
        expect(tileLayer.getTileRefAt({ col: 0, row: 1 })).toEqual({ tileId: 1, tilesetId: "tileset-a" });
        expect(tileLayer.getTileRefAt({ col: 1, row: 1 })).toEqual({ tileId: 1, tilesetId: "tileset-a" });
        expect(historyManager.execute).toHaveBeenCalledTimes(1);
    });

    it("RuleRectangleTool commits filled rectangle rule updates", () => {
        const { editorFacade, view, viewport, ruleLayer, ruleRenderer, historyManager } = createDrawingHarness();
        const tool = new RuleRectangleTool(editorFacade);
        tool.onEnable();
        tool.setTargetLayerRenderer(ruleRenderer as any);
        tool.attachView(view as any);

        viewport.emitPointer("pointerdown", pointer(0, 0));
        viewport.emitPointer("pointermove", pointer(1, 1));
        viewport.emitPointer("pointerup", pointer(1, 1));

        expect(ruleLayer.getRulesetRefAt({ col: 0, row: 0 })?.rulesetId).toBe("ruleset-a");
        expect(ruleLayer.getRulesetRefAt({ col: 1, row: 0 })?.rulesetId).toBe("ruleset-a");
        expect(ruleLayer.getRulesetRefAt({ col: 0, row: 1 })?.rulesetId).toBe("ruleset-a");
        expect(ruleLayer.getRulesetRefAt({ col: 1, row: 1 })?.rulesetId).toBe("ruleset-a");
        expect(historyManager.execute).toHaveBeenCalledTimes(1);
    });
});
