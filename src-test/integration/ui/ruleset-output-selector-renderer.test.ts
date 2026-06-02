import { beforeEach, describe, expect, it, vi } from "vitest";

const rendererMocks = vi.hoisted(() => {
    const textureManager = {
        retainTilesetGraphics: vi.fn(),
        releaseTilesetGraphics: vi.fn(),
        getTileTexture: vi.fn((tilesetId: string, tileId: number) => ({ textureId: `${tilesetId}:${tileId}` })),
    };
    const tilesetManager = {
        loadTileset: vi.fn(),
    };

    class MockContainer {
        public children: any[] = [];
        addChild = vi.fn((child: any) => {
            this.children.push(child);
            return child;
        });
        removeChildren = vi.fn(() => {
            const children = [...this.children];
            this.children = [];
            return children;
        });
    }

    class MockGraphics {
        public eventMode = "";
        public rectCalls: any[] = [];
        clear = vi.fn();
        rect = vi.fn((...args: any[]) => {
            this.rectCalls.push(args);
            return this;
        });
        fill = vi.fn();
    }

    class MockSprite {
        public position = { set: vi.fn((x: number, y: number) => {
            this.x = x;
            this.y = y;
        }) };
        public eventMode = "";
        public cursor = "";
        public handlers: Record<string, (...args: any[]) => void> = {};
        public destroy = vi.fn();
        public x = 0;
        public y = 0;

        constructor(public texture: any) {}

        on = vi.fn((eventName: string, handler: (...args: any[]) => void) => {
            this.handlers[eventName] = handler;
            return this;
        });
    }

    class MockViewport extends MockContainer {
        public cursor = "default";
        public eventMode = "";
        public plugins = {
            resume: vi.fn(),
        };
        public resize = vi.fn();
        public destroy = vi.fn();
        public listeners: Record<string, (...args: any[]) => void> = {};
        drag = vi.fn(() => this);
        wheel = vi.fn(() => this);
        decelerate = vi.fn(() => this);
        clampZoom = vi.fn(() => this);
        on = vi.fn((eventName: string, handler: (...args: any[]) => void) => {
            this.listeners[eventName] = handler;
            return this;
        });
    }

    return {
        textureManager,
        tilesetManager,
        appKernel: {
            editorFacade: {
                currentProject: { tilesetManager } as null | { tilesetManager: typeof tilesetManager },
                textureManager,
            },
        },
        pixi: {
            MockContainer,
            MockGraphics,
            MockSprite,
        },
        viewport: {
            MockViewport,
        },
        graphicUtils: {
            drawVerticelLine: vi.fn(),
            drawHorizontalLine: vi.fn(),
        },
    };
});

vi.mock("@/application/bootstrap/app-kernel", () => ({ appKernel: rendererMocks.appKernel }));
vi.mock("pixi.js", () => ({
    Application: vi.fn(),
    Container: rendererMocks.pixi.MockContainer,
    Graphics: rendererMocks.pixi.MockGraphics,
    Sprite: rendererMocks.pixi.MockSprite,
}));
vi.mock("pixi-viewport", () => ({ Viewport: rendererMocks.viewport.MockViewport }));
vi.mock("@/shared/utils/graphic-utils", () => ({ GraphicUtils: rendererMocks.graphicUtils }));

import { Result } from "@/shared/types/result";
import { RulesetOutputSelector } from "@/ui/dialogs/edit-ruleset/graphics/ruleset-ouput-selector.renderer";

const createPixiApp = () => ({
    screen: { width: 320, height: 240 },
    renderer: {
        width: 320,
        height: 240,
        events: {},
        on: vi.fn(),
    },
    stage: {
        addChild: vi.fn(),
        removeChild: vi.fn(),
    },
});

const createRuleset = () => ({
    tilesetRefManager: {
        getTilesetRefIndex: vi.fn((tilesetId: string) => (tilesetId === "terrain" ? 0 : -1)),
    },
});

const createRule = () => {
    const outputs: Array<{ tileId: number; tilesetIndex: number; getOutputData: () => any }> = [];

    return {
        outputs,
        getOutputs: vi.fn(() => outputs),
        addOutput: vi.fn((tileId: number, tilesetId: string) => {
            outputs.push({
                tileId,
                tilesetIndex: tilesetId === "terrain" ? 0 : -1,
                getOutputData: () => ({ tileId, tilesetId, weight: 1 }),
            });
        }),
        removeOutput: vi.fn((tileId: number, tilesetId: string) => {
            const index = outputs.findIndex((output) => output.tileId === tileId && output.getOutputData().tilesetId === tilesetId);
            if (index >= 0) outputs.splice(index, 1);
        }),
    };
};

const terrainTileset = {
    id: "terrain",
    columns: 2,
    rows: 2,
    tileWidth: 16,
    tileHeight: 16,
    tiles: [{ id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }],
};

beforeEach(() => {
    vi.clearAllMocks();
    rendererMocks.appKernel.editorFacade.currentProject = { tilesetManager: rendererMocks.tilesetManager };
    rendererMocks.tilesetManager.loadTileset.mockResolvedValue(Result.Success(terrainTileset));
});

describe("RulesetOutputSelector renderer", () => {
    it("initializes the Pixi viewport, renders tiles, highlights outputs, and toggles selection by tile coordinate", async () => {
        const triggerUpdate = vi.fn();
        const ruleset = createRuleset();
        const rule = createRule();
        const app = createPixiApp();
        const selector = new RulesetOutputSelector(ruleset as any, triggerUpdate);

        await selector.activatePixiApp(app as any);
        await selector.setCurrentRule(rule as any);
        await selector.setActiveTileset("terrain");

        expect(app.stage.addChild).toHaveBeenCalledWith(selector.viewport);
        expect(rendererMocks.textureManager.retainTilesetGraphics).toHaveBeenCalledWith(terrainTileset);
        expect(rendererMocks.textureManager.getTileTexture).toHaveBeenCalledTimes(4);
        expect((selector as any).spriteContainer.children).toHaveLength(4);
        expect((selector as any).spriteContainer.children[3].position.set).toHaveBeenCalledWith(16, 16);
        expect(rendererMocks.graphicUtils.drawVerticelLine).toHaveBeenCalledTimes(3);
        expect(rendererMocks.graphicUtils.drawHorizontalLine).toHaveBeenCalledTimes(3);

        const tileOneSprite = (selector as any).spriteContainer.children[1];
        tileOneSprite.handlers.pointerdown({ button: 0 });

        expect(rule.addOutput).toHaveBeenCalledWith(1, "terrain", 1);
        expect(triggerUpdate).toHaveBeenCalledTimes(1);
        expect((selector as any).highlightGraphics.rect).toHaveBeenLastCalledWith(16, 0, 16, 16);

        tileOneSprite.handlers.pointerdown({ button: 0 });

        expect(rule.removeOutput).toHaveBeenCalledWith(1, "terrain");
        expect(rule.outputs).toEqual([]);
    });

    it("handles missing project, failed tileset load, and null current rule without mutating selection", async () => {
        const triggerUpdate = vi.fn();
        const rule = createRule();
        const selector = new RulesetOutputSelector(createRuleset() as any, triggerUpdate);
        await selector.activatePixiApp(createPixiApp() as any);
        await selector.setCurrentRule(null);

        rendererMocks.appKernel.editorFacade.currentProject = null;
        await selector.setActiveTileset("terrain");
        expect(rendererMocks.textureManager.retainTilesetGraphics).not.toHaveBeenCalled();

        rendererMocks.appKernel.editorFacade.currentProject = { tilesetManager: rendererMocks.tilesetManager };
        rendererMocks.tilesetManager.loadTileset.mockResolvedValueOnce(Result.Error("missing"));
        await selector.setActiveTileset("terrain");
        expect(rendererMocks.textureManager.retainTilesetGraphics).not.toHaveBeenCalled();

        rendererMocks.tilesetManager.loadTileset.mockResolvedValue(Result.Success(terrainTileset));
        await selector.setActiveTileset("terrain");
        const tileZeroSprite = (selector as any).spriteContainer.children[0];
        tileZeroSprite.handlers.pointerdown({ button: 0 });

        expect(rule.addOutput).not.toHaveBeenCalled();
        expect(triggerUpdate).not.toHaveBeenCalled();
    });

    it("releases previous graphics when switching tilesets and cleans up the viewport on destroy", async () => {
        const selector = new RulesetOutputSelector(createRuleset() as any, vi.fn());
        const app = createPixiApp();
        await selector.activatePixiApp(app as any);
        await selector.setActiveTileset("terrain");

        rendererMocks.tilesetManager.loadTileset.mockResolvedValueOnce(Result.Success({
            ...terrainTileset,
            id: "terrain-alt",
            tiles: [{ id: 0 }],
        }));
        await selector.setActiveTileset("terrain-alt");

        expect(rendererMocks.textureManager.releaseTilesetGraphics).toHaveBeenCalledWith("terrain");
        expect((selector as any).spriteContainer.removeChildren).toHaveBeenCalled();

        selector.destroy();

        expect(app.stage.removeChild).toHaveBeenCalledWith(selector.viewport);
        expect(selector.viewport.destroy).toHaveBeenCalledWith({ children: true });
    });
});
