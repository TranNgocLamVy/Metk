import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/application/editor.facade", () => ({
    EditorFacade: class { },
}));

vi.mock("@/graphics/tool/tool.decorator", () => ({
    Tool: () => () => undefined,
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
        Texture: { WHITE: { id: "white-texture" } },
    };
});

import { BucketTool } from "@/graphics/tool/bucket.tool";
import { EraserTool } from "@/graphics/tool/eraser.tool";
import { LineTool } from "@/graphics/tool/line.tool";
import { RectangleTool } from "@/graphics/tool/rectangle.tool";
import { StampTool } from "@/graphics/tool/stamp.tool";
import { TileLayer } from "@/editor/model/tilemap/layer/tile-layer";

import {
    createDrawStrategy,
    createEditorHarness,
    createTileLayerRenderer,
    createViewHarness,
    pointer,
} from "./tool-test-utils";

const createDrawingHarness = () => {
    const editor = createEditorHarness();
    const view = createViewHarness(editor.session);
    const layer = editor.tilemap.rootLayer.findLayer("tile-root") as TileLayer;
    const renderer = createTileLayerRenderer(layer, editor.tilemap);

    return { ...editor, ...view, layer, renderer };
};

describe("StampTool", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("accumulates stamped payloads while dragging and commits them on pointer up", () => {
        const { editorFacade, view, viewport, overlayerContainer, renderer } = createDrawingHarness();
        const strategy = createDrawStrategy();
        const tool = new StampTool(editorFacade);
        tool.onEnable();
        tool.setDrawStrategy(strategy);
        tool.setTargetLayerRenderer(renderer as any);
        tool.attachView(view as any);

        viewport.emitPointer("pointerdown", pointer(0, 0));
        viewport.emitPointer("pointermove", pointer(2, 0));
        viewport.emitPointer("pointerup", pointer(2, 0));

        expect(strategy.commit).toHaveBeenCalledTimes(1);
        expect((strategy.commit as any).mock.calls[0][1].map((payload: any) => payload.key)).toEqual(["0,0", "1,0", "2,0"]);
        expect(overlayerContainer.addChild).toHaveBeenCalled();
    });

    it("draws hover preview before dragging and removes listeners on detach", () => {
        const { editorFacade, view, viewport, renderer } = createDrawingHarness();
        const strategy = createDrawStrategy();
        const tool = new StampTool(editorFacade);
        tool.onEnable();
        tool.setDrawStrategy(strategy);
        tool.setTargetLayerRenderer(renderer as any);
        tool.attachView(view as any);

        viewport.emitPointer("pointermove", pointer(1, 1));
        tool.detach();

        expect(strategy.drawHoverPreview).toHaveBeenCalledTimes(1);
        expect(viewport.off).toHaveBeenCalledWith("pointerdown", expect.any(Function));
        expect(viewport.removeEventListener).toHaveBeenCalledWith("mouseleave", expect.any(Function));
    });

    it("does nothing when no draw strategy or target renderer is available", () => {
        const { editorFacade, view, viewport } = createDrawingHarness();
        const strategy = createDrawStrategy();
        const tool = new StampTool(editorFacade);
        tool.onEnable();
        tool.setDrawStrategy(strategy);
        tool.attachView(view as any);

        viewport.emitPointer("pointerdown", pointer(0, 0));
        viewport.emitPointer("pointerup", pointer(0, 0));

        expect(strategy.getPayload).not.toHaveBeenCalled();
        expect(strategy.commit).not.toHaveBeenCalled();
    });
});

describe("LineTool", () => {
    it("previews a line during drag and commits line payloads only when history is available", () => {
        const { editorFacade, view, viewport, renderer } = createDrawingHarness();
        const strategy = createDrawStrategy();
        const tool = new LineTool(editorFacade);
        tool.onEnable();
        tool.setDrawStrategy(strategy);
        tool.setTargetLayerRenderer(renderer as any);
        tool.attachView(view as any);

        viewport.emitPointer("pointerdown", pointer(0, 0));
        viewport.emitPointer("pointermove", pointer(2, 0));
        viewport.emitPointer("pointerup", pointer(2, 0));

        expect(strategy.commit).toHaveBeenCalledTimes(1);
        expect((strategy.commit as any).mock.calls[0][1].map((payload: any) => payload.key)).toEqual(["0,0", "1,0", "2,0"]);
    });

    it("does not commit a finished line when there is no history manager", () => {
        const { editorFacade, view, viewport, renderer } = createDrawingHarness();
        (editorFacade.getCurrentHistoryManager as any).mockReturnValue(null);
        const strategy = createDrawStrategy();
        const tool = new LineTool(editorFacade);
        tool.onEnable();
        tool.setDrawStrategy(strategy);
        tool.setTargetLayerRenderer(renderer as any);
        tool.attachView(view as any);

        viewport.emitPointer("pointerdown", pointer(0, 0));
        viewport.emitPointer("pointermove", pointer(2, 0));
        viewport.emitPointer("pointerup", pointer(2, 0));

        expect(strategy.commit).not.toHaveBeenCalled();
    });
});

describe("RectangleTool", () => {
    it("commits rectangle payloads for the dragged bounds", () => {
        const { editorFacade, view, viewport, renderer } = createDrawingHarness();
        const strategy = createDrawStrategy();
        const tool = new RectangleTool(editorFacade);
        tool.onEnable();
        tool.setDrawStrategy(strategy);
        tool.setTargetLayerRenderer(renderer as any);
        tool.attachView(view as any);

        viewport.emitPointer("pointerdown", pointer(0, 0));
        viewport.emitPointer("pointermove", pointer(1, 1));
        viewport.emitPointer("pointerup", pointer(1, 1));

        expect(strategy.commit).toHaveBeenCalledTimes(1);
        expect((strategy.commit as any).mock.calls[0][1].map((payload: any) => payload.key)).toEqual(["0,0", "0,1", "1,0", "1,1"]);
    });

    it("uses square bounds when shift is held while drawing", () => {
        const { editorFacade, view, viewport, renderer } = createDrawingHarness();
        const strategy = createDrawStrategy();
        const tool = new RectangleTool(editorFacade);
        tool.onEnable();
        tool.setDrawStrategy(strategy);
        tool.setTargetLayerRenderer(renderer as any);
        tool.attachView(view as any);

        viewport.emitPointer("pointerdown", pointer(0, 0, { shiftKey: true }));
        viewport.emitPointer("pointermove", pointer(2, 1, { shiftKey: true }));
        viewport.emitPointer("pointerup", pointer(2, 1, { shiftKey: true }));

        expect((strategy.commit as any).mock.calls[0][1].map((payload: any) => payload.key)).toEqual([
            "0,0", "0,1", "0,2",
            "1,0", "1,1", "1,2",
            "2,0", "2,1", "2,2",
        ]);
    });
});

describe("BucketTool", () => {
    it("flood-fills contiguous empty cells and commits the generated payloads", () => {
        const { editorFacade, view, viewport, renderer } = createDrawingHarness();
        const strategy = createDrawStrategy({ getRefAt: vi.fn(() => null) });
        const tool = new BucketTool(editorFacade);
        tool.onEnable();
        tool.setDrawStrategy(strategy);
        tool.setTargetLayerRenderer(renderer as any);
        tool.attachView(view as any);

        viewport.emitPointer("pointermove", pointer(0, 0));
        viewport.emitPointer("pointerdown", pointer(0, 0));

        expect(strategy.commit).toHaveBeenCalledTimes(1);
        expect((strategy.commit as any).mock.calls[0][1]).toHaveLength(16);
    });

    it("fills only the clicked cell when the target cell already has a reference", () => {
        const { editorFacade, view, viewport, renderer } = createDrawingHarness();
        const strategy = createDrawStrategy({ getRefAt: vi.fn(() => ({ tileId: 1, tilesetId: "tileset-a" })) });
        const tool = new BucketTool(editorFacade);
        tool.onEnable();
        tool.setDrawStrategy(strategy);
        tool.setTargetLayerRenderer(renderer as any);
        tool.attachView(view as any);

        viewport.emitPointer("pointerdown", pointer(1, 1));

        expect(strategy.commit).toHaveBeenCalledTimes(1);
        expect((strategy.commit as any).mock.calls[0][1].map((payload: any) => payload.key)).toEqual(["1,1"]);
    });

    it("does not commit out-of-bound bucket payloads", () => {
        const { editorFacade, view, viewport, renderer } = createDrawingHarness();
        const strategy = createDrawStrategy();
        const tool = new BucketTool(editorFacade);
        tool.onEnable();
        tool.setDrawStrategy(strategy);
        tool.setTargetLayerRenderer(renderer as any);
        tool.attachView(view as any);

        viewport.emitPointer("pointerdown", pointer(-1, 0));

        expect(strategy.commit).not.toHaveBeenCalled();
    });
});

describe("EraserTool", () => {
    it("erases referenced cells immediately and records a batch command when the drag finishes", () => {
        const { editorFacade, view, viewport, renderer, layer, historyManager } = createDrawingHarness();
        const strategy = createDrawStrategy({ getRefAt: vi.fn(() => ({ tileId: 2, tilesetId: "tileset-a" })) });
        const tool = new EraserTool(editorFacade);
        tool.onEnable();
        tool.setDrawStrategy(strategy);
        tool.setTargetLayerRenderer(renderer as any);
        tool.attachView(view as any);

        expect(layer.getTileRefAt({ col: 1, row: 0 })).toEqual({ tileId: 2, tilesetId: "tileset-a" });

        viewport.emitPointer("pointerdown", pointer(1, 0));
        viewport.emitPointer("pointerup", pointer(1, 0));

        expect(layer.getTileRefAt({ col: 1, row: 0 })).toBeNull();
        expect(historyManager.pushToUndoStack).toHaveBeenCalledTimes(1);
    });

    it("reverses temporary erase commands when no history manager is available", () => {
        const { editorFacade, view, viewport, renderer, layer } = createDrawingHarness();
        (editorFacade.getCurrentHistoryManager as any).mockReturnValue(null);
        const strategy = createDrawStrategy({ getRefAt: vi.fn(() => ({ tileId: 2, tilesetId: "tileset-a" })) });
        const tool = new EraserTool(editorFacade);
        tool.onEnable();
        tool.setDrawStrategy(strategy);
        tool.setTargetLayerRenderer(renderer as any);
        tool.attachView(view as any);

        viewport.emitPointer("pointerdown", pointer(1, 0));
        viewport.emitPointer("pointerup", pointer(1, 0));

        expect(layer.getTileRefAt({ col: 1, row: 0 })).toEqual({ tileId: 2, tilesetId: "tileset-a" });
    });

    it("does not erase out-of-bound cells or empty cells", () => {
        const { editorFacade, view, viewport, renderer, layer, historyManager } = createDrawingHarness();
        const strategy = createDrawStrategy({ getRefAt: vi.fn(() => null) });
        const tool = new EraserTool(editorFacade);
        tool.onEnable();
        tool.setDrawStrategy(strategy);
        tool.setTargetLayerRenderer(renderer as any);
        tool.attachView(view as any);

        viewport.emitPointer("pointerdown", pointer(10, 10));
        viewport.emitPointer("pointerup", pointer(10, 10));

        expect(layer.getTileRefAt({ col: 1, row: 0 })).toEqual({ tileId: 2, tilesetId: "tileset-a" });
        expect(historyManager.pushToUndoStack).not.toHaveBeenCalled();
    });
});
