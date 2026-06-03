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
import { RuleLayer } from "@/editor/model/tilemap/layer/rule-layer";
import { TileLayer } from "@/editor/model/tilemap/layer/tile-layer";
import { BUILTIN_TOOL_GROUPS } from "@/graphics/tool/builtin-tools";
import { ToolGroupDefinition } from "@/graphics/tool/tool.definition";

import {
    createEditorHarness,
    createViewHarness,
    createTileLayerRenderer,
} from "./tool-test-utils";

class FakeTool implements ITool {
    public static instances: FakeTool[] = [];

    public onEnable = vi.fn();
    public onDisable = vi.fn();
    public attachView = vi.fn();
    public detach = vi.fn();
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

class HybridTileTool extends FakeTool {
    public static override instances: HybridTileTool[] = [];

    constructor(editorFacade: any) {
        super(editorFacade);
        HybridTileTool.instances.push(this);
    }
}

class HybridRuleTool extends FakeTool {
    public static override instances: HybridRuleTool[] = [];

    constructor(editorFacade: any) {
        super(editorFacade);
        HybridRuleTool.instances.push(this);
    }
}

const createToolGroups = (): ToolGroupDefinition[] => [
    {
        id: "tile-editing",
        label: "Tile editing",
        families: [
            {
                id: "fake.tool",
                label: "Fake",
                priority: 0,
                tools: [
                    {
                        id: "fake.tool",
                        constructor: FakeTool as any,
                        canUse: (ctx) => ctx.layerKind === "tile",
                    },
                ],
            },
            {
                id: "fake.second",
                label: "Second fake",
                priority: 1,
                tools: [
                    {
                        id: "fake.second",
                        constructor: SecondFakeTool as any,
                        canUse: (ctx) => ctx.layerKind === "tile",
                    },
                ],
            },
            {
                id: "fake.hybrid",
                label: "Hybrid fake",
                priority: 2,
                tools: [
                    {
                        id: "fake.hybrid.tile",
                        constructor: HybridTileTool as any,
                        canUse: (ctx) => ctx.layerKind === "tile",
                    },
                    {
                        id: "fake.hybrid.rule",
                        constructor: HybridRuleTool as any,
                        canUse: (ctx) => ctx.layerKind === "rule",
                    },
                ],
            },
        ],
    },
];

const createToolManagerHarness = () => {
    const editor = createEditorHarness();
    const layer = editor.tilemap.rootLayer.findLayer("tile-root") as TileLayer;
    const ruleLayer = editor.tilemap.rootLayer.findLayer("rule-root") as RuleLayer;
    const layerRenderer = createTileLayerRenderer(layer, editor.tilemap);
    const ruleLayerRenderer = {
        ...createTileLayerRenderer(layer, editor.tilemap),
        layer: ruleLayer,
    };
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
    const manager = new ToolManager(createToolGroups());
    manager.setEditorContext(editor.editorFacade);

    return {
        ...editor,
        manager,
        view,
        session,
        layer,
        ruleLayer,
        layerRenderer,
        ruleLayerRenderer,
        getSelectedLayerListener: () => selectedLayerListener,
    };
};

describe("ToolManager", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        FakeTool.instances = [];
        SecondFakeTool.instances = [];
        HybridTileTool.instances = [];
        HybridRuleTool.instances = [];
    });

    it("falls back to the first available family when a tile layer view becomes active", () => {
        const { manager, view, editorFacade } = createToolManagerHarness();
        const changed = vi.fn();
        manager.on("onToolChanged", changed);

        manager.setActiveView(view as any);

        expect(manager.getCurrentFamilyId()).toBe("fake.tool");
        expect(manager.getCurrentToolId()).toBe("fake.tool");
        expect(FakeTool.instances).toHaveLength(1);
        expect(FakeTool.instances[0].editorFacade).toBe(editorFacade);
        expect(FakeTool.instances[0].onEnable).toHaveBeenCalledTimes(1);
        expect(changed).toHaveBeenCalledWith("fake.tool", "fake.tool");
    });

    it("switches concrete tools when another family is started", () => {
        const { manager, view } = createToolManagerHarness();
        const changed = vi.fn();
        manager.on("onToolChanged", changed);

        manager.setActiveView(view as any);
        const firstTool = FakeTool.instances[0];
        manager.startToolFamily("fake.second");

        expect(firstTool.detach).toHaveBeenCalledTimes(1);
        expect(firstTool.onDisable).toHaveBeenCalledTimes(1);
        expect(manager.getCurrentFamilyId()).toBe("fake.second");
        expect(manager.getCurrentToolId()).toBe("fake.second");
        expect(changed.mock.calls.map((call) => call[0])).toEqual(["fake.tool", "fake.second"]);
    });

    it("does not clear the current tool when starting an unknown family", () => {
        const { manager, view } = createToolManagerHarness();
        manager.setActiveView(view as any);
        const firstTool = FakeTool.instances[0];

        const started = manager.startToolFamily("missing.tool");

        expect(started).toBe(false);
        expect(manager.getCurrentFamilyId()).toBe("fake.tool");
        expect(firstTool.detach).not.toHaveBeenCalled();
    });

    it("attaches the current tool to the active view and propagates the selected editable layer", () => {
        const { manager, view, layerRenderer } = createToolManagerHarness();

        manager.setActiveView(view as any);

        const tool = FakeTool.instances[0];
        expect(tool.attachView).toHaveBeenCalledWith(view);
        expect(view.session.on).toHaveBeenCalledWith("onSelectedLayersChanged", expect.any(Function));
        expect(tool.setTargetLayerRenderer).toHaveBeenCalledWith(layerRenderer);
    });

    it("clears the current tool when selected layers change and no editable renderer is available", () => {
        const { manager, view, session, getSelectedLayerListener } = createToolManagerHarness();
        const changed = vi.fn();
        manager.on("onToolChanged", changed);
        manager.setActiveView(view as any);
        const tool = FakeTool.instances[0];

        session.layerState.selectedLayers = ["missing-layer"];
        getSelectedLayerListener()!(session.layerState.selectedLayers);

        expect(tool.detach).toHaveBeenCalledTimes(1);
        expect(tool.onDisable).toHaveBeenCalledTimes(1);
        expect(manager.getCurrentFamilyId()).toBeNull();
        expect(changed.mock.calls.map((call) => call[0])).toEqual(["fake.tool", null]);
    });

    it("keeps the current family while switching concrete tools after selected layer kind changes", () => {
        const { manager, view, session, ruleLayerRenderer, getSelectedLayerListener } = createToolManagerHarness();
        (view.renderer.findLayerRenderer as any).mockImplementation((id: string) => {
            if (id === "tile-root") return createTileLayerRenderer(session.tilemap.rootLayer.findLayer("tile-root") as TileLayer, session.tilemap);
            if (id === "rule-root") return ruleLayerRenderer;
            return null;
        });

        manager.setActiveView(view as any);
        manager.startToolFamily("fake.hybrid");
        const tileTool = HybridTileTool.instances[0];

        session.layerState.selectedLayers = ["rule-root"];
        getSelectedLayerListener()!(session.layerState.selectedLayers);

        expect(manager.getCurrentFamilyId()).toBe("fake.hybrid");
        expect(manager.getCurrentToolId()).toBe("fake.hybrid.rule");
        expect(tileTool.detach).toHaveBeenCalledTimes(1);
        expect(tileTool.onDisable).toHaveBeenCalledTimes(1);
        expect(HybridRuleTool.instances).toHaveLength(1);
        expect(HybridRuleTool.instances[0].setTargetLayerRenderer).toHaveBeenCalledWith(ruleLayerRenderer);
    });

    it("detaches the current tool and unregisters selected-layer listeners when active view changes", () => {
        const { manager, view } = createToolManagerHarness();
        manager.setActiveView(view as any);
        const tool = FakeTool.instances[0];

        manager.setActiveView(null);

        expect(view.session.off).toHaveBeenCalledWith("onSelectedLayersChanged", expect.any(Function));
        expect(tool.detach).toHaveBeenCalledTimes(1);
        expect(tool.onDisable).toHaveBeenCalledTimes(1);
        expect(manager.getCurrentToolId()).toBeNull();
    });

    it("removes the old active view listener and refreshes context from the new active view", () => {
        const { manager, view, session, getSelectedLayerListener } = createToolManagerHarness();
        const secondSession = {
            ...session,
            layerState: { selectedLayers: ["missing-layer"] },
            on: vi.fn(),
            off: vi.fn(),
        };
        const secondView = {
            session: secondSession,
            renderer: {
                findLayerRenderer: vi.fn(() => null),
            },
        };

        manager.setActiveView(view as any);
        expect(getSelectedLayerListener()).not.toBeNull();

        manager.setActiveView(secondView as any);

        expect(view.session.off).toHaveBeenCalledWith("onSelectedLayersChanged", expect.any(Function));
        expect(secondSession.on).toHaveBeenCalledWith("onSelectedLayersChanged", expect.any(Function));
        expect(manager.getCurrentFamilyId()).toBeNull();
    });

    it("stops and resumes the current tool without changing the tracked tool id", () => {
        const { manager, view } = createToolManagerHarness();
        manager.setActiveView(view as any);
        const tool = FakeTool.instances[0];

        manager.stopTool();
        manager.resumeTool();

        expect(manager.getCurrentToolId()).toBe("fake.tool");
        expect(tool.detach).toHaveBeenCalledTimes(1);
        expect(tool.onDisable).toHaveBeenCalledTimes(1);
        expect(tool.onEnable).toHaveBeenCalledTimes(2);
        expect(tool.attachView).toHaveBeenCalledTimes(2);
    });

    it("emits available family ids when context changes", () => {
        const { manager, view, session, getSelectedLayerListener } = createToolManagerHarness();
        const availabilityChanged = vi.fn();
        manager.on("onToolAvailabilityChanged", availabilityChanged);

        manager.setActiveView(view as any);
        session.layerState.selectedLayers = ["missing-layer"];
        getSelectedLayerListener()!(session.layerState.selectedLayers);

        expect(availabilityChanged.mock.calls.map((call) => call[0])).toEqual([
            ["fake.tool", "fake.second", "fake.hybrid"],
            [],
        ]);
    });

    it.each([
        ["tool.bucket", "tool.tile.bucket", "tool.rule.bucket"],
        ["tool.line", "tool.tile.line", "tool.rule.line"],
        ["tool.rectangle", "tool.tile.rectangle", "tool.rule.rectangle"],
    ])("resolves %s to tile and rule concrete tools", (familyId, tileToolId, ruleToolId) => {
        const editor = createEditorHarness();
        const viewHarness = createViewHarness(editor.session);
        const tileLayer = editor.tilemap.rootLayer.findLayer("tile-root") as TileLayer;
        const ruleLayer = editor.tilemap.rootLayer.findLayer("rule-root") as RuleLayer;
        const tileRenderer = createTileLayerRenderer(tileLayer, editor.tilemap);
        const ruleRenderer = { ...createTileLayerRenderer(tileLayer, editor.tilemap), layer: ruleLayer };
        let selectedLayerListener: ((layerIds: string[]) => void) | null = null;
        const session = {
            ...editor.session,
            on: vi.fn((eventName: string, listener: (layerIds: string[]) => void) => {
                if (eventName === "onSelectedLayersChanged") selectedLayerListener = listener;
            }),
            off: vi.fn(),
        };
        const view = {
            ...viewHarness.view,
            session,
            renderer: {
                findLayerRenderer: vi.fn((id: string) => {
                    if (id === "tile-root") return tileRenderer;
                    if (id === "rule-root") return ruleRenderer;
                    return null;
                }),
            },
        };
        const manager = new ToolManager(BUILTIN_TOOL_GROUPS);
        manager.setEditorContext(editor.editorFacade);

        manager.setActiveView(view as any);
        manager.startToolFamily(familyId);

        expect(manager.getCurrentFamilyId()).toBe(familyId);
        expect(manager.getCurrentToolId()).toBe(tileToolId);

        session.layerState.selectedLayers = ["rule-root"];
        selectedLayerListener!(session.layerState.selectedLayers);

        expect(manager.getCurrentFamilyId()).toBe(familyId);
        expect(manager.getCurrentToolId()).toBe(ruleToolId);
    });
});
