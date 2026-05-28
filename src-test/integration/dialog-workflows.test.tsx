import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import DialogRoot from "@/ui/components/dialog/DialogRoot";
import { DIALOG_TYPES } from "@/ui/components/dialog/dialogRegistry";
import { DialogZLevel } from "@/shared/types/dialog";
import { useDialogStore } from "@/ui/stores/dialog.store";
import { WorkspaceService } from "@/shared/services/workspace.service";
import { Tileset } from "@/editor/model/tileset/tileset";
import { EditorObjectRegistry } from "@/editor/registry/editor-object.registry";
import { FilePathSystem, ProjectPathSystem } from "@/infrastructure/project-path-system";

type ResettableStore<T> = {
    getInitialState: () => T;
    setState: (state: T, replace: true) => void;
};

const mockState = vi.hoisted(() => {
    let uuidCounter = 0;

    return {
        uuid: {
            reset: () => {
                uuidCounter = 0;
            },
            v4: vi.fn(() => {
                uuidCounter += 1;
                return `dialog-id-${uuidCounter}`;
            }),
        },
        appKernel: {
            activationContext: {
                setFlag: vi.fn(),
            },
            editorFacade: {
                currentProject: null as any,
            },
        },
        workspaceService: {
            createTilemapSession: vi.fn(),
            createTilesetSession: vi.fn(),
        },
    };
});

vi.mock("uuid", () => ({ v4: mockState.uuid.v4 }));

vi.mock("@/application/bootstrap/app-kernel", () => ({
    appKernel: mockState.appKernel,
}));

vi.mock("@/shared/services/workspace.service", () => ({
    WorkspaceService: mockState.workspaceService,
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

const renderDialogRoot = () => {
    const portalRoot = document.createElement("div");
    portalRoot.id = "main-container";
    document.body.appendChild(portalRoot);

    return render(<DialogRoot />);
};

const openFormDialog = (params: Record<string, any>) => {
    return useDialogStore.getState().openDialog(
        DIALOG_TYPES.FORM,
        { zLevel: DialogZLevel.Modal },
        params,
    );
};

const openSaveDialog = (params: Record<string, any>) => {
    return useDialogStore.getState().openDialog(
        DIALOG_TYPES.SAVE,
        { zLevel: DialogZLevel.AlertDialog },
        params,
    );
};

const openOpenFileDialog = () => {
    return useDialogStore.getState().openDialog(
        DIALOG_TYPES.OPEM_FILE,
        { zLevel: DialogZLevel.Modal },
    );
};

const openEditTilesetDialog = (tileset: Record<string, any>) => {
    return useDialogStore.getState().openDialog(
        DIALOG_TYPES.EDIT_TILESET,
        { zLevel: DialogZLevel.Modal },
        { tileset },
    );
};

function DialogStackHarness() {
    const openDialog = useDialogStore((state) => state.openDialog);
    const dialogCount = useDialogStore((state) => state.dialogs.length);

    const openStackedDialogs = () => {
        openDialog(
            DIALOG_TYPES.FORM,
            { zLevel: DialogZLevel.Modal },
            {
                resolve: vi.fn(),
                formDialog: {
                    title: "Create Project",
                    cancelText: "Dismiss",
                    okText: "Create",
                    inputs: [
                        {
                            id: "project-name",
                            name: "projectName",
                            type: "text",
                            label: "Project Name",
                            defaultValue: "Metk",
                        },
                    ],
                },
            },
        );
        openDialog(
            DIALOG_TYPES.SAVE,
            { zLevel: DialogZLevel.AlertDialog },
            {
                resolve: vi.fn(),
                saveDialog: {
                    title: "Unsaved Changes",
                    description: "Choose how to close this workspace.",
                },
            },
        );
    };

    return (
        <>
            <button type="button" onClick={openStackedDialogs}>Open stacked dialogs</button>
            <output aria-label="open dialog count">{dialogCount}</output>
            <DialogRoot />
        </>
    );
}

describe("Metk dialog and form integration workflows", () => {
    beforeEach(() => {
        resetStore(useDialogStore);
        mockState.uuid.reset();
        mockState.uuid.v4.mockClear();
        mockState.appKernel.activationContext.setFlag.mockClear();
        mockState.appKernel.editorFacade.currentProject = null;
        mockState.workspaceService.createTilemapSession.mockReset();
        mockState.workspaceService.createTilesetSession.mockReset();
    });

    afterEach(() => {
        document.getElementById("main-container")?.remove();
        vi.clearAllMocks();
    });

    it("submits a valid form dialog and resolves with user input", async () => {
        const user = userEvent.setup();
        const resolve = vi.fn();
        openFormDialog({
            resolve,
            formDialog: {
                title: "Create Tilemap",
                description: "Define the new map.",
                okText: "Create",
                cancelText: "Cancel",
                inputs: [
                    {
                        id: "tilemap-name",
                        name: "name",
                        type: "text",
                        label: "Tilemap Name",
                        defaultValue: "Untitled",
                    },
                    {
                        id: "tilemap-width",
                        name: "width",
                        type: "number",
                        label: "Width",
                        min: 1,
                        defaultValue: 16,
                    },
                    {
                        id: "tilemap-visible",
                        name: "visible",
                        type: "checkbox",
                        label: "Visible",
                        defaultValue: true,
                    },
                ],
            },
        });

        renderDialogRoot();

        await user.clear(screen.getByLabelText("Tilemap Name"));
        await user.type(screen.getByLabelText("Tilemap Name"), "Overworld");
        await user.clear(screen.getByLabelText("Width"));
        await user.type(screen.getByLabelText("Width"), "32");
        await user.click(screen.getByRole("button", { name: "Create" }));

        await waitFor(() => {
            expect(resolve).toHaveBeenCalledWith({
                name: "Overworld",
                width: 32,
                visible: true,
            });
        });
        expect(useDialogStore.getState().dialogs).toEqual([]);
        expect(mockState.appKernel.activationContext.setFlag).toHaveBeenLastCalledWith("isModalOpen", false, "dialog-id-1");
    });

    it("keeps a form dialog open when validation rejects incomplete input", async () => {
        const user = userEvent.setup();
        const resolve = vi.fn();
        const validateName = vi.fn((value: string) => ({ valid: value.trim().length >= 3 }));

        openFormDialog({
            resolve,
            formDialog: {
                title: "Create Ruleset",
                okText: "Create",
                inputs: [
                    {
                        id: "ruleset-name",
                        name: "name",
                        type: "text",
                        label: "Ruleset Name",
                        defaultValue: "",
                        validate: validateName,
                    },
                ],
            },
        });

        renderDialogRoot();

        await user.type(screen.getByLabelText("Ruleset Name"), "ai");
        await user.click(screen.getByRole("button", { name: "Create" }));

        expect(validateName).toHaveBeenCalledWith("ai");
        expect(resolve).not.toHaveBeenCalled();
        expect(useDialogStore.getState().dialogs).toHaveLength(1);
        expect(screen.getByRole("dialog", { name: "Create Ruleset" })).toBeVisible();

        await user.clear(screen.getByLabelText("Ruleset Name"));
        await user.type(screen.getByLabelText("Ruleset Name"), "Terrain");
        await user.click(screen.getByRole("button", { name: "Create" }));

        await waitFor(() => {
            expect(resolve).toHaveBeenCalledWith({ name: "Terrain" });
        });
        expect(useDialogStore.getState().dialogs).toEqual([]);
    });

    it("renders open-file choices and confirms a tilemap selection", async () => {
        const user = userEvent.setup();
        mockState.appKernel.editorFacade.currentProject = {
            tilemapManager: {
                serialize: vi.fn(() => [
                    { id: "world", name: "Overworld" },
                    { id: "dungeon", name: "Dungeon" },
                ]),
            },
            tilesetManager: {
                serialize: vi.fn(() => [
                    { id: "terrain", name: "Terrain Tiles" },
                ]),
            },
        };
        openOpenFileDialog();

        renderDialogRoot();

        expect(screen.getByText("dialog.openFile.tilemap")).toBeVisible();
        expect(screen.getByText("dialog.openFile.tileset")).toBeVisible();
        expect(screen.getByText("Overworld")).toBeVisible();
        expect(screen.getByText("Terrain Tiles")).toBeVisible();

        await user.click(screen.getByText("Dungeon"));

        expect(WorkspaceService.createTilemapSession).toHaveBeenCalledWith("dungeon");
        expect(useDialogStore.getState().dialogs).toEqual([]);
    });

    it("closes the open-file dialog when the user cancels it", async () => {
        const user = userEvent.setup();
        mockState.appKernel.editorFacade.currentProject = {
            tilemapManager: {
                serialize: vi.fn(() => [{ id: "world", name: "Overworld" }]),
            },
            tilesetManager: {
                serialize: vi.fn(() => [{ id: "terrain", name: "Terrain Tiles" }]),
            },
        };
        openOpenFileDialog();

        renderDialogRoot();

        await user.click(screen.getByRole("button", { name: "Close" }));

        expect(WorkspaceService.createTilemapSession).not.toHaveBeenCalled();
        expect(WorkspaceService.createTilesetSession).not.toHaveBeenCalled();
        expect(useDialogStore.getState().dialogs).toEqual([]);
    });

    it("resolves save dialog choices from user intent", async () => {
        const user = userEvent.setup();
        const resolve = vi.fn();
        openSaveDialog({
            resolve,
            saveDialog: {
                title: "Unsaved Tilemap",
                description: "Save changes before closing?",
            },
        });

        renderDialogRoot();

        expect(screen.getByRole("alertdialog", { name: "Unsaved Tilemap" })).toBeVisible();
        await user.click(screen.getByRole("button", { name: "global.action.save" }));

        expect(resolve).toHaveBeenCalledWith("save");
        expect(useDialogStore.getState().dialogs).toEqual([]);
    });

    it("resolves save cancellation without saving", async () => {
        const user = userEvent.setup();
        const resolve = vi.fn();
        openSaveDialog({
            resolve,
            saveDialog: {
                title: "Unsaved Tilemap",
                description: "Save changes before closing?",
            },
        });

        renderDialogRoot();

        await user.click(screen.getByRole("button", { name: "global.action.cancel" }));

        expect(resolve).toHaveBeenCalledWith("cancel");
        expect(useDialogStore.getState().dialogs).toEqual([]);
    });

    it("displays edit-tileset details and closes from the dialog footer", async () => {
        const user = userEvent.setup();
        const projectPathSystem = new ProjectPathSystem("C:/project");
        const tilesetPathSystem = new FilePathSystem("terrain", projectPathSystem, "tilesets/terrain.ts.json");
        const clonedTileset = new Tileset({
            id: "terrain",
            name: "Terrain Tiles",
            columns: 8,
            rows: 4,
            tilewidth: 16,
            tileheight: 16,
            image: {
                source: "textures/terrain.png",
                width: 128,
                height: 64,
            },
            tiles: [],
        }, tilesetPathSystem, new EditorObjectRegistry());
        mockState.appKernel.editorFacade.currentProject = {
            tilesetManager: {
                cloneTileset: vi.fn(() => clonedTileset),
            },
        };
        openEditTilesetDialog({
            id: "terrain",
        });

        renderDialogRoot();

        const dialog = screen.getByRole("dialog", { name: "Edit Tileset" });
        expect(within(dialog).getByDisplayValue("Terrain Tiles")).toBeVisible();
        expect(mockState.appKernel.editorFacade.currentProject.tilesetManager.cloneTileset).toHaveBeenCalledWith("terrain");

        await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

        expect(useDialogStore.getState().dialogs).toEqual([]);
    });

    it("updates dialog stack state as dialogs open and close through the UI", async () => {
        const user = userEvent.setup({ pointerEventsCheck: 0 });
        const portalRoot = document.createElement("div");
        portalRoot.id = "main-container";
        document.body.appendChild(portalRoot);

        render(<DialogStackHarness />);

        expect(screen.getByLabelText("open dialog count")).toHaveTextContent("0");

        await user.click(screen.getByRole("button", { name: "Open stacked dialogs" }));
        expect(screen.getByLabelText("open dialog count")).toHaveTextContent("2");
        expect(useDialogStore.getState().dialogs.map((dialog) => dialog.type)).toEqual([
            DIALOG_TYPES.FORM,
            DIALOG_TYPES.SAVE,
        ]);

        await user.click(screen.getByRole("button", { name: "global.action.notSave", hidden: true }));
        expect(screen.getByLabelText("open dialog count")).toHaveTextContent("1");
        expect(useDialogStore.getState().dialogs).toHaveLength(1);

        await user.click(screen.getByRole("button", { name: "Dismiss", hidden: true }));
        expect(screen.getByLabelText("open dialog count")).toHaveTextContent("0");
        expect(useDialogStore.getState().dialogs).toEqual([]);
    });
});
