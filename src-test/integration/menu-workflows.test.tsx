import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import MenuBar from "@/ui/components/menu-bar/MenuBar";
import DialogRoot from "@/ui/components/dialog/DialogRoot";
import { useConsoleStore } from "@/ui/stores/console.store";
import { useDialogStore } from "@/ui/stores/dialog.store";
import { usePropertyStore } from "@/ui/stores/property.store";
import * as ProjectActions from "@/application/actions/project.actions";
import * as TilemapActions from "@/application/actions/tilemap.actions";
import * as TilemapLayerActions from "@/application/actions/tilemap-layer.actions";
import { executeCommand } from "@/application/actions/command.actions";

type ResettableStore<T> = {
    getInitialState: () => T;
    setState: (state: T, replace: true) => void;
};

const mockState = vi.hoisted(() => ({
    theme: {
        setTheme: vi.fn(),
    },
    commandService: {
        executeCommand: vi.fn(),
    },
    projectService: {
        createProject: vi.fn(),
    },
    tilemapService: {
        createTilemap: vi.fn(),
    },
    tilesetService: {
        createTileset: vi.fn(),
    },
    rulesetService: {
        createRuleset: vi.fn(),
    },
    layerService: {
        createNewTileLayer: vi.fn(),
        createNewRuleLayer: vi.fn(),
        createNewImageLayer: vi.fn(),
        createNewEntityLayer: vi.fn(),
        createNewGroupLayer: vi.fn(),
        duplicateLayer: vi.fn(),
        deleteLayer: vi.fn(),
        selectAllLayers: vi.fn(),
        moveLayersUp: vi.fn(),
        moveLayersDown: vi.fn(),
        toggleSelectedLayersVisibility: vi.fn(),
        toggleSelectedLayersLock: vi.fn(),
        toggleNonSelectedLayersVisibility: vi.fn(),
        toggleNonSelectedLayersLock: vi.fn(),
    },
    appKernel: {
        activationContext: {
            setFlag: vi.fn(),
        },
        editorFacade: {
            getActiveTilemapSession: vi.fn(() => null),
            getCurrentEditorSession: vi.fn(() => null),
            getCurrentHistoryManager: vi.fn(() => null),
        },
        projectManager: {
            currentProject: null as any,
            serialize: vi.fn(() => []),
        },
        workspaceManager: {
            currentWorkspace: null as any,
        },
        saveProjectManager: vi.fn(),
    },
}));

vi.mock("@/app/providers/theme.provider", () => ({
    useTheme: () => ({
        theme: "light",
        setTheme: mockState.theme.setTheme,
    }),
}));

vi.mock("@/application/bootstrap/app-kernel", () => ({
    appKernel: mockState.appKernel,
}));

vi.mock("@/application/actions/command.actions", () => ({
    executeCommand: mockState.commandService.executeCommand,
}));

vi.mock("@/application/actions/project.actions", () => mockState.projectService);

vi.mock("@/application/actions/tilemap.actions", () => mockState.tilemapService);

vi.mock("@/application/actions/tileset.actions", () => mockState.tilesetService);

vi.mock("@/application/actions/ruleset.actions", () => mockState.rulesetService);

vi.mock("@/application/actions/tilemap-layer.actions", () => mockState.layerService);

vi.mock("react-i18next", () => ({
    initReactI18next: {
        type: "3rdParty",
        init: vi.fn(),
    },
    useTranslation: () => ({
        t: (message: string) => message,
    }),
}));

vi.mock("@/app/providers/i18n", () => ({
    default: { language: "en" },
    i18nService: {
        changeLanguage: vi.fn(),
    },
}));

vi.mock("@pixi/react", () => ({
    Application: ({ className }: { className?: string }) => <div data-testid="pixi-application" className={className} />,
}));

vi.mock("pixi.js", () => ({
    Application: vi.fn(),
    Container: class Container {},
    Graphics: class Graphics {},
    Point: class Point {
        constructor(public x = 0, public y = 0) {}
    },
    Sprite: class Sprite {},
    Texture: { EMPTY: {}, WHITE: {} },
}));

const resetStore = <T,>(store: ResettableStore<T>) => {
    store.setState(store.getInitialState(), true);
};

const setActiveProject = () => {
    mockState.appKernel.projectManager.currentProject = { id: "project-alpha" };
};

const setActiveTilemapSession = () => {
    const session = {
        id: "session-overworld",
        isDirty: true,
        historyManager: {
            canUndo: true,
            canRedo: true,
        },
        layerState: { selectedLayers: ["ground"] },
        tilemap: {
            id: "overworld",
            objectId: "tilemap-overworld-object",
            name: "Overworld",
            width: 32,
            height: 24,
        },
    };
    mockState.appKernel.editorFacade.getActiveTilemapSession.mockReturnValue(session as any);
    mockState.appKernel.editorFacade.getCurrentEditorSession.mockReturnValue(session as any);
    mockState.appKernel.editorFacade.getCurrentHistoryManager.mockReturnValue(session.historyManager as any);
    mockState.appKernel.workspaceManager.currentWorkspace = {
        tilemapSessionManager: {
            tilemapsSession: [session],
        },
    };
    return session;
};

const renderMenuBar = () => render(<MenuBar />);

const renderMenuBarWithDialogs = () => {
    const portalRoot = document.createElement("div");
    portalRoot.id = "main-container";
    document.body.appendChild(portalRoot);

    return render(
        <>
            <MenuBar />
            <DialogRoot />
        </>,
    );
};

const openMenu = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
    await user.click(screen.getByText(label));
};

const clickMenuItem = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
    const text = await screen.findByText(label);
    const menuItem = text.closest("[role='menuitem'], [role='menuitemcheckbox'], [role='menuitemradio']") ?? text;
    await user.click(menuItem as HTMLElement);
};

const hoverMenuItem = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
    const text = await screen.findByText(label);
    const menuItem = text.closest("[role='menuitem'], [role='menuitemcheckbox'], [role='menuitemradio']") ?? text;
    await user.hover(menuItem as HTMLElement);
};

describe("Metk menu-driven integration workflows", () => {
    beforeEach(() => {
        resetStore(useConsoleStore);
        resetStore(useDialogStore);
        resetStore(usePropertyStore);
        mockState.appKernel.projectManager.currentProject = null;
        mockState.appKernel.workspaceManager.currentWorkspace = null;
        mockState.appKernel.editorFacade.getActiveTilemapSession.mockReset().mockReturnValue(null);
        mockState.appKernel.editorFacade.getCurrentEditorSession.mockReset().mockReturnValue(null);
        mockState.appKernel.editorFacade.getCurrentHistoryManager.mockReset().mockReturnValue(null);
        mockState.appKernel.activationContext.setFlag.mockClear();
        mockState.commandService.executeCommand.mockClear();
        mockState.projectService.createProject.mockClear();
        mockState.tilemapService.createTilemap.mockClear();
        mockState.layerService.createNewTileLayer.mockClear();
        mockState.layerService.createNewGroupLayer.mockClear();
        mockState.layerService.duplicateLayer.mockClear();
        mockState.layerService.deleteLayer.mockClear();
        mockState.layerService.toggleSelectedLayersVisibility.mockClear();
    });

    afterEach(() => {
        document.getElementById("main-container")?.remove();
        vi.clearAllMocks();
    });

    it("dispatches file menu actions for project creation and tilemap save workflows", async () => {
        const user = userEvent.setup();
        setActiveProject();
        setActiveTilemapSession();
        renderMenuBar();

        await openMenu(user, "menu.file.label");
        await user.keyboard("{ArrowDown}{ArrowRight}{Enter}");

        expect(ProjectActions.createProject).toHaveBeenCalledTimes(1);

        await openMenu(user, "menu.file.label");
        await user.keyboard("{ArrowDown}{ArrowRight}{ArrowDown}{Enter}");

        expect(TilemapActions.createTilemap).toHaveBeenCalledTimes(1);

        await openMenu(user, "menu.file.label");
        await clickMenuItem(user, "menu.file.action.save");

        expect(executeCommand).toHaveBeenCalledWith("workspace.tilemap.save");
    });

    it("dispatches edit menu undo and redo commands when history is available", async () => {
        const user = userEvent.setup();
        setActiveTilemapSession();
        renderMenuBar();

        await openMenu(user, "menu.edit.label");
        await clickMenuItem(user, "menu.edit.action.undo");

        await openMenu(user, "menu.edit.label");
        await clickMenuItem(user, "menu.edit.action.redo");

        expect(executeCommand).toHaveBeenCalledWith("workspace.tilemap.undo");
        expect(executeCommand).toHaveBeenCalledWith("workspace.tilemap.redo");
    });

    it("invokes layer creation, duplication, deletion, and visibility workflows from the layer menu", async () => {
        const user = userEvent.setup();
        setActiveTilemapSession();
        renderMenuBar();

        await openMenu(user, "menu.layer.label");
        await user.keyboard("{ArrowDown}{ArrowRight}{Enter}");

        expect(TilemapLayerActions.createNewTileLayer).toHaveBeenCalledTimes(1);

        await openMenu(user, "menu.layer.label");
        await user.keyboard("{ArrowDown}{ArrowRight}{ArrowDown}{ArrowDown}{Enter}");

        expect(TilemapLayerActions.createNewGroupLayer).toHaveBeenCalledTimes(1);

        await openMenu(user, "menu.layer.label");
        await clickMenuItem(user, "menu.layer.action.duplicateLayer");

        await openMenu(user, "menu.layer.label");
        await clickMenuItem(user, "menu.layer.action.showHideLayer");

        await openMenu(user, "menu.layer.label");
        await clickMenuItem(user, "menu.layer.action.deleteLayer");

        expect(TilemapLayerActions.duplicateLayer).toHaveBeenCalledTimes(1);
        expect(TilemapLayerActions.toggleSelectedLayersVisibility).toHaveBeenCalledTimes(1);
        expect(TilemapLayerActions.deleteLayer).toHaveBeenCalledTimes(1);
    });

    it("updates console state from the view menu console toggle", async () => {
        const user = userEvent.setup();
        renderMenuBar();

        expect(useConsoleStore.getState().isConsoleOpen).toBe(false);

        await openMenu(user, "menu.view.label");
        await user.keyboard("{ArrowDown}{ArrowRight}{ArrowDown}{Enter}");

        expect(useConsoleStore.getState().isConsoleOpen).toBe(true);

        await openMenu(user, "menu.view.label");
        await user.keyboard("{ArrowDown}{ArrowRight}{ArrowDown}{Enter}");

        expect(useConsoleStore.getState().isConsoleOpen).toBe(false);
    });

    it("selects the active tilemap for property editing from the map menu", async () => {
        const user = userEvent.setup();
        setActiveTilemapSession();
        renderMenuBar();

        await openMenu(user, "menu.map.label");
        await clickMenuItem(user, "menu.map.action.mapProperties");

        expect(useDialogStore.getState().dialogs).toHaveLength(0);
        expect(usePropertyStore.getState().objectId).toBe("tilemap-overworld-object");
    });
});
