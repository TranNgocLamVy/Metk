import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const rendererMocks = vi.hoisted(() => {
    class Container {
        public children: any[] = [];
        public label = "";
        public visible = true;
        public alpha = 1;
        public eventMode = "";
        public position = {
            x: 0,
            y: 0,
            set: vi.fn((x: number, y: number) => {
                this.position.x = x;
                this.position.y = y;
            }),
        };
        public listeners: Record<string, (...args: any[]) => void> = {};
        public addChild = vi.fn((child: any) => {
            this.children.push(child);
            return child;
        });
        public removeChildren = vi.fn(() => {
            const children = [...this.children];
            this.children = [];
            return children;
        });
        public setChildIndex = vi.fn((child: any, index: number) => {
            this.children = this.children.filter((existing) => existing !== child);
            this.children.splice(index, 0, child);
        });
        public on = vi.fn((eventName: string, handler: (...args: any[]) => void) => {
            this.listeners[eventName] = handler;
            return this;
        });
        public off = vi.fn();
        public toLocal = vi.fn((point: { x: number; y: number }) => point);
        public destroy = vi.fn();
    }

    class Sprite {
        public x = 0;
        public y = 0;
        public width = 0;
        public height = 0;
        public zIndex = 0;
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
        constructor(public texture?: any) {}
    }

    class Graphics {
        public rectCalls: any[] = [];
        public clear = vi.fn(() => this);
        public moveTo = vi.fn(() => this);
        public lineTo = vi.fn(() => this);
        public stroke = vi.fn(() => this);
        public fill = vi.fn(() => this);
        public rect = vi.fn((...args: any[]) => {
            this.rectCalls.push(args);
            return this;
        });
        public destroy = vi.fn();
    }

    class Point {
        constructor(public x = 0, public y = 0) {}
    }

    class Color {
        constructor(public value: any) {}
    }

    class Text {
        public label = "";
        public x = 0;
        public y = 0;
        public height = 12;
        public text: string;

        constructor(options: { text?: string }) {
            this.text = options.text ?? "";
        }

        public destroy = vi.fn();
    }

    return {
        Container,
        Sprite,
        Graphics,
        Text,
        Point,
        Color,
        Texture: { WHITE: { id: "white-texture" } },
        appKernel: {
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
        },
        workspaceService: {
            saveCurrentWorkspace: vi.fn(),
        },
    };
});

vi.mock("pixi.js", () => ({
    Container: rendererMocks.Container,
    Sprite: rendererMocks.Sprite,
    Graphics: rendererMocks.Graphics,
    Text: rendererMocks.Text,
    Point: rendererMocks.Point,
    Color: rendererMocks.Color,
    Texture: rendererMocks.Texture,
}));
vi.mock("@/application/bootstrap/app-kernel", () => ({ appKernel: rendererMocks.appKernel }));
vi.mock("@/shared/services/workspace.service", () => ({ WorkspaceService: rendererMocks.workspaceService }));

import { TileLayer } from "@/editor/model/tilemap/layer/tile-layer";
import { SingleImageTileset } from "@/editor/model/tileset/single-image-tileset";
import { EditorObjectRegistry } from "@/editor/registry/editor-object.registry";
import { BaseLayerRenderer } from "@/graphics/renderer/tilemap/base-layer.renderer";
import { TilemapGridRenderer } from "@/graphics/renderer/tilemap/tilemap-grid.renderer";
import { TilemapRenderer } from "@/graphics/renderer/tilemap/tilemap.renderer";
import { TilesetGridRenderer } from "@/graphics/renderer/tileset/single-tileset-grid.renderer";
import { TilesetSelectorRenderer } from "@/graphics/renderer/tileset/single-tileset-selector.renderer";
import { TilesetRenderer } from "@/graphics/renderer/tileset/single-tileset.renderer";
import { FilePathSystem, ProjectPathSystem } from "@/infrastructure/project-path-system";
import { GraphicUtils } from "@/shared/utils/graphic-utils";

import {
    createGroupLayerData,
    createRuleLayerData,
    createTileLayerData,
    createTilemap,
} from "../../application/commands/layer/layer-command-test-utils";

class ConcreteLayerRenderer extends BaseLayerRenderer<TileLayer> {
    public posToCoord(pos: Point2D): Coordinate {
        return { col: pos.x, row: pos.y };
    }

    public coordToPos(coord: Coordinate): Point2D {
        return { x: coord.col, y: coord.row };
    }
}

const flushAsync = async () => {
    await Promise.resolve();
    await Promise.resolve();
};

const viewportStub = {} as any;

type MockContainer = InstanceType<typeof rendererMocks.Container>;
type MockGraphics = InstanceType<typeof rendererMocks.Graphics>;
type MockSprite = InstanceType<typeof rendererMocks.Sprite>;

const createTileset = (overrides: Partial<ConstructorParameters<typeof SingleImageTileset>[0]> = {}) => {
    const projectPathSystem = new ProjectPathSystem("C:/Project/Metk/renderer-project");
    const filePathSystem = new FilePathSystem("tileset-a", projectPathSystem, "tilesets/tileset-a.json");
    return new SingleImageTileset(
        {
            id: "tileset-a",
            name: "Terrain",
            columns: 2,
            rows: 2,
            tileWidth: 16,
            tileHeight: 16,
            image: { source: "textures/terrain.png", width: 32, height: 32 },
            tiles: [],
            ...overrides,
        },
        filePathSystem,
        new EditorObjectRegistry(),
    );
};

beforeEach(() => {
    vi.clearAllMocks();
    rendererMocks.appKernel.editorFacade.textureManager.getTileTexture.mockImplementation((tilesetId: string, tileId: number) => ({
        id: `${tilesetId}:${tileId}`,
        width: 16,
        height: 16,
    }));
    rendererMocks.appKernel.editorFacade.textureManager.getErrorTexture.mockResolvedValue({ id: "error-texture", width: 16, height: 16 });
});

describe("BaseLayerRenderer and TilemapRenderer", () => {
    it("mirrors layer visibility and opacity through observable container state", () => {
        const tilemap = createTilemap([createTileLayerData({ id: "ground", name: "Ground", visible: true, opacity: 0.75 })]);
        const layer = tilemap.rootLayer.findLayer("ground") as TileLayer;
        const renderer = new ConcreteLayerRenderer(layer, tilemap);
        const off = vi.spyOn(layer.eventEmitter as any, "off");

        expect(renderer.container.label).toBe("Ground");
        expect(renderer.container.visible).toBe(true);
        expect(renderer.container.alpha).toBe(0.75);

        layer.toggleVisibility(false);
        layer.updateOpacity(0.25);

        expect(renderer.container.visible).toBe(false);
        expect(renderer.container.alpha).toBe(0.25);

        renderer.destroy();
        expect(off).toHaveBeenCalledWith("updateProperty", expect.any(Function));
        expect(renderer.container.destroy).toHaveBeenCalledWith({ children: true, texture: false });
    });

    it("builds a tilemap renderer tree, traverses nested layers, draws the border, and destroys children", async () => {
        const tilemap = createTilemap([
            createGroupLayerData({
                id: "group-a",
                name: "Group A",
                layers: [createTileLayerData({ id: "tile-a", name: "Nested Tile", layerData: "1:0,0\n0,0" })],
            }),
            createRuleLayerData({ id: "rule-root", name: "Rule Root", layerData: "0:-1:-1,0\n0,0" }),
        ]);

        const renderer = new TilemapRenderer({ tilemap, viewport: viewportStub });
        await flushAsync();

        expect(renderer.container.label).toBe("Tilemap-Root");
        expect(renderer.container.children).toContain(renderer.rootRenderer.container);
        expect(renderer.findLayerRenderer("group-a")).toBeTruthy();
        expect(renderer.findLayerRenderer("tile-a")).toBeTruthy();
        expect(renderer.findLayerRenderer("missing-layer")).toBeNull();

        const container = renderer.container as unknown as MockContainer;
        const borderGraphic = container.children.find((child: any) => child instanceof rendererMocks.Graphics) as MockGraphics | undefined;
        if (!borderGraphic) throw new Error("Expected tilemap border graphic to be rendered");
        expect(borderGraphic.moveTo).toHaveBeenCalledWith(0, 0);
        expect(borderGraphic.lineTo).toHaveBeenCalledWith(64, 0);
        expect(borderGraphic.lineTo).toHaveBeenCalledWith(64, 64);
        expect(borderGraphic.stroke).toHaveBeenCalledWith({ color: 0xffffff, pixelLine: true });

        renderer.destroy();

        expect(renderer.rootRenderer.container.destroy).toHaveBeenCalled();
        expect(renderer.container.destroy).toHaveBeenCalledWith({ children: true, texture: false });
    });
});

describe("TilesetRenderer", () => {
    it("renders tiles using cached textures and a single fallback error texture for missing tiles", async () => {
        const tileset = createTileset();
        rendererMocks.appKernel.editorFacade.textureManager.getTileTexture.mockImplementation((tilesetId: string, tileId: number) => {
            if (tileId === 1 || tileId === 2) return null;
            return { id: `${tilesetId}:${tileId}`, width: 16, height: 16 };
        });

        const renderer = new TilesetRenderer({ tileset, parent: new rendererMocks.Container() as any });
        await flushAsync();
        const container = renderer.container as unknown as MockContainer;
        const children = container.children as MockSprite[];

        expect(children).toHaveLength(4);
        expect(children[0].position.set).toHaveBeenCalledWith(0, 0);
        expect(children[1].position.set).toHaveBeenCalledWith(16, 0);
        expect(children[2].texture).toEqual({ id: "error-texture", width: 16, height: 16 });
        expect(rendererMocks.appKernel.editorFacade.textureManager.getErrorTexture).toHaveBeenCalledTimes(1);
        expect(rendererMocks.appKernel.textureManager.on).toHaveBeenCalledWith("onTextureReloaded", expect.any(Function));
    });

    it("updates tile positions when the grid gap changes and rerenders on matching texture reload", async () => {
        const tileset = createTileset();
        const renderer = new TilesetRenderer({ tileset, parent: new rendererMocks.Container() as any });
        await flushAsync();
        const container = renderer.container as unknown as MockContainer;
        const children = container.children as MockSprite[];

        expect(children[1].position.set).toHaveBeenLastCalledWith(16, 0);
        expect(children[2].position.set).toHaveBeenLastCalledWith(0, 16);

        const reloadHandler = rendererMocks.appKernel.textureManager.on.mock.calls.find(([eventName]) => eventName === "onTextureReloaded")![1];
        container.removeChildren.mockClear();
        reloadHandler("other-tileset");
        expect(container.removeChildren).not.toHaveBeenCalled();

        reloadHandler("tileset-a");
        await flushAsync();
        expect(container.removeChildren).toHaveBeenCalledTimes(1);
    });

    it("destroys sprites and unregisters texture reload listener", async () => {
        const renderer = new TilesetRenderer({ tileset: createTileset(), parent: new rendererMocks.Container() as any });
        await flushAsync();
        const firstSprite = renderer.container.children[0];

        renderer.destroy();

        expect(firstSprite.destroy).toHaveBeenCalledTimes(1);
        expect(renderer.container.destroy).toHaveBeenCalled();
        expect(rendererMocks.appKernel.textureManager.off).toHaveBeenCalledWith("onTextureReloaded", expect.any(Function));
    });
});

describe("TilesetSelectorRenderer", () => {
    const createSelectorHarness = (selectionState = { selectedTilesSet: [] as number[], pivot: null as Coordinate | null }) => {
        const tileset = createTileset();
        const parent = new rendererMocks.Container();
        const session = {
            selectionState,
            updateSelectionState: vi.fn(function (this: any, state: any) {
                this.selectionState = { ...this.selectionState, ...state };
            }),
            updatePivot: vi.fn(),
        };
        const selector = new TilesetSelectorRenderer({ tileset, tilesetSession: session as any, parent: parent as any });
        return { tileset, parent, session, selector };
    };

    it("restores initial selection from session state and keeps the session observable", () => {
        const { selector, session } = createSelectorHarness({ selectedTilesSet: [0, 3], pivot: { row: 0, col: 0 } });

        expect(selector.getSelectedTiles()).toEqual([
            [expect.objectContaining({ id: 0 }), null],
            [null, expect.objectContaining({ id: 3 })],
        ]);
        expect(session.updateSelectionState).toHaveBeenCalledWith({ selectedTilesSet: [0, 3] });
        expect(rendererMocks.workspaceService.saveCurrentWorkspace).toHaveBeenCalledWith({ waitForTimeout: false });
    });

    it("selects a dragged rectangle of tiles and persists selection state", () => {
        const { parent, session, selector } = createSelectorHarness();

        parent.listeners.pointerdown({ globalX: 1, globalY: 1, originalEvent: { button: 0, ctrlKey: false, metaKey: false } });
        parent.listeners.pointermove({ globalX: 31, globalY: 31, originalEvent: { button: 0 } });
        parent.listeners.pointerup({ globalX: 31, globalY: 31, originalEvent: { button: 0 } });

        expect(session.updateSelectionState).toHaveBeenLastCalledWith({
            selectedTilesSet: [0, 1, 2, 3],
        });
        expect(session.updatePivot).not.toHaveBeenCalled();
        expect(selector.getSelectedTiles()).toHaveLength(2);
        expect(rendererMocks.workspaceService.saveCurrentWorkspace).toHaveBeenLastCalledWith({ waitForTimeout: false });
    });

    it("ignores out-of-bounds and non-left pointer starts without mutating selection", () => {
        const { parent, session, selector } = createSelectorHarness();

        parent.listeners.pointerdown({ globalX: 999, globalY: 999, originalEvent: { button: 0 } });
        parent.listeners.pointerdown({ globalX: 1, globalY: 1, originalEvent: { button: 2 } });

        expect(session.updateSelectionState).not.toHaveBeenCalled();
        expect(selector.getSelectedTiles()).toEqual([]);
    });

    it("clears selection and detaches parent listeners on destroy", () => {
        const { parent, selector } = createSelectorHarness({ selectedTilesSet: [0], pivot: { row: 0, col: 0 } });

        selector.clearSelection();
        expect(selector.getSelectedTiles()).toEqual([]);
        expect(selector.graphics.clear).toHaveBeenCalled();

        selector.destroy();
        expect(parent.off).toHaveBeenCalledWith("pointerdown", expect.any(Function));
        expect(parent.off).toHaveBeenCalledWith("pointerupoutside", expect.any(Function));
        expect(selector.graphics.destroy).toHaveBeenCalled();
    });
});

describe("Grid renderers", () => {
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

    it("reduces tilemap grid density for very large viewports while preserving observable redraw behavior", () => {
        const tilemap = createTilemap();
        const viewport = {
            left: 0,
            top: 0,
            right: 10000,
            bottom: 10000,
            scaled: 0.5,
            on: vi.fn(),
        };

        const renderer = new TilemapGridRenderer({ viewport: viewport as any, tilemap });
        vi.advanceTimersByTime(100);

        expect(viewport.on).toHaveBeenCalledWith("moved", expect.any(Function));
        expect(GraphicUtils.drawVerticelDashLine).not.toHaveBeenCalled();

        renderer.enableGrid();
        expect(GraphicUtils.drawVerticelDashLine).toHaveBeenCalled();
        expect(GraphicUtils.drawVerticelLine).toHaveBeenCalled();
        expect(
            vi.mocked(GraphicUtils.drawVerticelLine).mock.calls.length
            + vi.mocked(GraphicUtils.drawVerticelDashLine).mock.calls.length,
        ).toBeLessThanOrEqual(251);

        renderer.disableGrid();
        vi.mocked(GraphicUtils.drawVerticelLine).mockClear();
        vi.mocked(GraphicUtils.drawVerticelDashLine).mockClear();
        renderer.enableGrid();
        expect(GraphicUtils.drawVerticelLine).toHaveBeenCalled();
    });

    it("redraws a tileset grid after tileset updates and stops listening after destroy", () => {
        const tileset = createTileset();
        const renderer = new TilesetGridRenderer({ viewport: {} as any, tileset });

        expect(GraphicUtils.drawVerticelLine).toHaveBeenCalledTimes(3);

        vi.mocked(GraphicUtils.drawVerticelLine).mockClear();
        tileset.eventEmitter.emit("update");
        expect(GraphicUtils.drawVerticelLine).toHaveBeenCalledTimes(3);

        const off = vi.spyOn(tileset.eventEmitter, "off");
        renderer.destroy();
        expect(off).toHaveBeenCalledWith("update", expect.any(Function));
    });
});
