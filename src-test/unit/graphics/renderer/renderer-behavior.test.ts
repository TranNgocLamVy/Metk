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
            child.parent = this;
            return child;
        });
        public removeChild = vi.fn((child: any) => {
            this.children = this.children.filter((existing) => existing !== child);
            child.parent = null;
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
        public parent: Container | null = null;
        public x = 0;
        public y = 0;
        public width = 0;
        public height = 0;
        public zIndex = 0;
        public tint: any = null;
        public roundPixels = false;
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

    class TilingSprite extends Sprite {
        public tilePosition = {
            x: 0,
            y: 0,
            set: vi.fn((x: number, y: number) => {
                this.tilePosition.x = x;
                this.tilePosition.y = y;
            }),
        };

        constructor(options: { texture?: any } = {}) {
            super(options.texture);
        }
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
        public roundPixels = false;
        public anchor = {
            x: 0,
            y: 0,
            set: vi.fn((x: number, y: number) => {
                this.anchor.x = x;
                this.anchor.y = y;
            }),
        };

        constructor(options: { text?: string }) {
            this.text = options.text ?? "";
        }

        public destroy = vi.fn();
    }

    return {
        Container,
        Sprite,
        TilingSprite,
        Graphics,
        Text,
        Point,
        Color,
        Texture: { WHITE: { id: "white-texture" } },
        appKernel: {
            textureManager: {
                on: vi.fn(),
                off: vi.fn(),
                getTileTexture: vi.fn(),
                getErrorTexture: vi.fn(),
            },
            editorFacade: {
                currentProject: {
                    entityCollectionManager: {
                        on: vi.fn(),
                        off: vi.fn(),
                    },
                },
                textureManager: {
                    getTileTexture: vi.fn(),
                    getErrorTexture: vi.fn(),
                },
            },
        },
        workspaceService: {
            saveCurrentWorkspace: vi.fn(),
        },
        fs: {
            BaseDirectory: { AppData: "appData" },
            exists: vi.fn(),
            readFile: vi.fn(),
            readTextFile: vi.fn(),
            writeTextFile: vi.fn(),
            writeFile: vi.fn(),
            mkdir: vi.fn(),
            remove: vi.fn(),
            create: vi.fn(),
        },
        textureUtils: {
            processTexture: vi.fn(),
        },
    };
});

vi.mock("pixi.js", () => ({
    Container: rendererMocks.Container,
    Sprite: rendererMocks.Sprite,
    TilingSprite: rendererMocks.TilingSprite,
    Graphics: rendererMocks.Graphics,
    Text: rendererMocks.Text,
    Point: rendererMocks.Point,
    Color: rendererMocks.Color,
    Texture: rendererMocks.Texture,
}));
vi.mock("@/application/bootstrap/app-kernel", () => ({ appKernel: rendererMocks.appKernel }));
vi.mock("@/shared/services/workspace.service", () => ({ WorkspaceService: rendererMocks.workspaceService }));
vi.mock("@tauri-apps/plugin-fs", () => rendererMocks.fs);
vi.mock("@/shared/utils/texture.utils", () => ({ TextureUtils: rendererMocks.textureUtils }));

import { EntityDefinition } from "@/editor/model/entity/entity-definition";
import { EntityLayer } from "@/editor/model/tilemap/layer/entity-layer";
import { ImageLayer } from "@/editor/model/tilemap/layer/image-layer";
import { TileLayer } from "@/editor/model/tilemap/layer/tile-layer";
import { SingleImageTileset } from "@/editor/model/tileset/single-image-tileset";
import { EditorObjectRegistry } from "@/editor/registry/editor-object.registry";
import { BaseLayerRenderer } from "@/graphics/renderer/tilemap/base-layer.renderer";
import { EntityLayerRenderer } from "@/graphics/renderer/tilemap/entity-layer.renderer";
import { ImageLayerRenderer } from "@/graphics/renderer/tilemap/image-layer.renderer";
import { TilemapGridRenderer } from "@/graphics/renderer/tilemap/tilemap-grid.renderer";
import { TilemapRenderer } from "@/graphics/renderer/tilemap/tilemap.renderer";
import { TilesetGridRenderer } from "@/graphics/renderer/tileset/single-tileset-grid.renderer";
import { TilesetSelectorRenderer } from "@/graphics/renderer/tileset/single-tileset-selector.renderer";
import { TilesetRenderer } from "@/graphics/renderer/tileset/single-tileset.renderer";
import { FilePathSystem, ProjectPathSystem } from "@/infrastructure/project-path-system";
import { EntityLayerData, ImageLayerData } from "@/shared/data-types/layer.data";
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
    for (let index = 0; index < 8; index++) {
        await Promise.resolve();
    }
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

const createImageLayerData = (overrides: Partial<ImageLayerData> = {}): ImageLayerData => ({
    id: "image-layer",
    type: "image",
    name: "Backdrop",
    opacity: 1,
    visible: true,
    locked: false,
    offsetx: 0,
    offsety: 0,
    parallaxx: 1,
    parallaxy: 1,
    tintcolor: "",
    repeatx: false,
    repeaty: false,
    image: { source: "images/backdrop.png", width: 32, height: 24 },
    ...overrides,
});

const createEntityLayerData = (overrides: Partial<EntityLayerData> = {}): EntityLayerData => ({
    id: "entity-layer",
    type: "entity",
    name: "Entities",
    opacity: 1,
    visible: true,
    locked: false,
    offsetx: 2,
    offsety: 3,
    entities: [{
        id: "entity-1",
        name: "Spawn",
        entityRef: {
            entityCollectionId: "collection-a",
            entityDefinitionId: "definition-a",
        },
        x: 12,
        y: 14,
    }],
    ...overrides,
});

beforeEach(() => {
    vi.clearAllMocks();
    rendererMocks.appKernel.editorFacade.textureManager.getTileTexture.mockImplementation((tilesetId: string, tileId: number) => ({
        id: `${tilesetId}:${tileId}`,
        width: 16,
        height: 16,
    }));
    rendererMocks.appKernel.editorFacade.textureManager.getErrorTexture.mockResolvedValue({ id: "error-texture", width: 16, height: 16 });
    rendererMocks.appKernel.textureManager.getTileTexture.mockImplementation((tilesetId: string, tileId: number) => ({
        id: `${tilesetId}:${tileId}`,
        width: 16,
        height: 16,
    }));
    rendererMocks.appKernel.textureManager.getErrorTexture.mockResolvedValue({ id: "error-texture", width: 16, height: 16 });
    rendererMocks.fs.exists.mockResolvedValue(true);
    rendererMocks.fs.readFile.mockResolvedValue(new Uint8Array([1, 2, 3]));
    rendererMocks.textureUtils.processTexture.mockResolvedValue({
        id: "image-texture",
        width: 32,
        height: 24,
        destroy: vi.fn(),
    });
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
        layer.rename("Renamed Ground");

        expect(renderer.container.visible).toBe(false);
        expect(renderer.container.alpha).toBe(0.25);
        expect(renderer.container.label).toBe("Renamed Ground");

        renderer.destroy();
        expect(off).toHaveBeenCalledWith("updateProperty", expect.any(Function));
        expect(renderer.container.destroy).toHaveBeenCalledWith({ children: true, texture: false });
    });

    it("handles object-shaped updateProperty payloads when syncing base properties", () => {
        const tilemap = createTilemap([createTileLayerData({ id: "ground", name: "Ground", visible: true })]);
        const layer = tilemap.rootLayer.findLayer("ground") as TileLayer;
        const renderer = new ConcreteLayerRenderer(layer, tilemap);

        layer.visible = false;
        (layer.eventEmitter as any).emit("updateProperty", { key: "visible", value: false });

        expect(renderer.container.visible).toBe(false);
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

describe("ImageLayerRenderer", () => {
    const createViewport = () => ({
        center: { x: 64, y: 32 },
        left: 0,
        top: 0,
        right: 128,
        bottom: 96,
        on: vi.fn(),
        off: vi.fn(),
    });

    it("updates transform and tint from layer properties without reloading the image", async () => {
        const tilemap = createTilemap([createImageLayerData()]);
        const layer = tilemap.rootLayer.findLayer("image-layer") as ImageLayer;
        const viewport = createViewport();
        const renderer = new ImageLayerRenderer({ layer, tilemap, viewport: viewport as any });
        await flushAsync();

        const sprite = renderer.container.children[0] as unknown as MockSprite;
        expect(sprite.texture).toMatchObject({ id: "image-texture" });

        layer.updateOffset(10, 20);
        layer.updateTintColor("#ff00aa");
        await flushAsync();

        expect(sprite.x).toBe(10);
        expect(sprite.y).toBe(20);
        expect(sprite.tint).toBe(0xff00aa);
        expect(rendererMocks.textureUtils.processTexture).toHaveBeenCalledTimes(1);
    });

    it("rebuilds image output for source/repeat changes and removes listeners on destroy", async () => {
        const firstTexture = {
            id: "image-texture-a",
            width: 32,
            height: 24,
            destroy: vi.fn(),
        };
        const secondTexture = {
            id: "image-texture-b",
            width: 48,
            height: 24,
            destroy: vi.fn(),
        };

        rendererMocks.textureUtils.processTexture
            .mockResolvedValueOnce(firstTexture)
            .mockResolvedValueOnce(secondTexture);

        const tilemap = createTilemap([createImageLayerData()]);
        const layer = tilemap.rootLayer.findLayer("image-layer") as ImageLayer;
        const viewport = createViewport();
        const off = vi.spyOn(layer.eventEmitter, "off");
        const renderer = new ImageLayerRenderer({ layer, tilemap, viewport: viewport as any });
        await flushAsync();

        layer.updateRepeat(true, false);
        await flushAsync();

        expect(renderer.container.children[0]).toBeInstanceOf(rendererMocks.TilingSprite);
        expect(firstTexture.destroy).toHaveBeenCalledWith(true);

        renderer.destroy();

        expect(off).toHaveBeenCalledWith("imageChanged", expect.any(Function));
        expect(viewport.off).toHaveBeenCalledWith("moved", expect.any(Function));
        expect(viewport.off).toHaveBeenCalledWith("zoomed", expect.any(Function));
        expect(viewport.off).toHaveBeenCalledWith("resize", expect.any(Function));
        expect(secondTexture.destroy).toHaveBeenCalledWith(true);
    });
});

describe("EntityLayerRenderer", () => {
    const createDefinition = (overrides: Partial<ConstructorParameters<typeof EntityDefinition>[0]> = {}) => new EntityDefinition({
        id: "definition-a",
        name: "Actor",
        width: 20,
        height: 12,
        pivotX: 4,
        pivotY: 5,
        graphic: { type: "color", color: "#0088ff" },
        ...overrides,
    });

    it("renders initial entities and updates/removes displays from entity events", async () => {
        const tilemap = createTilemap([createEntityLayerData()]);
        const layer = tilemap.rootLayer.findLayer("entity-layer") as EntityLayer;
        vi.spyOn(layer, "getEntityDefinition").mockReturnValue(createDefinition());

        const renderer = new EntityLayerRenderer({ layer, tilemap, viewport: viewportStub });
        await flushAsync();

        const displays = (renderer as any).entityDisplays as Map<string, any>;
        const record = displays.get("entity-1");
        expect(record).toBeDefined();
        expect(record.container.x).toBe(10);
        expect(record.container.y).toBe(12);
        expect(record.label.text).toBe("Spawn");

        layer.getEntityById("entity-1")!.moveTo(30, 40);
        await flushAsync();

        expect(record.container.x).toBe(28);
        expect(record.container.y).toBe(38);

        layer.removeEntities(["entity-1"]);
        await flushAsync();

        expect(displays.has("entity-1")).toBe(false);
        expect(record.container.destroy).toHaveBeenCalledWith({ children: true, texture: false });
    });

    it("rerenders matching tile-backed entities and unregisters manager listeners", async () => {
        const tilemap = createTilemap([createEntityLayerData()]);
        const layer = tilemap.rootLayer.findLayer("entity-layer") as EntityLayer;
        vi.spyOn(layer, "getEntityDefinition").mockReturnValue(createDefinition({
            graphic: { type: "tile", tilesetId: "tileset-a", tileId: 1 },
        }));

        const renderer = new EntityLayerRenderer({ layer, tilemap, viewport: viewportStub });
        await flushAsync();

        const displays = (renderer as any).entityDisplays as Map<string, any>;
        const record = displays.get("entity-1");
        expect(record.sprite.texture).toMatchObject({ id: "tileset-a:1" });

        const reloadHandler = rendererMocks.appKernel.textureManager.on.mock.calls
            .find(([eventName]) => eventName === "onTextureReloaded")![1];

        rendererMocks.appKernel.textureManager.getTileTexture.mockReturnValueOnce({ id: "tileset-a:1:updated", width: 16, height: 16 });
        reloadHandler("tileset-a");
        await flushAsync();

        expect(record.sprite.texture).toMatchObject({ id: "tileset-a:1:updated" });

        renderer.destroy();

        expect(rendererMocks.appKernel.textureManager.off).toHaveBeenCalledWith("onTextureReloaded", expect.any(Function));
        expect(rendererMocks.appKernel.editorFacade.currentProject.entityCollectionManager.off)
            .toHaveBeenCalledWith("onEntityCollectionUpdated", expect.any(Function));
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
