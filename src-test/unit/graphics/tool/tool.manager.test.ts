import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/application/editor.facade", () => ({
    EditorFacade: class { },
}));

vi.mock("@/application/bootstrap/app-kernel", () => ({
    appKernel: {
        editorFacade: {
            textureManager: {},
        },
        textureManager: {
            on: vi.fn(),
            off: vi.fn(),
        },
    },
}));

vi.mock("@/graphics/tool/tool.decorator", () => ({
    Tool: () => () => undefined,
}));

vi.mock("@/graphics/strategies/draw-tile.strategy", () => ({
    DrawTileStrategy: class {
        public canHandle = vi.fn((layerRenderer: any) => layerRenderer.layer?.id === "tile-root");
    },
}));

vi.mock("@/graphics/strategies/draw-rule.strategy", () => ({
    DrawRuleStrategy: class {
        public canHandle = vi.fn(() => false);
    },
}));

vi.mock("@/graphics/renderer/group-layer.renderer", () => ({
    GroupLayerRenderer: class { },
}));

vi.mock("pixi.js", () => ({
    Sprite: class { },
    Container: class { },
    Point: class {
        constructor(public x = 0, public y = 0) { }
    },
    Color: class {
        constructor(public value: any) { }
    },
    Texture: { WHITE: { id: "white-texture" } },
}));

import { ToolManager } from "@/graphics/tool/tool.manager";
import { ITool } from "@/editor/interface/tool.interface";
import { TileLayer } from "@/editor/model/tilemap/layer/tile-layer";

import {
    createEditorHarness,
    createTileLayerRenderer,
} from "./tool-test-utils";

class FakeTool implements ITool {
    public static instances: FakeTool[] = [];

    public onEnable = vi.fn();
    public onDisable = vi.fn();
    public attachView = vi.fn();
    public detach = vi.fn();
    public setDrawStrategy = vi.fn();
    public setTargetLayerRenderer = vi.fn();

    constructor(public readonly editorFacade: any) {
        FakeTool.instances.push(this);
    }
}

class SecondFakeTool extends FakeTool {
    public static override instances: SecondFakeTool[] = [];

    constructor(editorFacade: any) {
        super(editorFacade);
        SecondFakeTool.instances.push(this);
    }
}

const createToolManagerHarness = () => {
    const editor = createEditorHarness();
    const layer = editor.tilemap.rootLayer.findLayer("tile-root") as TileLayer;
    const layerRenderer = createTileLayerRenderer(layer, editor.tilemap);
    let selectedLayerListener: ((layerIds: string[]) => void) | null = null;
    const session = {
        ...editor.session,
        on: vi.fn((eventName: string, listener: (layerIds: string[]) => void) => {
            if (eventName === "onSelectedLayersChanged") selectedLayerListener = listener;
        }),
        off: vi.fn(),
    };
    const view = {
        session,
        renderer: {
            findLayerRenderer: vi.fn((id: string) => id === "tile-root" ? layerRenderer : null),
        },
    };
    const manager = new ToolManager();
    manager.setEditorContext(editor.editorFacade);
    manager.registerTool("fake.tool", FakeTool as any);
    manager.registerTool("fake.second", SecondFakeTool as any);

    return {
        ...editor,
        manager,
        view,
        session,
        layer,
        layerRenderer,
        getSelectedLayerListener: () => selectedLayerListener,
    };
};

describe("ToolManager", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        ToolManager.TOOL_REGISTRY = [];
        FakeTool.instances = [];
        SecondFakeTool.instances = [];
    });

    it("registers and starts tools, tracks the current tool id, and emits tool changes", () => {
        const { manager, editorFacade } = createToolManagerHarness();
        const changed = vi.fn();
        manager.on("onToolChanged", changed);

        manager.startTool("fake.tool");

        expect(manager.getCurrentToolId()).toBe("fake.tool");
        expect(FakeTool.instances).toHaveLength(1);
        expect(FakeTool.instances[0].editorFacade).toBe(editorFacade);
        expect(FakeTool.instances[0].onEnable).toHaveBeenCalledTimes(1);
        expect(changed).toHaveBeenCalledWith("fake.tool");
    });

    it("clears the previous tool before starting a different tool", () => {
        const { manager } = createToolManagerHarness();
        const changed = vi.fn();
        manager.on("onToolChanged", changed);

        manager.startTool("fake.tool");
        const firstTool = FakeTool.instances[0];
        manager.startTool("fake.second");

        expect(firstTool.detach).toHaveBeenCalledTimes(1);
        expect(firstTool.onDisable).toHaveBeenCalledTimes(1);
        expect(manager.getCurrentToolId()).toBe("fake.second");
        expect(changed.mock.calls.map((call) => call[0])).toEqual(["fake.tool", null, "fake.second"]);
    });

    it("clears the active tool when starting an unknown tool id", () => {
        const { manager } = createToolManagerHarness();
        const changed = vi.fn();
        manager.on("onToolChanged", changed);

        manager.startTool("fake.tool");
        manager.startTool("missing.tool");

        expect(manager.getCurrentToolId()).toBeNull();
        expect(FakeTool.instances[0].detach).toHaveBeenCalledTimes(1);
        expect(changed.mock.calls.map((call) => call[0])).toEqual(["fake.tool", null]);
    });

    it("attaches the current tool to the active view and propagates the selected editable layer", () => {
        const { manager, view, layerRenderer } = createToolManagerHarness();

        manager.setActiveView(view as any);
        manager.startTool("fake.tool");

        const tool = FakeTool.instances[0];
        expect(tool.attachView).toHaveBeenCalledWith(view);
        expect(view.session.on).toHaveBeenCalledWith("onSelectedLayersChanged", expect.any(Function));
        expect(tool.setTargetLayerRenderer).toHaveBeenCalledWith(layerRenderer);
        expect(tool.setDrawStrategy).toHaveBeenCalledWith(expect.any(Object));
    });

    it("updates the current tool when selected layers change and no editable renderer is available", () => {
        const { manager, view, session, layer, getSelectedLayerListener } = createToolManagerHarness();
        manager.setActiveView(view as any);
        manager.startTool("fake.tool");
        const tool = FakeTool.instances[0];

        layer.toggleLock(true);
        getSelectedLayerListener()!(session.layerState.selectedLayers);

    });

    it("detaches the current tool and unregisters selected-layer listeners when active session changes", () => {
        const { manager, view } = createToolManagerHarness();
        manager.setActiveView(view as any);
        manager.startTool("fake.tool");
        const tool = FakeTool.instances[0];

        manager.setActiveView(null);

        expect(view.session.off).toHaveBeenCalledWith("onSelectedLayersChanged", expect.any(Function));
        expect(tool.detach).toHaveBeenCalledTimes(1);
    });

    it("stops and resumes the current tool without changing the tracked tool id", () => {
        const { manager, view } = createToolManagerHarness();
        manager.setActiveView(view as any);
        manager.startTool("fake.tool");
        const tool = FakeTool.instances[0];

        manager.stopTool();
        manager.resumeTool();

        expect(manager.getCurrentToolId()).toBe("fake.tool");
        expect(tool.detach).toHaveBeenCalledTimes(1);
        expect(tool.onDisable).toHaveBeenCalledTimes(1);
        expect(tool.onEnable).toHaveBeenCalledTimes(2);
        expect(tool.attachView).toHaveBeenCalledTimes(2);
    });

    it("returns defensive copies of decorated tool contexts", () => {
        ToolManager.TOOL_REGISTRY = [{
            id: "decorated.tool",
            label: "Decorated",
            constructor: FakeTool as any,
        }];
        const manager = new ToolManager();

        const contexts = manager.getToolContexts();
        contexts[0].id = "mutated";

        expect(manager.getToolContexts()[0].id).toBe("decorated.tool");
    });
});
