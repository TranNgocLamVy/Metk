import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EventEmitter from "eventemitter3";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type ListenerMap = Record<string, Array<(...args: any[]) => void>>;

const mockState = vi.hoisted(() => {
    const createListenerRegistry = () => {
        const listeners: ListenerMap = {};
        return {
            listeners,
            on: vi.fn((eventName: string, listener: (...args: any[]) => void) => {
                listeners[eventName] ??= [];
                listeners[eventName].push(listener);
            }),
            off: vi.fn((eventName: string, listener: (...args: any[]) => void) => {
                listeners[eventName] = (listeners[eventName] ?? []).filter((registered) => registered !== listener);
            }),
            emit: (eventName: string, ...args: any[]) => {
                listeners[eventName]?.forEach((listener) => listener(...args));
            },
            clear: () => {
                for (const key of Object.keys(listeners)) delete listeners[key];
            },
        };
    };

    const workspaceManager = {
        ...createListenerRegistry(),
        currentWorkspace: null as any,
        saveCurrentWorkspace: vi.fn(),
    };
    const projectManager = {
        ...createListenerRegistry(),
        currentProject: null as any,
        serialize: vi.fn(() => []),
    };
    const layoutManager = {
        ...createListenerRegistry(),
        updateLayout: vi.fn(),
    };
    const toolManager = {
        ...createListenerRegistry(),
        setActiveSession: vi.fn(),
        getToolContexts: vi.fn(() => []),
        getCurrentToolId: vi.fn(() => null),
        setActiveView: vi.fn(),
        startTool: vi.fn(),
    };
    const workspaceService = {
        openTilemapSession: vi.fn(),
        closeTilemapSession: vi.fn(),
        openTilesetSession: vi.fn(),
        closeTilesetSession: vi.fn(),
        selectRuleset: vi.fn(),
        saveCurrentWorkspace: vi.fn(),
    };

    return {
        createListenerRegistry,
        appKernel: {
            activationContext: {
                setFlag: vi.fn(),
            },
            editorFacade: {
                currentProject: null as any,
                getActiveTilemapSession: vi.fn(() => null),
                getCurrentHistoryManager: vi.fn(() => null),
                textureManager: {},
            },
            layoutManager,
            projectManager,
            toolManager,
            workspaceManager,
        },
        workspaceService,
    };
});

vi.mock("@/application/bootstrap/app-kernel", () => ({ appKernel: mockState.appKernel }));

vi.mock("react-i18next", () => ({
    initReactI18next: {
        type: "3rdParty",
        init: vi.fn(),
    },
    useTranslation: () => ({
        t: (message: string) => message,
    }),
}));

vi.mock("@/shared/services/workspace.service", () => ({
    WorkspaceService: mockState.workspaceService,
}));

vi.mock("@/shared/services/tilemap.service", () => ({
    TilemapService: {
        createTilemap: vi.fn(),
    },
}));

vi.mock("@/shared/services/ruleset.service", () => ({
    RulesetService: {
        createRuleset: vi.fn(),
        deleteRuleset: vi.fn(),
    },
}));

vi.mock("@/shared/services/dialog.service", () => ({
    DialogService: {
        openEditRulesetDialog: vi.fn(),
    },
}));

vi.mock("@pixi/react", () => ({
    Application: ({ className }: { className?: string }) => <div data-testid="pixi-application" className={className} />,
}));

vi.mock("@/graphics/view/tilemap.view", () => ({
    TilemapView: class {
        public renderer = {};
        public overlayerContainer = {};
        constructor(public readonly session: any) { }
        activateView = vi.fn();
        unActivateView = vi.fn();
        destroy = vi.fn();
    },
}));

vi.mock("@/graphics/view/tileset.view", () => ({
    TilesetView: class {
        constructor(public readonly session: any) { }
        activateView = vi.fn();
        unActivateView = vi.fn();
        destroy = vi.fn();
    },
}));

vi.mock("flexlayout-react", () => {
    const renderTabs = (node: any, factory: any): any[] => {
        if (!node) return [];
        if (node.type === "tab") {
            const tabNode = {
                getComponent: () => node.component,
            };
            return [
                <section key={node.id ?? node.component} aria-label={node.name ?? node.component}>
                    {factory(tabNode)}
                </section>,
            ];
        }
        return (node.children ?? []).flatMap((child: any) => renderTabs(child, factory));
    };

    return {
        Model: {
            fromJson: vi.fn((layout: any) => layout),
        },
        Layout: ({ model, factory }: { model: any; factory: any }) => (
            <div data-testid="workspace-layout">{renderTabs(model.layout, factory)}</div>
        ),
    };
});

vi.mock("@/shared/services/tilemap-layer.service", () => ({
    TilemapLayerService: {
        selectLayer: vi.fn((id: string, multi: boolean) => {
            const session = mockState.appKernel.workspaceManager.currentWorkspace?.tilemapSessionManager.activeSession;
            if (!session) return;

            let selectedLayers = [...session.layerState.selectedLayers];
            if (!multi) selectedLayers = [];
            if (selectedLayers.includes(id) && multi) {
                selectedLayers = selectedLayers.filter((layerId) => layerId !== id);
            } else {
                selectedLayers.push(id);
            }
            session.updateLayerState({ selectedLayers });
            mockState.workspaceService.saveCurrentWorkspace({ waitForTimeout: false });
        }),
        toggleOpenGroupLayer: vi.fn((id: string) => {
            const session = mockState.appKernel.workspaceManager.currentWorkspace?.tilemapSessionManager.activeSession;
            const layer = session?.tilemap.rootLayer.findLayer(id);
            if (layer?.toggleOpen) {
                layer.toggleOpen();
                session.emit("onMarkChange", session.isDirty);
            }
        }),
        toggleVisibility: vi.fn(),
        toggleLock: vi.fn(),
        createNewTileLayer: vi.fn(),
        createNewRuleLayer: vi.fn(),
        createNewGroupLayer: vi.fn(),
        moveLayersUp: vi.fn(),
        moveLayersDown: vi.fn(),
        duplicateLayer: vi.fn(),
        deleteLayer: vi.fn(),
        moveLayers: vi.fn(),
        renameLayer: vi.fn(),
    },
}));

import Workspace from "@/ui/components/workspace/Workspace";
import WorkspaceConsole from "@/ui/components/workspace/console/Console";
import LayerManager from "@/ui/components/workspace/layer-manager/LayerManager";
import RulesetManager from "@/ui/components/workspace/ruleset-manager/RulesetManager";
import TilemapEditor from "@/ui/components/workspace/tilemap-editor/TilemapEditor";
import TilesetViewSelector from "@/ui/components/workspace/tileset-view/TilesetViewSelector";
import { Tilemap } from "@/editor/model/tilemap/tilemap";
import { Tileset } from "@/editor/model/tileset/tileset";
import { SingleImageTileset } from "@/editor/model/tileset/single-image-tileset";
import { EditorObjectRegistry } from "@/editor/registry/editor-object.registry";
import { FilePathSystem, ProjectPathSystem } from "@/infrastructure/project-path-system";
import { RulesetManager as ResourceRulesetManager } from "@/application/resources/ruleset/ruleset.manager";
import { RulesetRefManager } from "@/application/resources/references/ruleset-ref.manager";
import { TilesetManager } from "@/application/resources/tileset/tileset.manager";
import { TilesetRefManager } from "@/application/resources/references/tileset-ref.manager";
import { useConsoleStore } from "@/ui/stores/console.store";
import { useLayoutStore } from "@/ui/stores/layout.store";
import { useLayerManagerStore } from "@/ui/stores/layer-manager.store";
import { useProjectStore } from "@/ui/stores/project.store";
import { useRulesetStore } from "@/ui/stores/ruleset.store";
import { useTilemapSessionStore } from "@/ui/stores/tilemap-session.store";
import { useTilesetSessionStore } from "@/ui/stores/tileset-session.store";
import { useWorkspaceStore } from "@/ui/stores/workspace.store";
import { WorkspaceService } from "@/shared/services/workspace.service";

type TestTilemapSession = EventEmitter & {
    id: string;
    tilemap: Tilemap;
    isDirty: boolean;
    viewState: { x: number | null; y: number | null; zoom: number };
    layerState: { selectedLayers: string[] };
    markLayerChange: ReturnType<typeof vi.fn>;
    updateLayerState: (state: Partial<{ selectedLayers: string[] }>) => void;
    updateViewState: (state: Partial<{ x: number | null; y: number | null; zoom: number }>) => void;
};

type TestTilesetSession = {
    id: string;
    tileset: Tileset;
    viewState: { x: number | null; y: number | null; zoom: number };
    selectionState: { selectedTilesSet: number[]; pivot: Coordinate | null };
};

const resetStore = <T,>(store: { getInitialState: () => T; setState: (state: T, replace: true) => void }) => {
    store.setState(store.getInitialState(), true);
};

const createProjectContext = () => {
    const projectPathSystem = new ProjectPathSystem("C:/Project/Metk/integration-project");
    const filePathSystem = new FilePathSystem("tilemap", projectPathSystem, "tilemaps/tilemap.json");
    const objectRegistry = new EditorObjectRegistry();
    const tilesetManager = new TilesetManager(projectPathSystem, objectRegistry);
    const rulesetManager = new ResourceRulesetManager(tilesetManager, projectPathSystem, objectRegistry);
    const tilesetRefManager = new TilesetRefManager(tilesetManager, filePathSystem);
    const rulesetRefManager = new RulesetRefManager(rulesetManager, filePathSystem);

    return { projectPathSystem, filePathSystem, objectRegistry, tilesetManager, rulesetManager, tilesetRefManager, rulesetRefManager };
};

const createTilemapSession = (id: string, tilemapId: string, name: string, isDirty = false): TestTilemapSession => {
    const context = createProjectContext();
    const tilemapResult = Tilemap.createFromFileData({
        id: tilemapId,
        name,
        orientation: "orthogonal",
        width: 8,
        height: 8,
        tilewidth: 16,
        tileheight: 16,
        backgroundcolor: "#00000000",
        tilesets: { refs: [], nextIndex: 0 },
        rulesets: { refs: [], nextIndex: 0 },
        layers: [
            {
                id: `${tilemapId}-group`,
                type: "group",
                name: `${name} Group`,
                opacity: 1,
                open: false,
                visible: true,
                locked: false,
                layers: [
                    {
                        id: `${tilemapId}-ground`,
                        type: "tile",
                        name: `${name} Ground`,
                        x: 0,
                        y: 0,
                        width: 8,
                        height: 8,
                        opacity: 1,
                        visible: true,
                        locked: false,
                        offsetx: 0,
                        offsety: 0,
                        layerData: "",
                    },
                ],
            },
            {
                id: `${tilemapId}-collision`,
                type: "tile",
                name: `${name} Collision`,
                x: 0,
                y: 0,
                width: 8,
                height: 8,
                opacity: 1,
                visible: true,
                locked: false,
                offsetx: 0,
                offsety: 0,
                layerData: "",
            },
        ],
    }, context.filePathSystem, context.tilesetRefManager, context.rulesetRefManager);
    if (tilemapResult.status !== "Success") throw new Error(String(tilemapResult.message));
    const tilemap = tilemapResult.data;

    const session = new EventEmitter() as TestTilemapSession;
    session.id = id;
    session.tilemap = tilemap;
    session.isDirty = isDirty;
    session.viewState = { x: null, y: null, zoom: 1 };
    session.layerState = { selectedLayers: [] };
    session.markLayerChange = vi.fn();
    session.updateLayerState = (state) => {
        session.layerState = { ...session.layerState, ...state };
        session.emit("onSelectedLayersChanged", session.layerState.selectedLayers);
    };
    session.updateViewState = (state) => {
        session.viewState = { ...session.viewState, ...state };
    };
    return session;
};

const createTilesetSession = (id: string, tilesetId: string, name: string): TestTilesetSession => {
    const projectPathSystem = new ProjectPathSystem("C:/Project/Metk/integration-project");
    const objectRegistry = new EditorObjectRegistry();
    const tilesetPathSystem = new FilePathSystem(tilesetId, projectPathSystem, `tilesets/${tilesetId}.json`);
    const tileset = new SingleImageTileset(
        {
            id: tilesetId,
            name,
            columns: 2,
            rows: 2,
            tilewidth: 16,
            tileheight: 16,
            image: { source: `textures/${tilesetId}.png`, width: 32, height: 32 },
            tiles: [],
        },
        tilesetPathSystem,
        objectRegistry,
    );
    return {
        id,
        tileset,
        viewState: { x: null, y: null, zoom: 1 },
        selectionState: { selectedTilesSet: [], pivot: null },
    };
};

const createSessionManager = <T extends { id: string }>(eventNames: { open: string; close: string; create: string }, sessions: T[], activeSession: T | null) => {
    const emitter = new EventEmitter();
    const manager: any = {
        activeSession,
        on: vi.fn((eventName: string, listener: (...args: any[]) => void) => emitter.on(eventName, listener)),
        off: vi.fn((eventName: string, listener: (...args: any[]) => void) => emitter.off(eventName, listener)),
        emit: (eventName: string, ...args: any[]) => emitter.emit(eventName, ...args),
        getSession: vi.fn((sessionId: string) => sessions.find((session) => session.id === sessionId) ?? null),
        registerActiveView: vi.fn(),
        unregisterActiveView: vi.fn(),
    };
    manager.tilemapsSession = sessions;
    manager.tilesetsSession = sessions;
    manager.openSession = (sessionId: string) => {
        const session = sessions.find((candidate) => candidate.id === sessionId) ?? null;
        if (!session) return null;
        manager.activeSession = session;
        manager.emit(eventNames.open, session);
        return session;
    };
    manager.closeSession = (sessionId: string) => {
        manager.emit(eventNames.close, sessionId);
    };
    manager.createSession = (session: T) => {
        sessions.push(session);
        manager.tilemapsSession = sessions;
        manager.tilesetsSession = sessions;
        manager.emit(eventNames.create, session);
    };
    return manager;
};

const createRulesetManager = () => {
    const emitter = new EventEmitter();
    let rulesets = [
        { id: "terrain", name: "Terrain Rules", color: "#22c55e", rulesetRelPath: "rulesets/terrain.json" },
        { id: "water", name: "Water Rules", color: "#38bdf8", rulesetRelPath: "rulesets/water.json" },
    ];
    return {
        serialize: vi.fn(() => rulesets),
        on: vi.fn((eventName: string, listener: (...args: any[]) => void) => emitter.on(eventName, listener)),
        off: vi.fn((eventName: string, listener: (...args: any[]) => void) => emitter.off(eventName, listener)),
        replaceRulesets(nextRulesets: typeof rulesets) {
            rulesets = nextRulesets;
            emitter.emit("onRulesetManagerUpdated", nextRulesets);
        },
    };
};

const setWorkspaceFixture = () => {
    const overworld = createTilemapSession("tilemap-overworld-session", "overworld", "Overworld");
    const dungeon = createTilemapSession("tilemap-dungeon-session", "dungeon", "Dungeon", true);
    const terrainTiles = createTilesetSession("tileset-terrain-session", "terrain-tiles", "Terrain Tiles");
    const dungeonTiles = createTilesetSession("tileset-dungeon-session", "dungeon-tiles", "Dungeon Tiles");

    const tilemapSessionManager = createSessionManager(
        { open: "onOpenTilemapSession", close: "onCloseTilemapSession", create: "onCreateTilemapSession" },
        [overworld, dungeon],
        overworld,
    );
    const tilesetSessionManager = createSessionManager(
        { open: "onOpenTilesetSession", close: "onCloseTilesetSession", create: "onCreateTilesetSession" },
        [terrainTiles, dungeonTiles],
        terrainTiles,
    );
    const rulesetSessionManager = {
        selectedRuleId: "terrain" as string | null,
        getSelectedRuleId: vi.fn(() => rulesetSessionManager.selectedRuleId),
        setSelectedRuleId: vi.fn((id: string | null) => {
            rulesetSessionManager.selectedRuleId = id;
        }),
    };
    const rulesetManager = createRulesetManager();
    const workspace = { tilemapSessionManager, tilesetSessionManager, rulesetSessionManager };
    const project = { id: "project-alpha", rulesetManager };

    mockState.appKernel.workspaceManager.currentWorkspace = workspace;
    mockState.appKernel.projectManager.currentProject = project;
    mockState.appKernel.editorFacade.currentProject = project;
    mockState.appKernel.editorFacade.getActiveTilemapSession.mockImplementation(() => tilemapSessionManager.activeSession);
    (WorkspaceService.openTilemapSession as any).mockImplementation(async (sessionId: string) => tilemapSessionManager.openSession(sessionId));
    (WorkspaceService.openTilesetSession as any).mockImplementation(async (sessionId: string) => tilesetSessionManager.openSession(sessionId));
    (WorkspaceService.selectRuleset as any).mockImplementation(async (rulesetId: string | null) => {
        rulesetSessionManager.setSelectedRuleId(rulesetId);
    });

    useWorkspaceStore.getState().setActiveWorkspace(workspace as any);
    useProjectStore.getState().setActiveProject(project as any);
    useTilemapSessionStore.getState().setPixiApp({ renderer: { resize: vi.fn() } } as any);
    useTilesetSessionStore.getState().setPixiApp({ renderer: { resize: vi.fn() } } as any);

    return { overworld, dungeon, terrainTiles, dungeonTiles, tilemapSessionManager, tilesetSessionManager, rulesetSessionManager, rulesetManager, workspace, project };
};

const setWorkspaceLayoutModel = () => {
    useLayoutStore.getState().setModel({
        layout: {
            type: "row",
            children: [
                { type: "tab", id: "tilemap-editor", name: "Tilemap Editor", component: "tilemapEditor" },
                { type: "tab", id: "tileset-view", name: "Tileset View", component: "tilesetView" },
                { type: "tab", id: "layer-manager", name: "Layer Manager", component: "layerManager" },
                { type: "tab", id: "ruleset-manager", name: "Ruleset Manager", component: "rulesetManager" },
            ],
        },
        toJson: () => ({}),
    } as any);
};

describe("Metk UI integration workflows", () => {
    beforeEach(() => {
        resetStore(useConsoleStore);
        resetStore(useLayoutStore);
        resetStore(useLayerManagerStore);
        resetStore(useProjectStore);
        resetStore(useRulesetStore);
        resetStore(useTilemapSessionStore);
        resetStore(useTilesetSessionStore);
        resetStore(useWorkspaceStore);

        mockState.appKernel.workspaceManager.currentWorkspace = null;
        mockState.appKernel.projectManager.currentProject = null;
        mockState.appKernel.editorFacade.currentProject = null;
        mockState.appKernel.editorFacade.getActiveTilemapSession.mockReset();
        mockState.appKernel.activationContext.setFlag.mockClear();
        mockState.appKernel.layoutManager.updateLayout.mockClear();
        mockState.appKernel.toolManager.setActiveSession.mockClear();
        mockState.workspaceService.openTilemapSession.mockReset();
        mockState.workspaceService.openTilesetSession.mockReset();
        mockState.workspaceService.selectRuleset.mockReset();
        mockState.workspaceService.saveCurrentWorkspace.mockReset();
        Element.prototype.scrollIntoView = vi.fn();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("renders the workspace from loaded project and session state", async () => {
        setWorkspaceFixture();
        setWorkspaceLayoutModel();

        render(<Workspace />);

        expect(await screen.findByRole("button", { name: /Overworld/ })).toBeVisible();
        expect(screen.getByRole("button", { name: /Terrain Tiles/ })).toBeVisible();
        expect(screen.getByText("Overworld Group")).toBeVisible();
        expect(screen.getByText("Overworld Collision")).toBeVisible();
        expect(screen.getByText("Terrain Rules")).toBeVisible();
        expect(useTilemapSessionStore.getState().activeSession?.id).toBe("tilemap-overworld-session");
        expect(useTilesetSessionStore.getState().activeSession?.id).toBe("tileset-terrain-session");
    });

    it("switches tilemap sessions and updates visible editor tab state", async () => {
        const user = userEvent.setup();
        const { dungeon } = setWorkspaceFixture();

        render(<TilemapEditor />);

        const dungeonTab = await screen.findByRole("button", { name: /Dungeon/ });
        await user.click(dungeonTab);

        await waitFor(() => {
            expect(useTilemapSessionStore.getState().activeSession?.id).toBe(dungeon.id);
        });
        expect(WorkspaceService.openTilemapSession).toHaveBeenCalledWith(dungeon.id);
        expect(dungeonTab).toHaveClass("bg-surface");
        expect(screen.getByRole("button", { name: /Overworld/ })).toHaveClass("text-muted-foreground");
    });

    it("switches tileset sessions and updates visible tileset tab state", async () => {
        const user = userEvent.setup();
        const { dungeonTiles } = setWorkspaceFixture();

        render(<TilesetViewSelector />);

        const dungeonTilesTab = await screen.findByRole("button", { name: /Dungeon Tiles/ });
        await user.click(dungeonTilesTab);

        await waitFor(() => {
            expect(useTilesetSessionStore.getState().activeSession?.id).toBe(dungeonTiles.id);
        });
        expect(WorkspaceService.openTilesetSession).toHaveBeenCalledWith(dungeonTiles.id);
        expect(dungeonTilesTab).toHaveClass("bg-surface");
        expect(screen.getByRole("button", { name: /Terrain Tiles/ })).toHaveClass("text-muted-foreground");
    });

    it("shows the console panel selected by console state and user tab changes", async () => {
        const user = userEvent.setup();
        useConsoleStore.getState().openWithType("log");
        useConsoleStore.getState().addLog({
            id: "log-a",
            uiId: "log-ui-a",
            timestamp: Date.now(),
            level: "info",
            message: "Loaded workspace",
        });
        useConsoleStore.getState().addError({
            id: "error-a",
            uiId: "error-ui-a",
            timestamp: Date.now(),
            message: "Failed to export",
            stacks: ["Stack trace"],
        });
        useConsoleStore.getState().openWithType("log");

        render(<WorkspaceConsole />);

        expect(screen.getByText("Loaded workspace")).toBeVisible();
        expect(screen.queryByText("Failed to export")).not.toBeInTheDocument();

        await user.click(screen.getByText("Error"));

        expect(useConsoleStore.getState().consoleType).toBe("error");
        expect(screen.getByText("Failed to export")).toBeVisible();
        expect(screen.queryByText("Loaded workspace")).not.toBeInTheDocument();
    });

    it("renders rulesets from project state and updates selected ruleset state through the UI", async () => {
        const user = userEvent.setup();
        const { rulesetManager } = setWorkspaceFixture();

        render(<RulesetManager />);

        expect(await screen.findByText("Terrain Rules")).toBeVisible();
        expect(screen.getByText("Water Rules")).toBeVisible();
        expect(useRulesetStore.getState().currentSelectedRuleId).toBe("terrain");

        await user.click(screen.getByText("Water Rules"));

        expect(WorkspaceService.selectRuleset).toHaveBeenCalledWith("water");
        expect(useRulesetStore.getState().currentSelectedRuleId).toBe("water");

        act(() => {
            rulesetManager.replaceRulesets([
                { id: "terrain", name: "Terrain Rules", color: "#22c55e", rulesetRelPath: "rulesets/terrain.json" },
                { id: "lava", name: "Lava Rules", color: "#ef4444", rulesetRelPath: "rulesets/lava.json" },
            ]);
        });

        expect(await screen.findByText("Lava Rules")).toBeVisible();
        expect(screen.queryByText("Water Rules")).not.toBeInTheDocument();
    });

    it("updates layer row visibility and selection state from session events", async () => {
        const { overworld } = setWorkspaceFixture();
        useTilemapSessionStore.getState().setActiveSession(overworld as any);

        render(<LayerManager />);

        expect(await screen.findByText("Overworld Group")).toBeVisible();
        expect(screen.queryByText("Overworld Ground")).not.toBeInTheDocument();

        act(() => {
            const group = overworld.tilemap.rootLayer.findLayer("overworld-group") as any;
            group.toggleOpen(true);
            overworld.emit("onMarkChange", false);
        });

        expect(await screen.findByText("Overworld Ground")).toBeVisible();

        act(() => {
            overworld.updateLayerState({ selectedLayers: ["overworld-collision"] });
        });

        const collisionRow = screen.getByText("Overworld Collision").closest("[draggable='true']");
        expect(collisionRow).toHaveClass("bg-accent");
        expect(useLayerManagerStore.getState().selectedLayers).toEqual(["overworld-collision"]);
    });
});
