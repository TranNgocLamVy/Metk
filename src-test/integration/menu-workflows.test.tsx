import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import MenuBar from "@/ui/components/menuBar/MenuBar";
import DialogRoot from "@/ui/components/dialog/DialogRoot";
import { useConsoleStore } from "@/ui/stores/console.store";
import { useDialogStore } from "@/ui/stores/dialog.store";
import { usePropertyStore } from "@/ui/stores/property.store";
import { ProjectService } from "@/shared/services/project.service";
import { TilemapService } from "@/shared/services/tilemap.service";
import { TilemapLayerService } from "@/shared/services/tilemap-layer.service";
import { executeCommand } from "@/shared/services/command.service";

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

vi.mock("@/shared/services/command.service", () => ({
    executeCommand: mockState.commandService.executeCommand,
}));

vi.mock("@/shared/services/project.service", () => ({
    ProjectService: mockState.projectService,
}));

vi.mock("@/shared/services/tilemap.service", () => ({
    TilemapService: mockState.tilemapService,
}));

vi.mock("@/shared/services/tileset.service", () => ({
    TilesetService: mockState.tilesetService,
}));

vi.mock("@/shared/services/ruleset.service", () => ({
    RulesetService: mockState.rulesetService,
}));

vi.mock("@/shared/services/tilemap-layer.service", () => ({
    TilemapLayerService: mockState.layerService,
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

vi.mock("@/shared/services/i18n.service", () => ({
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
    mockState.appKernel.editorFacade.getCurrentHistoryManager.mockReturnValue({
        canUndo: true,
        canRedo: true,
    } as any);
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

        expect(ProjectService.createProject).toHaveBeenCalledTimes(1);

        await openMenu(user, "menu.file.label");
        await user.keyboard("{ArrowDown}{ArrowRight}{ArrowDown}{Enter}");

        expect(TilemapService.createTilemap).toHaveBeenCalledTimes(1);

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

        expect(TilemapLayerService.createNewTileLayer).toHaveBeenCalledTimes(1);

        await openMenu(user, "menu.layer.label");
        await user.keyboard("{ArrowDown}{ArrowRight}{ArrowDown}{ArrowDown}{Enter}");

        expect(TilemapLayerService.createNewGroupLayer).toHaveBeenCalledTimes(1);

        await openMenu(user, "menu.layer.label");
        await clickMenuItem(user, "menu.layer.action.duplicateLayer");

        await openMenu(user, "menu.layer.label");
        await clickMenuItem(user, "menu.layer.action.showHideLayer");

        await openMenu(user, "menu.layer.label");
        await clickMenuItem(user, "menu.layer.action.deleteLayer");

        expect(TilemapLayerService.duplicateLayer).toHaveBeenCalledTimes(1);
        expect(TilemapLayerService.toggleSelectedLayersVisibility).toHaveBeenCalledTimes(1);
        expect(TilemapLayerService.deleteLayer).toHaveBeenCalledTimes(1);
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
