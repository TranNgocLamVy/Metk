import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ExportTilemapTMXCommand } from "@/application/command-system/export-tilemap.command";
import { OpenFileCommand } from "@/application/command-system/open-file.command";
import { RedoCommand } from "@/application/command-system/redo.command";
import { SaveAllTilemapCommand } from "@/application/command-system/save-all-tilemap.command";
import { SaveTilemapCommand } from "@/application/command-system/save-tilemap.command";
import { ToggleConsoleCommand } from "@/application/command-system/toggle-terminal.command";
import { UndoCommand } from "@/application/command-system/undo.command";
import { EditorFacade } from "@/application/editor.facade";
import { ExportStorageService } from "@/infrastructure/export-storage.service";
import { TmxTilemapExporter } from "@/application/exporter/tmx-tilemap.exporter";
import { Console } from "@/shared/services/console.service";
import { Result } from "@/shared/types/result";
import { useConsoleStore } from "@/ui/stores/console.store";
import { useDialogStore } from "@/ui/stores/dialog.store";
import { save } from "@tauri-apps/plugin-dialog";

type ResettableStore<T> = {
    getInitialState: () => T;
    setState: (state: T, replace: true) => void;
};

const mockState = vi.hoisted(() => ({
    dialogSave: vi.fn(),
    exporterExport: vi.fn(() => new Uint8Array([1, 2, 3])),
    storageExportToPath: vi.fn(),
    consoleSuccess: vi.fn(),
    consoleError: vi.fn(),
    appKernel: {
        contextManager: {
            setFlag: vi.fn(),
        },
    },
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({
    save: mockState.dialogSave,
}));

vi.mock("@/application/exporter/tmx-tilemap.exporter", () => ({
    TmxTilemapExporter: vi.fn().mockImplementation(function () {
        return {
        export: mockState.exporterExport,
        };
    }),
}));

vi.mock("@/infrastructure/export-storage.service", () => ({
    ExportStorageService: vi.fn().mockImplementation(function () {
        return {
        exportToPath: mockState.storageExportToPath,
        };
    }),
}));

vi.mock("@/shared/services/console.service", () => ({
    Console: {
        success: mockState.consoleSuccess,
        error: mockState.consoleError,
    },
}));

vi.mock("@/application/bootstrap/app-kernel", () => ({
    appKernel: mockState.appKernel,
}));

const resetStore = <T,>(store: ResettableStore<T>) => {
    store.setState(store.getInitialState(), true);
};

const createTilemapSession = (id: string, name = `${id} map`) => ({
    tilemap: { id, name },
    markAsClean: vi.fn(),
});

const createEditorFacade = (overrides: {
    currentProject?: any;
    currentWorkspace?: any;
    activeTilemapSession?: any;
    historyManager?: any;
} = {}) => {
    const editorFacade = {
        currentProject: overrides.currentProject ?? null,
        currentWorkspace: overrides.currentWorkspace ?? null,
        workspaceManager: {
            saveCurrentWorkspace: vi.fn(() => Promise.resolve(Result.Success())),
        },
        getActiveTilemapSession: vi.fn(() => overrides.activeTilemapSession ?? null),
        getCurrentHistoryManager: vi.fn(() => overrides.historyManager ?? null),
    };
    return editorFacade as unknown as EditorFacade & typeof editorFacade;
};

describe("system command orchestration", () => {
    beforeEach(() => {
        resetStore(useConsoleStore);
        resetStore(useDialogStore);
        mockState.dialogSave.mockReset();
        mockState.exporterExport.mockClear();
        mockState.storageExportToPath.mockReset();
        mockState.consoleSuccess.mockClear();
        mockState.consoleError.mockClear();
        mockState.appKernel.contextManager.setFlag.mockClear();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("OpenFileCommand", () => {
        it("opens the file dialog through the dialog store and returns success", () => {
            const editorFacade = createEditorFacade();
            const result = new OpenFileCommand().execute(editorFacade);

            expect(result.status).toBe("Success");
            expect(useDialogStore.getState().dialogs).toEqual([
                expect.objectContaining({
                    type: "OPEN_FILE_DIALOG",
                    config: { zLevel: 500 },
                }),
            ]);
            expect(mockState.appKernel.contextManager.setFlag).toHaveBeenCalledWith(
                "isModalOpen",
                true,
                expect.any(String),
            );
        });
    });

    describe("SaveTilemapCommand", () => {
        it("cancels when there is no current project or active tilemap session", async () => {
            await expect(new SaveTilemapCommand().execute(createEditorFacade())).resolves.toMatchObject({
                status: "Cancel",
            });

            const project = { tilemapManager: { saveTilemap: vi.fn() } };
            await expect(new SaveTilemapCommand().execute(createEditorFacade({ currentProject: project }))).resolves.toMatchObject({
                status: "Cancel",
            });
            expect(project.tilemapManager.saveTilemap).not.toHaveBeenCalled();
        });

        it("saves the active tilemap, marks the session clean, and reports success", async () => {
            const session = createTilemapSession("tilemap-a", "Overworld");
            const project = {
                tilemapManager: {
                    saveTilemap: vi.fn(() => Promise.resolve(Result.Success("saved"))),
                },
            };
            const editorFacade = createEditorFacade({ currentProject: project, activeTilemapSession: session });

            await expect(new SaveTilemapCommand().execute(editorFacade)).resolves.toEqual({
                status: "Success",
                data: "saved",
                message: undefined,
            });

            expect(project.tilemapManager.saveTilemap).toHaveBeenCalledWith("tilemap-a");
            expect(session.markAsClean).toHaveBeenCalledTimes(1);
            expect(Console.success).toHaveBeenCalledWith({
                message: { key: "message.tilemap.saveSuccess", options: { name: "Overworld" } },
            });
        });

        it("returns storage failure without marking the session clean", async () => {
            const session = createTilemapSession("tilemap-a");
            const failure = Result.Error("storage failed");
            const project = {
                tilemapManager: {
                    saveTilemap: vi.fn(() => Promise.resolve(failure)),
                },
            };
            const editorFacade = createEditorFacade({ currentProject: project, activeTilemapSession: session });

            await expect(new SaveTilemapCommand().execute(editorFacade)).resolves.toBe(failure);

            expect(project.tilemapManager.saveTilemap).toHaveBeenCalledWith("tilemap-a");
            expect(session.markAsClean).not.toHaveBeenCalled();
            expect(Console.success).not.toHaveBeenCalled();
        });
    });

    describe("SaveAllTilemapCommand", () => {
        it("cancels when project or workspace state is missing", async () => {
            const project = { tilemapManager: { saveTilemap: vi.fn() } };

            await expect(new SaveAllTilemapCommand().execute(createEditorFacade())).resolves.toMatchObject({
                status: "Cancel",
            });
            await expect(new SaveAllTilemapCommand().execute(createEditorFacade({ currentProject: project }))).resolves.toMatchObject({
                status: "Cancel",
            });
            expect(project.tilemapManager.saveTilemap).not.toHaveBeenCalled();
        });

        it("saves every tilemap session and marks only successful saves clean", async () => {
            const cleanSession = createTilemapSession("clean-map");
            const failingSession = createTilemapSession("failing-map");
            const project = {
                tilemapManager: {
                    saveTilemap: vi.fn((id: string) => Promise.resolve(
                        id === "failing-map" ? Result.Error("save failed") : Result.Success(),
                    )),
                },
            };
            const workspace = {
                tilemapSessionManager: {
                    tilemapsSession: [cleanSession, failingSession],
                },
            };
            const editorFacade = createEditorFacade({ currentProject: project, currentWorkspace: workspace });

            await expect(new SaveAllTilemapCommand().execute(editorFacade)).resolves.toMatchObject({
                status: "Success",
            });

            expect(project.tilemapManager.saveTilemap).toHaveBeenNthCalledWith(1, "clean-map");
            expect(project.tilemapManager.saveTilemap).toHaveBeenNthCalledWith(2, "failing-map");
            expect(cleanSession.markAsClean).toHaveBeenCalledTimes(1);
            expect(failingSession.markAsClean).not.toHaveBeenCalled();
            expect(Console.success).toHaveBeenCalledWith({ message: "message.tilemap.saveAllSuccess" });
        });
    });

    describe("UndoCommand and RedoCommand", () => {
        it("delegates undo and redo to the current history manager", () => {
            const historyManager = {
                undo: vi.fn(),
                redo: vi.fn(),
            };
            const editorFacade = createEditorFacade({ historyManager });

            expect(new UndoCommand().execute(editorFacade)).toMatchObject({ status: "Success" });
            expect(new RedoCommand().execute(editorFacade)).toMatchObject({ status: "Success" });

            expect(historyManager.undo).toHaveBeenCalledWith(editorFacade);
            expect(historyManager.redo).toHaveBeenCalledWith(editorFacade);
        });

        it("cancels undo and redo when no history manager is active", () => {
            const editorFacade = createEditorFacade();

            expect(new UndoCommand().execute(editorFacade)).toMatchObject({ status: "Cancel" });
            expect(new RedoCommand().execute(editorFacade)).toMatchObject({ status: "Cancel" });
        });
    });

    describe("ToggleConsoleCommand", () => {
        it("toggles console visibility through the console store", () => {
            const editorFacade = createEditorFacade();

            expect(useConsoleStore.getState().isConsoleOpen).toBe(false);
            expect(new ToggleConsoleCommand().execute(editorFacade)).toMatchObject({ status: "Success" });
            expect(useConsoleStore.getState().isConsoleOpen).toBe(true);

            new ToggleConsoleCommand().execute(editorFacade);
            expect(useConsoleStore.getState().isConsoleOpen).toBe(false);
        });
    });

    describe("ExportTilemapTMXCommand", () => {
        it("cancels when workspace or active tilemap session is missing", async () => {
            const workspace = {
                tilemapSessionManager: { activeSession: null },
                savedPathManager: { getExportPath: vi.fn() },
            };

            await expect(new ExportTilemapTMXCommand().execute(createEditorFacade())).resolves.toMatchObject({
                status: "Cancel",
            });
            await expect(new ExportTilemapTMXCommand().execute(createEditorFacade({ currentWorkspace: workspace }))).resolves.toMatchObject({
                status: "Cancel",
            });
            expect(TmxTilemapExporter).not.toHaveBeenCalled();
            expect(ExportStorageService).not.toHaveBeenCalled();
        });

        it("exports using an existing saved path, persists the path, and saves the workspace", async () => {
            const session = createTilemapSession("tilemap-a", "Overworld");
            const workspace = {
                tilemapSessionManager: { activeSession: session },
                savedPathManager: {
                    getExportPath: vi.fn(() => "C:/exports/overworld.tmx"),
                    setExportPath: vi.fn(),
                },
            };
            const editorFacade = createEditorFacade({ currentWorkspace: workspace });
            mockState.storageExportToPath.mockResolvedValue(Result.Success("written"));

            await expect(new ExportTilemapTMXCommand().execute(editorFacade)).resolves.toEqual({
                status: "Success",
                data: "written",
                message: undefined,
            });

            expect(save).not.toHaveBeenCalled();
            expect(TmxTilemapExporter).toHaveBeenCalledTimes(1);
            expect(mockState.exporterExport).toHaveBeenCalledWith(
                session.tilemap,
                "C:/exports/overworld.tmx",
                editorFacade,
            );
            expect(mockState.storageExportToPath).toHaveBeenCalledWith(
                "C:/exports/overworld.tmx",
                new Uint8Array([1, 2, 3]),
            );
            expect(workspace.savedPathManager.setExportPath).toHaveBeenCalledWith("tilemap-a", "C:/exports/overworld.tmx");
            expect(editorFacade.workspaceManager.saveCurrentWorkspace).toHaveBeenCalledTimes(1);
            expect(Console.success).toHaveBeenCalledWith({ message: "message.tilemap.exportSuccess" });
        });

        it("prompts for an export path when none is saved and cancels if the user dismisses", async () => {
            const session = createTilemapSession("tilemap-a");
            const workspace = {
                tilemapSessionManager: { activeSession: session },
                savedPathManager: {
                    getExportPath: vi.fn(() => null),
                    setExportPath: vi.fn(),
                },
            };
            mockState.dialogSave.mockResolvedValue(null);

            await expect(new ExportTilemapTMXCommand().execute(createEditorFacade({ currentWorkspace: workspace }))).resolves.toMatchObject({
                status: "Cancel",
            });

            expect(save).toHaveBeenCalledWith({
                filters: [{ name: "TMX", extensions: ["tmx"] }],
                canCreateDirectories: true,
                title: "Export Tilemap",
            });
            expect(TmxTilemapExporter).not.toHaveBeenCalled();
            expect(ExportStorageService).not.toHaveBeenCalled();
            expect(workspace.savedPathManager.setExportPath).not.toHaveBeenCalled();
        });

        it("returns export storage failures without saving path metadata", async () => {
            const session = createTilemapSession("tilemap-a");
            const failure = Result.Error("write failed");
            const workspace = {
                tilemapSessionManager: { activeSession: session },
                savedPathManager: {
                    getExportPath: vi.fn(() => null),
                    setExportPath: vi.fn(),
                },
            };
            const editorFacade = createEditorFacade({ currentWorkspace: workspace });
            mockState.dialogSave.mockResolvedValue("C:/exports/new-map.tmx");
            mockState.storageExportToPath.mockResolvedValue(failure);

            await expect(new ExportTilemapTMXCommand().execute(editorFacade)).resolves.toBe(failure);

            expect(mockState.exporterExport).toHaveBeenCalledWith(
                session.tilemap,
                "C:/exports/new-map.tmx",
                editorFacade,
            );
            expect(mockState.storageExportToPath).toHaveBeenCalledWith(
                "C:/exports/new-map.tmx",
                new Uint8Array([1, 2, 3]),
            );
            expect(workspace.savedPathManager.setExportPath).not.toHaveBeenCalled();
            expect(editorFacade.workspaceManager.saveCurrentWorkspace).not.toHaveBeenCalled();
            expect(Console.success).not.toHaveBeenCalled();
        });
    });
});
