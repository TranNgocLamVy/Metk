import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const graphicsMock = vi.hoisted(() => {
    class Container {
        public children: any[] = [];
        public label = "";
        public visible = true;
        public alpha = 1;
        public destroyed = false;
        public addChild = vi.fn((child: any) => {
            this.children.push(child);
            return child;
        });
        public setChildIndex = vi.fn((child: any, index: number) => {
            this.children = this.children.filter((item) => item !== child);
            this.children.splice(index, 0, child);
        });
        public destroy = vi.fn(() => {
            this.destroyed = true;
        });
    }

    class Sprite {
        public x = 0;
        public y = 0;
        public width = 0;
        public height = 0;
        public tint: any = null;
        public texture: any = null;
        public destroyed = false;
        public destroy = vi.fn(() => {
            this.destroyed = true;
        });
    }

    class Graphics {
        public clear = vi.fn(() => this);
        public moveTo = vi.fn(() => this);
        public lineTo = vi.fn(() => this);
        public stroke = vi.fn(() => this);
        public destroy = vi.fn();
    }

    class Point {
        constructor(public x = 0, public y = 0) {}
    }

    class Color {
        constructor(public value: any) {}
    }

    return {
        Container: vi.fn(Container),
        Sprite: vi.fn(Sprite),
        Graphics: vi.fn(Graphics),
        Point,
        Color: vi.fn(Color),
        Texture: { WHITE: { id: "white-texture" } },
    };
});

const appMock = vi.hoisted(() => ({
    textureManager: {
        on: vi.fn(),
        off: vi.fn(),
    },
    editorFacade: {
        textureManager: {
            getTileTexture: vi.fn(),
            getErrorTexture: vi.fn(),
        },
    },
}));

vi.mock("pixi.js", () => graphicsMock);
vi.mock("@/application/bootstrap/app-kernel", () => ({ appKernel: appMock }));

import { TileLayerRenderer } from "@/graphics/renderer/tilemap/tile-layer.renderer";
import { RuleLayerRenderer } from "@/graphics/renderer/tilemap/rule-layer.renderer";
import { GroupLayerRenderer } from "@/graphics/renderer/tilemap/group-layer.renderer";
import { TilemapGridRenderer } from "@/graphics/renderer/tilemap/tilemap-grid.renderer";
import { TilesetGridRenderer } from "@/graphics/renderer/tileset/single-tileset-grid.renderer";
import { RuleLayerData, TileLayerData } from "@/shared/schema/layer.schema";
import { TileLayer } from "@/editor/model/tilemap/layer/tile-layer";
import { RuleLayer } from "@/editor/model/tilemap/layer/rule-layer";
import { Tileset } from "@/editor/model/tileset/tileset";
import { EditorObjectRegistry } from "@/editor/registry/editor-object.registry";
import { FilePathSystem, ProjectPathSystem } from "@/infrastructure/project-path-system";
import { GraphicUtils } from "@/shared/utils/graphic-utils";

import {
    createGroupLayerData,
    createRuleLayerData,
    createTileLayerData,
    createTilemap,
} from "../../application/commands/layer/layer-command-test-utils";
import { createReferenceContext } from "../../editor/editor-test-utils";

const flushAsync = async () => {
    await Promise.resolve();
    await Promise.resolve();
};

const createTileLayer = (overrides: Partial<TileLayerData> = {}) => {
    const tilemap = createTilemap([createTileLayerData({
        id: "tile-layer",
        name: "Ground",
        width: 3,
        height: 3,
        layerData: "1:0,0,0\n0,0,0\n0,0,0",
        ...overrides,
    })]);
    return {
        tilemap,
        layer: tilemap.rootLayer.findLayer("tile-layer") as TileLayer,
    };
};

const createRuleLayer = (overrides: Partial<RuleLayerData> = {}) => {
    const tilemap = createTilemap([createRuleLayerData({
        id: "rule-layer",
        name: "Rules",
        width: 3,
        height: 3,
        layerData: "0:-1:-1,0,0\n0,0,0\n0,0,0",
        ...overrides,
    })]);
    return {
        tilemap,
        layer: tilemap.rootLayer.findLayer("rule-layer") as RuleLayer,
    };
};

const spriteMap = (renderer: unknown): Map<string, any> => (renderer as any).sprites;

describe("layer renderers", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        appMock.editorFacade.textureManager.getTileTexture.mockReturnValue({ id: "tile-texture", width: 16, height: 16 });
        appMock.editorFacade.textureManager.getErrorTexture.mockResolvedValue({ id: "error-texture" });
    });

    it("renders tile sprites from layer data and falls back to error texture when texture is missing", async () => {
        const { tilemap, layer } = createTileLayer();
        appMock.editorFacade.textureManager.getTileTexture.mockReturnValueOnce(null);

        const renderer = new TileLayerRenderer({ layer, tilemap });
        await flushAsync();

        const sprite = spriteMap(renderer).get("0,0");
        expect(sprite).toBeDefined();
        expect(sprite.x).toBe(0);
        expect(sprite.y).toBe(0);
        expect(sprite.texture).toEqual({ id: "error-texture" });
        expect(sprite.width).toBe(16);
        expect(sprite.height).toBe(16);
        expect(renderer.container.visible).toBe(true);
        expect(renderer.container.alpha).toBe(1);
    });

    it("updates tile sprites when cells change and removes them when cells become empty", async () => {
        const { tilemap, layer } = createTileLayer({ layerData: "0,0,0\n0,0,0\n0,0,0" });
        const renderer = new TileLayerRenderer({ layer, tilemap });
        await flushAsync();

        expect(spriteMap(renderer).size).toBe(0);

        layer.setTilesAt([{ coordinate: { col: 1, row: 1 }, tileId: 3, tilesetId: "tileset-a" }]);
        await flushAsync();

        expect(spriteMap(renderer).get("1,1")).toBeDefined();

        const sprite = spriteMap(renderer).get("1,1");
        layer.setTilesAt([{ coordinate: { col: 1, row: 1 }, tileId: null, tilesetId: null }]);
        await flushAsync();

        expect(sprite.destroy).toHaveBeenCalledTimes(1);
        expect(spriteMap(renderer).has("1,1")).toBe(false);
    });

    it("updates base renderer properties from visible and opacity changes", () => {
        const { tilemap, layer } = createTileLayer();
        const renderer = new TileLayerRenderer({ layer, tilemap });

        layer.toggleVisibility(false);
        layer.updateOpacity(0.35);

        expect(renderer.container.visible).toBe(false);
        expect(renderer.container.alpha).toBe(0.35);
    });

    it("renders rule references as colored fallback sprites without texture output", async () => {
        const { tilemap, layer } = createRuleLayer();
        (layer.rulesetRefManager.rulesetManager.getRulesetById as any) = vi.fn(() => ({
            id: "ruleset-a",
            color: "#ffaa00",
            calculateOutput: vi.fn(() => null),
        }));

        const renderer = new RuleLayerRenderer({ layer, tilemap });
        await flushAsync();

        const sprite = spriteMap(renderer).get("0,0");
        expect(sprite).toBeDefined();
        expect(sprite.texture).toEqual({ id: "white-texture" });
        expect(sprite.width).toBe(16);
        expect(sprite.height).toBe(16);
    });

    it("uses error textures for rule refs with missing output texture references", async () => {
        const { tilemap, layer } = createRuleLayer({ layerData: "0:12:0,0,0\n0,0,0\n0,0,0" });
        (layer.rulesetRefManager.rulesetManager.getRulesetById as any) = vi.fn(() => ({
            id: "ruleset-a",
            color: "#ffaa00",
            calculateOutput: vi.fn(() => ({ tileId: 12, tilesetId: "tileset-a" })),
        }));
        appMock.editorFacade.textureManager.getTileTexture.mockReturnValue(null);

        const renderer = new RuleLayerRenderer({ layer, tilemap });
        await flushAsync();

        const sprite = spriteMap(renderer).get("0,0");
        expect(sprite.texture).toEqual({ id: "error-texture" });
        expect(sprite.tint).toBe(0xFFFFFF);
    });

    it("creates nested group child renderers, responds to removal, and destroys descendants", () => {
        const tilemap = createTilemap([
            createGroupLayerData({
                id: "group-a",
                name: "Group A",
                layers: [createTileLayerData({ id: "tile-a", name: "Nested Tile", layerData: "0,0\n0,0" })],
            }),
            createTileLayerData({ id: "tile-root", name: "Root Tile", layerData: "0,0\n0,0" }),
        ]);
        const renderer = new GroupLayerRenderer({ layer: tilemap.rootLayer, tilemap });

        expect(renderer.findChildRenderer("root")).toBe(renderer);
        expect(renderer.findChildRenderer("group-a")).toBeInstanceOf(GroupLayerRenderer);
        expect(renderer.findChildRenderer("tile-a")).toBeInstanceOf(TileLayerRenderer);
        expect(renderer.container.children).toHaveLength(2);

        tilemap.rootLayer.removeLayer("tile-root");

        expect(renderer.findChildRenderer("tile-root")).toBeNull();

        renderer.destroy();

        expect(renderer.container.destroy).toHaveBeenCalled();
        expect(appMock.textureManager.off).toHaveBeenCalled();
    });
});

describe("grid renderers", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.spyOn(GraphicUtils, "drawVerticelLine").mockImplementation(() => undefined as any);
        vi.spyOn(GraphicUtils, "drawHorizontalLine").mockImplementation(() => undefined as any);
        vi.spyOn(GraphicUtils, "drawVerticelDashLine").mockImplementation(() => undefined as any);
        vi.spyOn(GraphicUtils, "drawHorizontalDashLine").mockImplementation(() => undefined as any);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it("registers viewport grid redraw events and draws tilemap grid lines", () => {
        const tilemap = createTilemap();
        const viewport = {
            left: 0,
            top: 0,
            right: 64,
            bottom: 32,
            scaled: 2,
            on: vi.fn(),
        };

        const renderer = new TilemapGridRenderer({ viewport: viewport as any, tilemap });
        vi.advanceTimersByTime(100);

        expect(viewport.on).toHaveBeenCalledWith("moved", expect.any(Function));
        expect(viewport.on).toHaveBeenCalledWith("zoomed", expect.any(Function));
        expect(viewport.on).toHaveBeenCalledWith("resize", expect.any(Function));
        expect(GraphicUtils.drawVerticelDashLine).toHaveBeenCalled();
        expect(GraphicUtils.drawHorizontalDashLine).toHaveBeenCalled();

        renderer.disableGrid();
        expect(renderer.gridEnabled).toBe(false);
        expect(renderer.graphics.clear).toHaveBeenCalled();

        vi.mocked(GraphicUtils.drawVerticelLine).mockClear();
        vi.mocked(GraphicUtils.drawHorizontalLine).mockClear();
        renderer.enableGrid();
        expect(renderer.gridEnabled).toBe(true);
        expect(GraphicUtils.drawVerticelLine).toHaveBeenCalled();
    });

    it("draws tileset grid lines, respects disabled state, and unregisters update listener", () => {
        const projectPathSystem = new ProjectPathSystem("C:/Project/Metk/grid-test");
        const tilesetPathSystem = new FilePathSystem("tileset-a", projectPathSystem, "tilesets/tileset-a.json");
        const tileset = new Tileset({
            id: "tileset-a",
            name: "Terrain",
            columns: 2,
            rows: 2,
            tilewidth: 16,
            tileheight: 16,
            image: { source: "terrain.png", width: 32, height: 32 },
            tiles: [],
        }, tilesetPathSystem, new EditorObjectRegistry());
        const viewport = {};

        const renderer = new TilesetGridRenderer({ viewport: viewport as any, tileset });

        expect(GraphicUtils.drawVerticelLine).toHaveBeenCalledTimes(3);
        expect(GraphicUtils.drawHorizontalLine).toHaveBeenCalledTimes(3);

        renderer.disableGrid();
        expect(renderer.gridEnabled).toBe(false);
        expect(renderer.graphics.clear).toHaveBeenCalled();

        vi.mocked(GraphicUtils.drawVerticelLine).mockClear();
        renderer.rerenderGrid();
        expect(GraphicUtils.drawVerticelLine).not.toHaveBeenCalled();

        renderer.enableGrid();
        expect(GraphicUtils.drawVerticelLine).toHaveBeenCalled();

        const off = vi.spyOn(tileset.eventEmitter, "off");
        renderer.destroy();
        expect(off).toHaveBeenCalledWith("update", expect.any(Function));
    });
});
