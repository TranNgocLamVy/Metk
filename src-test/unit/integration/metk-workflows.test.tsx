import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EventEmitter from "eventemitter3";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProjectPathSystem, FilePathSystem } from "@/infrastructure/project-path-system";
import { Tilemap } from "@/editor/model/tilemap/tilemap";
import { RulesetRefManager } from "@/application/resources/references/ruleset-ref.manager";
import { TilesetRefManager } from "@/application/resources/references/tileset-ref.manager";
import { RulesetManager } from "@/application/resources/ruleset/ruleset.manager";
import { TilesetManager } from "@/application/resources/tileset/tileset.manager";
import { Result } from "@/shared/types/result";
import { PermissionDialog } from "@/ui/components/dialog/PermissionDialog";
import LayerManager from "@/ui/components/workspace/layerManager/LayerManager";
import TilemapEditorTabs from "@/ui/components/workspace/tilemapEditor/TilemapEditorTabs";
import ToolBar from "@/ui/components/workspace/ToolBar";
import { DialogZLevel } from "@/shared/types/dialog";
import { useAppcore } from "@/ui/stores/appcore.store";
import { useDialogStore } from "@/ui/stores/dialog.store";
import { useLayerManagerStore } from "@/ui/stores/layer-manager.store";
import { useProjectStore } from "@/ui/stores/project.store";
import { useTilemapSessionStore } from "@/ui/stores/tilemap-session.store";
import { useTilesetSessionStore } from "@/ui/stores/tileset-session.store";
import { useToolbarStore } from "@/ui/stores/toolbar.store";
import { useWorkspaceStore } from "@/ui/stores/workspace.store";
import WorkspacePage from "@/ui/pages/Workspace";

type ListenerMap = Record<string, Array<(...args: any[]) => void>>;

type TestTilemapSession = EventEmitter<{
    onMarkChange: (isDirty: boolean) => void;
    onSelectedLayersChanged: (layerIds: string[]) => void;
}> & {
    id: string;
    tilemap: Tilemap;
    isDirty: boolean;
    layerState: { selectedLayers: string[] };
    updateLayerState: (state: Partial<{ selectedLayers: string[] }>) => void;
    historyManager: {
        startTransaction: () => void;
        execute: () => void;
        commitTransaction: () => void;
    };
};

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
        };
    };

    const toolManager = {
        ...createListenerRegistry(),
        currentToolId: "stamp",
        toolContexts: [] as any[],
        getToolContexts: vi.fn(() => toolManager.toolContexts),
        getCurrentToolId: vi.fn(() => toolManager.currentToolId),
        setActiveSession: vi.fn(),
        startTool: vi.fn((toolId: string) => {
            toolManager.currentToolId = toolId;
            toolManager.emit("onToolChanged", toolId);
        }),
    };

    const workspaceService = {
        loadProjectWorkspace: vi.fn(),
        unloadProjectWorkspace: vi.fn(),
        saveCurrentWorkspace: vi.fn(),
        openTilemapSession: vi.fn(),
        closeTilemapSession: vi.fn(),
        openTilesetSession: vi.fn(),
        closeTilesetSession: vi.fn(),
        createTilemapSession: vi.fn(),
        createTilesetSession: vi.fn(),
        selectRuleset: vi.fn(),
    };

    return {
        appKernel: {
            load: vi.fn(() => Promise.resolve({ status: "Success", data: undefined })),
            contextManager: {
                setFlag: vi.fn(),
            },
            editorFacade: {
                currentProject: null,
                textureManager: {
                    retainTilesetGraphics: vi.fn(),
                    releaseTilesetGraphics: vi.fn(),
                },
                getActiveTilemapSession: vi.fn(() => null),
                getCurrentHistoryManager: vi.fn(() => null),
            },
            layoutManager: {
                ...createListenerRegistry(),
                loadLayout: vi.fn(() => Promise.resolve({ status: "Success", data: undefined })),
                unloadLayout: vi.fn(),
                updateLayout: vi.fn(),
            },
            projectManager: {
                ...createListenerRegistry(),
                currentProject: null,
                serialize: vi.fn(() => []),
            },
            toolManager,
            workspaceManager: {
                ...createListenerRegistry(),
                currentWorkspace: null as any,
                loadProjectWorkspace: vi.fn(() => Promise.resolve({ status: "Success", data: undefined })),
                unloadWorkspace: vi.fn(),
                saveCurrentWorkspace: vi.fn(),
            },
            saveProjectManager: vi.fn(),
        },
        projectService: {
            importProject: vi.fn(),
            createProject: vi.fn(),
            removeProject: vi.fn(),
        },
        workspaceService,
        routeProjectId: "project-alpha",
        navigate: vi.fn(),
    };
});

vi.mock("@/application/bootstrap/app-kernel", () => ({ appKernel: mockState.appKernel }));

vi.mock("@/shared/services/project.service", () => ({
    ProjectService: mockState.projectService,
}));

vi.mock("@/shared/services/workspace.service", () => ({
    WorkspaceService: mockState.workspaceService,
}));

vi.mock("react-router", () => ({
    useNavigate: () => mockState.navigate,
    useParams: () => ({ projectId: mockState.routeProjectId }),
}));

vi.mock("react-i18next", () => ({
    initReactI18next: {
        type: "3rdParty",
        init: vi.fn(),
    },
    useTranslation: () => ({
        t: (message: string) => message,
    }),
}));

vi.mock("@/shared/services/tilemap-layer.service", () => ({
    TilemapLayerService: {
        selectLayer: vi.fn((id: string, multi: boolean) => {
            const currentSession = mockState.appKernel.workspaceManager.currentWorkspace?.tilemapSessionManager.activeSession;
            if (!currentSession) return;

            let selectedLayers = [...currentSession.layerState.selectedLayers];
            if (!multi) selectedLayers = [];
            if (selectedLayers.includes(id) && multi) {
                selectedLayers = selectedLayers.filter((layerId) => layerId !== id);
            } else {
                selectedLayers.push(id);
            }

            currentSession.updateLayerState({ selectedLayers });
            mockState.workspaceService.saveCurrentWorkspace({ waitForTimeout: false });
        }),
        toggleVisibility: vi.fn(),
        toggleLock: vi.fn(),
        toggleOpenGroupLayer: vi.fn(),
        createNewTileLayer: vi.fn(),
        createNewRuleLayer: vi.fn(),
        createNewGroupLayer: vi.fn(),
        moveLayersUp: vi.fn(),
        moveLayersDown: vi.fn(),
        duplicateLayer: vi.fn(),
        deleteLayer: vi.fn(),
        moveLayers: vi.fn(),
    },
}));

vi.mock("@/ui/components/workspace/Workspace", () => ({
    default: () => <section>Workspace ready</section>,
}));

vi.mock("pixi.js", () => ({
    Application: vi.fn(),
    Point: class Point {
        constructor(public x = 0, public y = 0) {}
    },
}));

const resetStore = <T,>(store: {
    getInitialState: () => T;
    setState: (state: T, replace: true) => void;
}) => {
    store.setState(store.getInitialState(), true);
};

const createDeferred = <T,>() => {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((innerResolve) => {
        resolve = innerResolve;
    });
    return { promise, resolve };
};

const createTilemapSession = (options: {
    sessionId: string;
    tilemapId: string;
    tilemapName: string;
    isDirty?: boolean;
}) => {
    const projectPathSystem = new ProjectPathSystem("C:/Project/Metk/integration-fixture");
    const filePathSystem = new FilePathSystem(
        options.tilemapId,
        projectPathSystem,
        `tilemaps/${options.tilemapId}.json`,
    );
    const tilesetManager = new TilesetManager(projectPathSystem);
    const rulesetManager = new RulesetManager(tilesetManager, projectPathSystem);
    const tilesetRefManager = new TilesetRefManager(tilesetManager, filePathSystem);
    const rulesetRefManager = new RulesetRefManager(rulesetManager, filePathSystem);

    const tilemap = new Tilemap(
        {
            id: options.tilemapId,
            name: options.tilemapName,
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
                    id: "ground",
                    parentId: "root",
                    type: "tile",
                    name: "Ground",
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
                {
                    id: "collision",
                    parentId: "root",
                    type: "tile",
                    name: "Collision",
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
        filePathSystem,
        tilesetRefManager,
        rulesetRefManager,
    );

    const session = new EventEmitter() as TestTilemapSession;
    session.id = options.sessionId;
    session.tilemap = tilemap;
    session.isDirty = options.isDirty ?? false;
    session.layerState = { selectedLayers: [] };
    session.updateLayerState = (state) => {
        session.layerState = { ...session.layerState, ...state };
        session.emit("onSelectedLayersChanged", session.layerState.selectedLayers);
    };
    session.historyManager = {
        startTransaction: vi.fn(),
        execute: vi.fn(),
        commitTransaction: vi.fn(),
    };
    return session;
};

const setActiveTilemapWorkspace = (session: TestTilemapSession) => {
    const workspace = {
        tilemapSessionManager: {
            activeSession: session,
            tilemapsSession: [session],
            getSession: vi.fn((sessionId: string) => (sessionId === session.id ? session : null)),
        },
    };
    mockState.appKernel.workspaceManager.currentWorkspace = workspace;
    (mockState.appKernel.editorFacade.getActiveTilemapSession as any).mockImplementation(() => session);
    (mockState.appKernel.editorFacade.getCurrentHistoryManager as any).mockImplementation(() => session.historyManager);
};

function PermissionDialogWorkflow() {
    const [status, setStatus] = useState("Layer still present");
    const dialog = useDialogStore((state) => state.dialogs[0]);

    const openDialog = () => {
        useDialogStore.getState().openDialog(
            "PERMISSION_DIALOG",
            { zLevel: DialogZLevel.AlertDialog },
            {
                permissionDialog: {
                    title: "Delete selected layer",
                    description: "This action cannot be undone.",
                    okText: "Delete",
                    cancelText: "Keep layer",
                    okButtonVariant: "destructive",
                },
                resolve: (result: boolean) => {
                    if (result) setStatus("Layer deletion confirmed");
                },
            },
        );
    };

    return (
        <>
            <button type="button" onClick={openDialog}>
                Delete selected layer
            </button>
            <div>{status}</div>
            {dialog ? <PermissionDialog dialogId={dialog.id} {...dialog.params} /> : null}
        </>
    );
}

describe("Metk integration workflows", () => {
    beforeEach(() => {
        resetStore(useAppcore);
        resetStore(useDialogStore);
        resetStore(useLayerManagerStore);
        resetStore(useProjectStore);
        resetStore(useTilemapSessionStore);
        resetStore(useTilesetSessionStore);
        resetStore(useToolbarStore);
        resetStore(useWorkspaceStore);

        mockState.appKernel.contextManager.setFlag.mockClear();
        mockState.appKernel.editorFacade.getActiveTilemapSession.mockReset();
        mockState.appKernel.editorFacade.getCurrentHistoryManager.mockReset();
        mockState.appKernel.workspaceManager.currentWorkspace = null;
        mockState.appKernel.workspaceManager.saveCurrentWorkspace.mockClear();
        mockState.workspaceService.loadProjectWorkspace.mockReset();
        mockState.workspaceService.openTilemapSession.mockReset();
        mockState.workspaceService.saveCurrentWorkspace.mockReset();
        mockState.routeProjectId = "project-alpha";
        mockState.navigate.mockClear();
        mockState.appKernel.toolManager.currentToolId = "stamp";
        mockState.appKernel.toolManager.toolContexts = [];
        mockState.appKernel.toolManager.getToolContexts.mockClear();
        mockState.appKernel.toolManager.getCurrentToolId.mockClear();
        mockState.appKernel.toolManager.startTool.mockClear();
    });

    it("loads the requested project and replaces the loading state with the workspace", async () => {
        const loadProject = createDeferred<Result>();

        useAppcore.getState().setIsAppcoreLoaded(true);
        mockState.workspaceService.loadProjectWorkspace.mockReturnValue(loadProject.promise);

        render(<WorkspacePage />);

        await waitFor(() => {
            expect(mockState.workspaceService.loadProjectWorkspace).toHaveBeenCalledWith("project-alpha");
        });
        expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();

        await act(async () => {
            loadProject.resolve(Result.Success());
        });

        expect(await screen.findByText("Workspace ready")).toBeVisible();
        await waitFor(() => {
            expect(screen.queryByRole("status", { name: "Loading" })).not.toBeInTheDocument();
        });
    });

    it("selects a layer through the layer manager and reflects the selected row state", async () => {
        const user = userEvent.setup();
        const session = createTilemapSession({
            sessionId: "session-a",
            tilemapId: "dungeon-map",
            tilemapName: "Dungeon Map",
        });

        setActiveTilemapWorkspace(session);
        useTilemapSessionStore.getState().setActiveSession(session as any);

        render(<LayerManager />);

        expect(await screen.findByText("Ground")).toBeVisible();

        await user.click(screen.getByText("Collision"));

        expect(session.layerState.selectedLayers).toEqual(["collision"]);
        expect(useLayerManagerStore.getState().selectedLayers).toEqual(["collision"]);
        expect(screen.getByText("Collision").closest("[draggable='true']")).toHaveClass("bg-accent");
    });

    it("switches tilemap sessions from tabs and updates the active tab styling", async () => {
        const user = userEvent.setup();
        const overworldSession = createTilemapSession({
            sessionId: "session-overworld",
            tilemapId: "overworld",
            tilemapName: "Overworld",
        });
        const dungeonSession = createTilemapSession({
            sessionId: "session-dungeon",
            tilemapId: "dungeon",
            tilemapName: "Dungeon",
            isDirty: true,
        });

        useTilemapSessionStore.setState({
            activeSession: overworldSession as any,
            tilemapSessions: [
                { name: "Overworld", sessionId: overworldSession.id, isDirty: false },
                { name: "Dungeon", sessionId: dungeonSession.id, isDirty: true },
            ],
        });
        mockState.workspaceService.openTilemapSession.mockImplementation(async (sessionId: string) => {
            useTilemapSessionStore
                .getState()
                .setActiveSession((sessionId === dungeonSession.id ? dungeonSession : overworldSession) as any);
        });

        render(<TilemapEditorTabs />);

        const overworldTab = screen.getByRole("button", { name: "Overworld" });
        const dungeonTab = screen.getByRole("button", { name: "Dungeon" });

        expect(overworldTab).toHaveClass("bg-surface");
        expect(dungeonTab).toHaveClass("text-muted-foreground");

        await user.click(dungeonTab);

        await waitFor(() => {
            expect(useTilemapSessionStore.getState().activeSession?.id).toBe(dungeonSession.id);
        });
        expect(dungeonTab).toHaveClass("bg-surface");
        expect(overworldTab).toHaveClass("text-muted-foreground");
    });

    it("changes the active toolbar tool after a toolbar button interaction", async () => {
        const user = userEvent.setup();

        mockState.appKernel.toolManager.toolContexts = [
            {
                id: "stamp",
                shortcuts: ["S"],
                displayOnToolbar: {
                    icon: '<svg role="img" aria-label="Stamp tool"></svg>',
                    tooltip: "Stamp",
                    index: 0,
                },
            },
            {
                id: "eraser",
                shortcuts: ["E"],
                displayOnToolbar: {
                    icon: '<svg role="img" aria-label="Eraser tool"></svg>',
                    tooltip: "Eraser",
                    index: 1,
                },
            },
        ];

        render(<ToolBar />);

        const eraserButton = await screen.findByRole("button", { name: "Eraser tool" });

        expect(useToolbarStore.getState().activeTool).toBe("stamp");

        await user.click(eraserButton);

        expect(mockState.appKernel.toolManager.startTool).toHaveBeenCalledWith("eraser");
        expect(useToolbarStore.getState().activeTool).toBe("eraser");
        expect(eraserButton).toHaveClass("bg-accent");
    });

    it("confirms a permission dialog, updates state, and removes the dialog from the UI", async () => {
        const user = userEvent.setup();

        render(<PermissionDialogWorkflow />);

        await user.click(screen.getByRole("button", { name: "Delete selected layer" }));

        expect(screen.getByRole("alertdialog", { name: "Delete selected layer" })).toBeVisible();
        expect(useDialogStore.getState().dialogs).toHaveLength(1);

        await user.click(screen.getByRole("button", { name: "Delete" }));

        expect(await screen.findByText("Layer deletion confirmed")).toBeVisible();
        await waitFor(() => {
            expect(screen.queryByRole("alertdialog", { name: "Delete selected layer" })).not.toBeInTheDocument();
        });
        expect(useDialogStore.getState().dialogs).toHaveLength(0);
    });
});
