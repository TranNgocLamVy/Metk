import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const viewMocks = vi.hoisted(() => {
    class Container {
        public children: any[] = [];
        public position = { set: vi.fn() };
        public addChild = vi.fn((child: any) => {
            this.children.push(child);
            return child;
        });
        public destroy = vi.fn();
    }

    class MockViewport extends Container {
        public eventMode = "";
        public cursor = "default";
        public center = { x: 80, y: 96 };
        public scaled = 1.75;
        public listeners: Record<string, (...args: any[]) => void> = {};
        public plugins = {
            resume: vi.fn(),
            pause: vi.fn(),
        };
        public removeFromParent = vi.fn();
        public resize = vi.fn();
        public moveCenter = vi.fn();
        public setZoom = vi.fn();
        public emit = vi.fn((eventName: string, ...args: any[]) => {
            this.listeners[eventName]?.(...args);
        });

        constructor(public options: any) {
            super();
        }

        drag = vi.fn(() => this);
        wheel = vi.fn(() => this);
        decelerate = vi.fn(() => this);
        clampZoom = vi.fn(() => this);
        on = vi.fn((eventName: string, listener: (...args: any[]) => void) => {
            this.listeners[eventName] = listener;
            return this;
        });
        destroy = vi.fn();
    }

    const tilemapGridInstances: any[] = [];
    const tilemapRendererInstances: any[] = [];
    const tilesetGridInstances: any[] = [];
    const tilesetRendererInstances: any[] = [];
    const tilesetSelectorInstances: any[] = [];

    class MockTilemapGridRenderer {
        public graphics = { id: "tilemap-grid-graphics" };
        public gridEnabled = true;
        public disableGrid = vi.fn(() => {
            this.gridEnabled = false;
        });
        public enableGrid = vi.fn(() => {
            this.gridEnabled = true;
        });
        constructor(public context: any) {
            tilemapGridInstances.push(this);
        }
    }

    class MockTilemapRenderer {
        public container = { id: "tilemap-renderer-container" };
        public destroy = vi.fn();
        constructor(public context: any) {
            tilemapRendererInstances.push(this);
        }
    }

    class MockTilesetGridRenderer {
        public graphics = { id: "tileset-grid-graphics" };
        public gridGap = 2;
        public gridEnabled = true;
        public disableGrid = vi.fn(() => {
            this.gridEnabled = false;
        });
        public enableGrid = vi.fn(() => {
            this.gridEnabled = true;
        });
        constructor(public context: any) {
            tilesetGridInstances.push(this);
        }
    }

    class MockTilesetRenderer {
        public container = { id: "tileset-renderer-container" };
        public setGap = vi.fn();
        public destroy = vi.fn();
        constructor(public context: any) {
            tilesetRendererInstances.push(this);
        }
    }

    class MockTilesetSelectorRenderer {
        public graphics = { id: "tileset-selector-graphics" };
        public setGap = vi.fn();
        public destroy = vi.fn();
        constructor(public context: any) {
            tilesetSelectorInstances.push(this);
        }
    }

    return {
        Container,
        MockViewport,
        tilemapGridInstances,
        tilemapRendererInstances,
        tilesetGridInstances,
        tilesetRendererInstances,
        tilesetSelectorInstances,
        MockTilemapGridRenderer,
        MockTilemapRenderer,
        MockTilesetGridRenderer,
        MockTilesetRenderer,
        MockTilesetSelectorRenderer,
        workspaceService: {
            saveCurrentWorkspace: vi.fn(),
        },
    };
});

vi.mock("pixi.js", () => ({
    Application: vi.fn(),
    Container: viewMocks.Container,
}));
vi.mock("pixi-viewport", () => ({ Viewport: viewMocks.MockViewport }));
vi.mock("@/graphics/renderer/tilemap/tilemap-grid.renderer", () => ({ TilemapGridRenderer: viewMocks.MockTilemapGridRenderer }));
vi.mock("@/graphics/renderer/tilemap/tilemap.renderer", () => ({ TilemapRenderer: viewMocks.MockTilemapRenderer }));
vi.mock("@/graphics/renderer/tileset/single-tileset-grid.renderer", () => ({ TilesetGridRenderer: viewMocks.MockTilesetGridRenderer }));
vi.mock("@/graphics/renderer/tileset/single-tileset.renderer", () => ({ TilesetRenderer: viewMocks.MockTilesetRenderer }));
vi.mock("@/graphics/renderer/tileset/single-tileset-selector.renderer", () => ({ TilesetSelectorRenderer: viewMocks.MockTilesetSelectorRenderer }));
vi.mock("@/application/actions/workspace.actions", () => viewMocks.workspaceService);

import * as WorkspaceActions from "@/application/actions/workspace.actions";
import { SingleImageTileset } from "@/editor/model/tileset/single-image-tileset";
import { EditorObjectRegistry } from "@/editor/registry/editor-object.registry";
import { SingleImageTilesetView } from "@/graphics/view/single-tileset.view";
import { TilemapView } from "@/graphics/view/tilemap.view";
import { FilePathSystem, ProjectPathSystem } from "@/infrastructure/project-path-system";

type MockViewport = InstanceType<typeof viewMocks.MockViewport>;

const createPixiApp = () => ({
    screen: { width: 640, height: 480 },
    renderer: {
        width: 800,
        height: 600,
        events: { id: "renderer-events" },
        on: vi.fn(),
    },
    stage: {
        addChild: vi.fn(),
        eventMode: "auto",
    },
    canvas: { tagName: "CANVAS" },
});

const createTilemapSession = () => ({
    tilemap: {
        id: "tilemap-a",
        width: 10,
        height: 8,
        tileWidth: 16,
        tileHeight: 16,
    },
    viewState: { x: 128, y: 96, zoom: 2 },
    updateViewState: vi.fn(function (this: any, state: any) {
        this.viewState = { ...this.viewState, ...state };
    }),
});

const createTilesetSession = () => {
    const projectPathSystem = new ProjectPathSystem("C:/Project/Metk/view-project");
    const tilesetPathSystem = new FilePathSystem("tileset-a", projectPathSystem, "tilesets/tileset-a.json");

    return {
        tileset: new SingleImageTileset({
            id: "tileset-a",
            name: "Terrain",
            columns: 2,
            rows: 2,
            tileWidth: 16,
            tileHeight: 16,
            image: { source: "textures/terrain.png", width: 32, height: 32 },
            tiles: [],
        }, tilesetPathSystem, new EditorObjectRegistry()),
        viewState: { x: 32, y: 48, zoom: 1.5 },
        updateViewState: vi.fn(function (this: any, state: any) {
            this.viewState = { ...this.viewState, ...state };
        }),
    };
};

beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    viewMocks.tilemapGridInstances.length = 0;
    viewMocks.tilemapRendererInstances.length = 0;
    viewMocks.tilesetGridInstances.length = 0;
    viewMocks.tilesetRendererInstances.length = 0;
    viewMocks.tilesetSelectorInstances.length = 0;
});

afterEach(() => {
    vi.useRealTimers();
});

describe("TilemapView", () => {
    it("initializes viewport and renderers from a realistic tilemap session", () => {
        const app = createPixiApp();
        const session = createTilemapSession();
        const view = new TilemapView(session as any);

        view.activateView(app as any);

        expect(view.viewport.options).toMatchObject({
            screenWidth: 640,
            screenHeight: 480,
            worldWidth: 160,
            worldHeight: 128,
            passiveWheel: false,
            events: { id: "renderer-events" },
        });
        expect(view.viewport.drag).toHaveBeenCalledWith({ mouseButtons: "middle" });
        expect(viewMocks.tilemapGridInstances[0].context).toMatchObject({ tilemap: session.tilemap });
        expect(viewMocks.tilemapRendererInstances[0].context).toMatchObject({ tilemap: session.tilemap, viewport: view.viewport });
        expect(view.viewport.addChild).toHaveBeenCalledWith(view.renderer.container);
        expect(view.viewport.addChild).toHaveBeenCalledWith(view.overlayerContainer);
        expect(view.viewport.addChild).toHaveBeenCalledWith(view.grid.graphics);
        expect(app.stage.addChild).toHaveBeenCalledWith(view.viewport);
        expect(view.viewport.plugins.resume).toHaveBeenCalledWith("drag");
        expect(view.viewport.plugins.resume).toHaveBeenCalledWith("wheel");
        expect(view.viewport.plugins.resume).toHaveBeenCalledWith("decelerate");
        expect(view.viewport.moveCenter).toHaveBeenCalledWith(128, 96);
        expect(view.viewport.setZoom).toHaveBeenCalledWith(2);
    });

    it("persists view state from viewport movement and zoom events", () => {
        const view = new TilemapView(createTilemapSession() as any);
        view.activateView(createPixiApp() as any);
        const viewport = view.viewport as unknown as MockViewport;

        viewport.listeners["moved-end"]();
        viewport.listeners["zoomed-end"]();

        expect(view.session.updateViewState).toHaveBeenCalledWith({ x: 80, y: 96 });
        expect(view.session.updateViewState).toHaveBeenCalledWith({ zoom: 1.75 });
        expect(WorkspaceActions.saveCurrentWorkspace).toHaveBeenCalledTimes(2);
    });

    it("resizes the viewport and reapplies saved state when the renderer resizes", () => {
        const app = createPixiApp();
        const view = new TilemapView(createTilemapSession() as any);
        view.activateView(app as any);

        const resizeHandler = app.renderer.on.mock.calls.find(([eventName]) => eventName === "resize")![1];
        resizeHandler();

        expect(view.viewport.resize).toHaveBeenCalledWith(800, 600);
        expect(view.viewport.emit).toHaveBeenCalledWith("resize");
        expect(view.viewport.moveCenter).toHaveBeenCalledWith(128, 96);
    });

    it("toggles grid state through the grid renderer and cleans up initialized resources", () => {
        const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
        const view = new TilemapView(createTilemapSession() as any);
        view.activateView(createPixiApp() as any);

        view.unActivateView();
        expect(view.viewport.removeFromParent).toHaveBeenCalled();
        expect(view.viewport.plugins.pause).toHaveBeenCalledWith("drag");

        view.destroy();

        expect(view.renderer.destroy).toHaveBeenCalledTimes(1);
        expect(view.viewport.destroy).toHaveBeenCalledWith({ children: true });
        expect(removeEventListenerSpy).toHaveBeenCalledWith("pointerdown", expect.any(Function));
        expect(removeEventListenerSpy).toHaveBeenCalledWith("wheel", expect.any(Function));
    });

    it("allows unactivate and destroy to be called safely before initialization", () => {
        const view = new TilemapView(createTilemapSession() as any);

        expect(() => view.unActivateView()).not.toThrow();
        expect(() => view.destroy()).not.toThrow();
    });
});

describe("TilesetView", () => {
    it("initializes renderer, grid, and selector using the tileset session", () => {
        const app = createPixiApp();
        const session = createTilesetSession();
        const view = new SingleImageTilesetView(session as any);

        view.activateView(app as any);

        expect(view.viewport.options).toMatchObject({
            screenWidth: 640,
            screenHeight: 480,
            passiveWheel: true,
            events: { id: "renderer-events" },
        });
        expect(viewMocks.tilesetGridInstances[0].context).toMatchObject({ tileset: session.tileset });
        expect(viewMocks.tilesetRendererInstances[0].context).toMatchObject({ tileset: session.tileset });
        expect(viewMocks.tilesetSelectorInstances[0].context).toMatchObject({ tileset: session.tileset, tilesetSession: session });
        expect(view.viewport.addChild).toHaveBeenCalledWith(viewMocks.tilesetRendererInstances[0].container);
        expect(view.viewport.addChild).toHaveBeenCalledWith(view.grid.graphics);
        expect(view.viewport.addChild).toHaveBeenCalledWith(view.selector.graphics);
        expect(app.stage.addChild).toHaveBeenCalledWith(view.viewport);
        expect(view.viewport.moveCenter).toHaveBeenCalledWith(32, 48);
        expect(view.viewport.setZoom).toHaveBeenCalledWith(1.5);
    });

    it("persists tileset viewport state and responds to renderer resize", () => {
        const app = createPixiApp();
        const view = new SingleImageTilesetView(createTilesetSession() as any);
        view.activateView(app as any);
        const viewport = view.viewport as unknown as MockViewport;

        viewport.listeners["moved-end"]();
        viewport.listeners["zoomed-end"]();

        expect(view.session.updateViewState).toHaveBeenCalledWith({ x: 80, y: 96 });
        expect(view.session.updateViewState).toHaveBeenCalledWith({ zoom: 1.75 });
        expect(WorkspaceActions.saveCurrentWorkspace).toHaveBeenCalledTimes(2);

        const resizeHandler = app.renderer.on.mock.calls.find(([eventName]) => eventName === "resize")![1];
        resizeHandler();
        expect(view.viewport.resize).toHaveBeenCalledWith(800, 600);
        expect(view.viewport.setZoom).toHaveBeenCalledWith(1.5);
    });

    it("toggles grid visibility", () => {
        const view = new SingleImageTilesetView(createTilesetSession() as any);
        view.activateView(createPixiApp() as any);
        const renderer = viewMocks.tilesetRendererInstances[0];
        const selector = viewMocks.tilesetSelectorInstances[0];

        view.toggleGrid();
        expect(view.grid.disableGrid).toHaveBeenCalledTimes(1);
        expect(renderer.setGap).not.toHaveBeenCalled();
        expect(selector.setGap).not.toHaveBeenCalled();

        view.toggleGrid();
        expect(view.grid.enableGrid).toHaveBeenCalledTimes(1);
        expect(renderer.setGap).not.toHaveBeenCalled();
        expect(selector.setGap).not.toHaveBeenCalled();
    });

    it("unactivates and destroys the viewport plus renderer collaborators", () => {
        const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
        const view = new SingleImageTilesetView(createTilesetSession() as any);
        view.activateView(createPixiApp() as any);
        const renderer = viewMocks.tilesetRendererInstances[0];
        const selector = viewMocks.tilesetSelectorInstances[0];

        view.unActivateView();
        expect(view.viewport.removeFromParent).toHaveBeenCalled();
        expect(view.viewport.plugins.pause).toHaveBeenCalledWith("wheel");

        const viewport = view.viewport;
        view.destroy();

        expect(viewport.destroy).toHaveBeenCalledWith({ children: true });
        expect(renderer.destroy).toHaveBeenCalledTimes(1);
        expect(selector.destroy).toHaveBeenCalledTimes(1);
        expect(removeEventListenerSpy).toHaveBeenCalledWith("pointermove", expect.any(Function));
    });

    it("allows unactivate and destroy to be called safely before initialization", () => {
        const view = new SingleImageTilesetView(createTilesetSession() as any);

        expect(() => view.unActivateView()).not.toThrow();
        expect(() => view.destroy()).not.toThrow();
    });
});
