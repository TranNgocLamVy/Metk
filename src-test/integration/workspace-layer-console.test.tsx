import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EventEmitter from "eventemitter3";
import { beforeEach, describe, expect, it, vi } from "vitest";

const workspaceUiMocks = vi.hoisted(() => ({
    appKernel: {
        activationContext: {
            setFlag: vi.fn(),
        },
    },
    uuid: vi.fn(() => "dialog-id"),
    layerService: {
        selectLayer: vi.fn(),
        toggleOpenGroupLayer: vi.fn(),
        toggleVisibility: vi.fn(),
        toggleLock: vi.fn(),
        moveLayers: vi.fn(),
        renameLayer: vi.fn(),
        createNewTileLayer: vi.fn(),
        createNewRuleLayer: vi.fn(),
        createNewImageLayer: vi.fn(),
        createNewEntityLayer: vi.fn(),
        createNewGroupLayer: vi.fn(),
        moveLayersUp: vi.fn(),
        moveLayersDown: vi.fn(),
        duplicateLayer: vi.fn(),
        deleteLayer: vi.fn(),
    },
}));

vi.mock("uuid", () => ({ v4: workspaceUiMocks.uuid }));
vi.mock("@/application/bootstrap/app-kernel", () => ({ appKernel: workspaceUiMocks.appKernel }));
vi.mock("@/application/actions/tilemap-layer.actions", () => workspaceUiMocks.layerService);
vi.mock("react-i18next", () => ({
    initReactI18next: {
        type: "3rdParty",
        init: vi.fn(),
    },
    useTranslation: () => ({
        t: (message: string, options?: Record<string, any>) => options?.name ? `${message}:${options.name}` : message,
    }),
}));

import LayerManager from "@/ui/workspace/layer-manager/LayerManager";
import LayerMenuBar from "@/ui/workspace/layer-manager/LayerMenuBar";
import WorkspaceConsole from "@/ui/workspace/console/Console";
import LogConsole from "@/ui/workspace/console/LogConsole";
import ErrorConsole from "@/ui/workspace/console/ErrorConsole";
import { useConsoleStore } from "@/ui/stores/console.store";
import { useDialogStore } from "@/ui/stores/dialog.store";
import { useLayerManagerStore } from "@/ui/stores/layer-manager.store";
import { useTilemapSessionStore } from "@/ui/stores/tilemap-session.store";
import { Result } from "@/shared/types/result";

import {
    createGroupLayerData,
    createTileLayerData,
    createTilemap,
} from "../unit/application/commands/layer/layer-command-test-utils";

type TestSession = EventEmitter & {
    tilemap: ReturnType<typeof createTilemap>;
    layerState: { selectedLayers: string[] };
    markLayerChange: ReturnType<typeof vi.fn>;
    updateLayerState: (state: Partial<{ selectedLayers: string[] }>) => void;
};

const resetStores = () => {
    useConsoleStore.setState(useConsoleStore.getInitialState(), true);
    useDialogStore.setState(useDialogStore.getInitialState(), true);
    useLayerManagerStore.setState(useLayerManagerStore.getInitialState(), true);
    useTilemapSessionStore.setState(useTilemapSessionStore.getInitialState(), true);
};

const createLayerSession = () => {
    const tilemap = createTilemap([
        createGroupLayerData({
            id: "environment",
            name: "Environment",
            open: false,
            layers: [createTileLayerData({ id: "ground", name: "Ground", layerData: "0,0\n0,0" })],
        }),
        createTileLayerData({ id: "collision", name: "Collision", layerData: "0,0\n0,0" }),
    ]);
    const session = new EventEmitter() as TestSession;
    session.tilemap = tilemap;
    session.layerState = { selectedLayers: [] };
    session.markLayerChange = vi.fn();
    session.updateLayerState = (state) => {
        session.layerState = { ...session.layerState, ...state };
        session.emit("onSelectedLayersChanged", session.layerState.selectedLayers);
    };
    return session;
};

const createDataTransfer = (initial: Record<string, string> = {}) => {
    const data = { ...initial };
    return {
        effectAllowed: "",
        dropEffect: "",
        setData: vi.fn((type: string, value: string) => {
            data[type] = value;
        }),
        getData: vi.fn((type: string) => data[type] ?? ""),
    };
};

const seedLayerManagerStore = () => {
    const session = createLayerSession();
    const root = session.tilemap.rootLayer;
    const group = root.findLayer("environment")!;
    const collision = root.findLayer("collision")!;
    useLayerManagerStore.getState().setLayerViews([
        { id: group.id, layer: group, depth: 0 },
        { id: collision.id, layer: collision, depth: 0 },
    ]);
    return { session, group, collision };
};

beforeEach(() => {
    resetStores();
    vi.clearAllMocks();
    Element.prototype.scrollIntoView = vi.fn();
});

describe("Layer manager UI", () => {
    it("renders the empty tilemap state and opens the tilemap picker dialog", async () => {
        const user = userEvent.setup();

        render(<LayerManager />);

        expect(screen.getByText("workspace.tilemapEditor.empty")).toBeVisible();
        await user.click(screen.getByRole("button", { name: "workspace.tilemapEditor.open" }));

        expect(useDialogStore.getState().dialogs[0]).toMatchObject({
            type: "OPEN_FILE_DIALOG",
            params: { panel: "tilemap" },
        });
        expect(workspaceUiMocks.appKernel.activationContext.setFlag).toHaveBeenCalledWith("isModalOpen", true, "dialog-id");
    });

    it("renders nested rows when a group opens and highlights selected rows from session state", async () => {
        const session = createLayerSession();
        useTilemapSessionStore.getState().setActiveSession(session as any);

        render(<LayerManager />);

        expect(screen.getByText("Environment")).toBeVisible();
        expect(screen.getByText("Collision")).toBeVisible();
        expect(screen.queryByText("Ground")).not.toBeInTheDocument();

        act(() => {
            const group = session.tilemap.rootLayer.findLayer("environment") as any;
            group.toggleOpen(true);
            session.emit("onMarkChange", false);
            session.updateLayerState({ selectedLayers: ["ground"] });
        });

        expect(await screen.findByText("Ground")).toBeVisible();
        expect(screen.getByText("Ground").closest("[draggable='true']")).toHaveClass("bg-accent");
        expect(useLayerManagerStore.getState().selectedLayers).toEqual(["ground"]);
    });

    it("routes row selection, expand, visibility, lock, rename, and drop actions through the layer service", async () => {
        const user = userEvent.setup({ pointerEventsCheck: 0 });
        const session = createLayerSession();
        useTilemapSessionStore.getState().setActiveSession(session as any);

        render(<LayerManager />);

        const environmentRow = screen.getByText("Environment").closest("[draggable='true']") as HTMLElement;
        await user.click(environmentRow);
        expect(workspaceUiMocks.layerService.selectLayer).toHaveBeenCalledWith("environment", false);

        await user.click(environmentRow.querySelector(".w-4.cursor-pointer") as HTMLElement);
        expect(workspaceUiMocks.layerService.toggleOpenGroupLayer).toHaveBeenCalledWith("environment");

        const rowButtons = withinRowButtons(environmentRow);
        await user.click(rowButtons[0]);
        await user.click(rowButtons[1]);

        expect(workspaceUiMocks.layerService.toggleVisibility).toHaveBeenCalledWith(["environment"]);
        expect(workspaceUiMocks.layerService.toggleLock).toHaveBeenCalledWith(["environment"]);

        await user.dblClick(screen.getByText("Environment"));
        const renameInput = screen.getByDisplayValue("Environment");
        fireEvent.change(renameInput, { target: { value: "World" } });
        fireEvent.keyDown(renameInput, { key: "Enter" });

        expect(workspaceUiMocks.layerService.renameLayer).toHaveBeenCalledWith("environment", "World", true);

        const transfer = createDataTransfer({ "application/json": JSON.stringify({ ids: ["collision"] }) });
        Object.defineProperty(environmentRow, "getBoundingClientRect", {
            value: () => ({ top: 0, height: 40 }),
        });
        fireEvent.dragOver(environmentRow, { dataTransfer: transfer, clientY: 20 });
        fireEvent.drop(environmentRow, { dataTransfer: transfer });

        expect(workspaceUiMocks.layerService.moveLayers).toHaveBeenCalledWith(["collision"], "environment", "inside");
    });

    it("sets dragged ids from the current multi-selection and moves dropped rows to the root", () => {
        const session = createLayerSession();
        session.updateLayerState({ selectedLayers: ["environment", "collision"] });
        useTilemapSessionStore.getState().setActiveSession(session as any);

        const { container } = render(<LayerManager />);

        const collisionRow = screen.getByText("Collision").closest("[draggable='true']") as HTMLElement;
        const transfer = createDataTransfer();
        fireEvent.dragStart(collisionRow, { dataTransfer: transfer });

        expect(transfer.setData).toHaveBeenCalledWith("application/json", JSON.stringify({ ids: ["environment", "collision"] }));

        const rootTransfer = createDataTransfer({ "application/json": JSON.stringify({ ids: ["collision"] }) });
        const layerManagerDropTarget = container.querySelector(".layer-manager > .w-full.h-full") as HTMLElement;
        fireEvent.drop(layerManagerDropTarget, { dataTransfer: rootTransfer });

        expect(workspaceUiMocks.layerService.moveLayers).toHaveBeenCalledWith(["collision"], "root", "inside");
    });

    it("enables menu bar actions based on selected layers and sends selected/non-selected ids", async () => {
        const user = userEvent.setup({ pointerEventsCheck: 0 });
        seedLayerManagerStore();
        useLayerManagerStore.getState().setSelectedLayer(["collision"]);

        render(<LayerMenuBar />);

        const buttons = screen.getAllByRole("button");
        await user.click(buttons[1]);
        await user.click(buttons[2]);
        await user.click(buttons[3]);
        await user.click(buttons[4]);
        await user.click(buttons[5]);
        await user.click(buttons[6]);
        await user.click(buttons[7]);
        await user.click(buttons[8]);

        expect(workspaceUiMocks.layerService.moveLayersUp).toHaveBeenCalledTimes(1);
        expect(workspaceUiMocks.layerService.moveLayersDown).toHaveBeenCalledTimes(1);
        expect(workspaceUiMocks.layerService.duplicateLayer).toHaveBeenCalledTimes(1);
        expect(workspaceUiMocks.layerService.deleteLayer).toHaveBeenCalledTimes(1);
        expect(workspaceUiMocks.layerService.toggleVisibility).toHaveBeenCalledWith(["collision"]);
        expect(workspaceUiMocks.layerService.toggleLock).toHaveBeenCalledWith(["collision"]);
    });
});

describe("Console UI", () => {
    it("stays hidden while closed and renders meaningful empty states when opened", async () => {
        const user = userEvent.setup();

        const { rerender } = render(<WorkspaceConsole />);
        expect(screen.queryByText("Log")).not.toBeInTheDocument();

        useConsoleStore.getState().openWithType("log");
        rerender(<WorkspaceConsole />);

        expect(screen.getByText("No logs to display.")).toBeVisible();

        await user.click(screen.getByText("Error"));
        expect(screen.getByText("No errors.")).toBeVisible();
    });

    it("renders log actions, removes successful action logs, and removes individual log entries", async () => {
        const user = userEvent.setup();
        useConsoleStore.getState().addLog({
            id: "log-action",
            uiId: "log-ui-action",
            timestamp: new Date("2026-05-20T10:00:00Z").getTime(),
            level: "info",
            message: "Texture missing",
            details: "Choose a replacement texture.",
            actions: [{ label: "Import Texture", onClick: vi.fn(() => Result.Success()) }],
        });
        useConsoleStore.getState().addLog({
            id: "log-remove",
            uiId: "log-ui-remove",
            timestamp: new Date("2026-05-20T10:01:00Z").getTime(),
            level: "success",
            message: "Saved workspace",
        });

        render(<LogConsole />);

        expect(screen.getByText("Texture missing")).toBeVisible();
        expect(screen.getByText("Choose a replacement texture.")).toBeVisible();
        await user.click(screen.getByRole("button", { name: "Import Texture" }));
        expect(useConsoleStore.getState().logs.map((log) => log.id)).toEqual(["log-remove"]);

        await user.click(screen.getByText("Saved workspace").closest("[class*='hover:bg']")!.querySelector("button")!);
        expect(useConsoleStore.getState().logs).toEqual([]);
    });

    it("renders error stacks and removes errors through successful actions", async () => {
        const user = userEvent.setup();
        useConsoleStore.getState().addError({
            id: "error-action",
            uiId: "error-ui-action",
            timestamp: new Date("2026-05-20T10:00:00Z").getTime(),
            message: "Import failed",
            stacks: ["bad json", { key: "backend.errors.unknown" }],
            actions: [{ label: "Retry", variant: "outline", onClick: vi.fn(() => Result.Success()) }],
        });

        render(<ErrorConsole />);

        expect(screen.getByText("Import failed")).toBeVisible();
        expect(screen.getByText("bad json")).toBeVisible();
        expect(screen.getByText("backend.errors.unknown")).toBeVisible();

        await user.click(screen.getByRole("button", { name: "Retry" }));

        expect(useConsoleStore.getState().errors).toEqual([]);
    });

    it("clears the active console mode, closes the console, and supports resize dragging", async () => {
        const user = userEvent.setup();
        useConsoleStore.getState().addLog({
            id: "log-a",
            uiId: "log-ui-a",
            timestamp: Date.now(),
            level: "warning",
            message: "Unsaved changes",
        });
        useConsoleStore.getState().addError({
            id: "error-a",
            uiId: "error-ui-a",
            timestamp: Date.now(),
            message: "Save failed",
        });
        useConsoleStore.getState().openWithType("log");

        const { container } = render(<div style={{ height: 500 }}><WorkspaceConsole /></div>);
        const consolePanel = container.querySelector(".absolute.bottom-0") as HTMLElement;
        Object.defineProperty(consolePanel.parentElement!, "getBoundingClientRect", {
            value: () => ({ bottom: 500, height: 500 }),
        });

        fireEvent.mouseDown(container.querySelector(".draggable-resize")!, { clientY: 300 });
        fireEvent.mouseMove(document, { clientY: 250 });
        fireEvent.mouseUp(document);

        expect(consolePanel).toHaveStyle({ height: "250px" });

        await user.click(screen.getAllByRole("button")[0]);
        expect(useConsoleStore.getState().logs).toEqual([]);
        expect(useConsoleStore.getState().errors).toHaveLength(1);

        await user.click(screen.getByText("Error"));
        await user.click(screen.getAllByRole("button")[0]);
        expect(useConsoleStore.getState().errors).toEqual([]);

        await user.click(screen.getAllByRole("button")[1]);
        expect(useConsoleStore.getState().isConsoleOpen).toBe(false);
    });
});

function withinRowButtons(row: HTMLElement) {
    return Array.from(row.querySelectorAll("button"));
}
