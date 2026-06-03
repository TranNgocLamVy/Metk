import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const storageState = vi.hoisted(() => ({
    WorkspaceStorageService: {
        exists: vi.fn(),
        load: vi.fn(),
        save: vi.fn(),
    },
}));

vi.mock("@/infrastructure/container", () => storageState);

import { WorkspaceManager } from "@/application/workspace/workspace.manager";
import { WorkspaceStorageService } from "@/infrastructure/container";
import { ProjectPathSystem } from "@/infrastructure/project-path-system";
import { defaultWorkspaceData, WorkpsaceData } from "@/shared/data-types/workspace.data";
import { Result } from "@/shared/types/result";

const createEditorFacade = () => ({
    toolManager: {
        startTool: vi.fn(),
        startToolFamily: vi.fn(),
        getCurrentFamilyId: vi.fn(() => null),
        on: vi.fn(),
        off: vi.fn(),
    },
}) as any;

const createProject = () => ({
    projectPathSystem: new ProjectPathSystem("C:/Project/Metk/test-project"),
    tilesetManager: {
        loadTileset: vi.fn(),
    },
    tilemapManager: {
        loadTilemap: vi.fn(),
    },
}) as any;

const createStoredWorkspaceData = (): WorkpsaceData => ({
    ...defaultWorkspaceData,
    toolState: { currentToolFamily: "stamp" },
    savedPath: {
        exportPaths: [{ tilemapId: "tilemap-a", exportPath: "C:/exports/tilemap-a.tmx" }],
        tilemapDir: "C:/maps",
        tilesetDir: "C:/tilesets",
        rulesetDir: "C:/rulesets",
        textureDir: "C:/textures",
    },
});

describe("WorkspaceManager", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        (WorkspaceStorageService.exists as any).mockResolvedValue(false);
        (WorkspaceStorageService.load as any).mockResolvedValue(Result.Success(createStoredWorkspaceData()));
        (WorkspaceStorageService.save as any).mockResolvedValue(Result.Success());
    });

    afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    it("loads a default workspace when no session file exists, registers tool listeners, and emits load", async () => {
        const manager = new WorkspaceManager();
        const editorFacade = createEditorFacade();
        const project = createProject();
        const loaded = vi.fn();
        manager.setEditorContext(editorFacade);
        manager.on("onWorkspaceLoaded", loaded);

        const result = await manager.loadWorkspace(project);

        expect(result.status).toBe(Result.Status.Success);
        expect(manager.currentWorkspace).toBe(result.data);
        expect(WorkspaceStorageService.exists).toHaveBeenCalledWith("C:/Project/Metk/test-project/.metk/session.json");
        expect(editorFacade.toolManager.on).toHaveBeenCalledWith("onToolChanged", expect.any(Function));
        expect(loaded).toHaveBeenCalledWith(manager.currentWorkspace);
        expect(manager.currentWorkspace?.serialize()).toEqual(defaultWorkspaceData);

        await vi.advanceTimersByTimeAsync(1000);
        expect(WorkspaceStorageService.save).toHaveBeenCalledWith(
            "C:/Project/Metk/test-project/.metk/session.json",
            defaultWorkspaceData,
        );
    });

    it("loads an existing workspace session without overwriting it", async () => {
        const manager = new WorkspaceManager();
        const editorFacade = createEditorFacade();
        const project = createProject();
        const storedWorkspaceData = createStoredWorkspaceData();
        manager.setEditorContext(editorFacade);
        (WorkspaceStorageService.exists as any).mockResolvedValue(true);
        (WorkspaceStorageService.load as any).mockResolvedValue(Result.Success(storedWorkspaceData));

        const result = await manager.loadWorkspace(project);

        expect(result.status).toBe(Result.Status.Success);
        expect(WorkspaceStorageService.load).toHaveBeenCalledWith("C:/Project/Metk/test-project/.metk/session.json");
        expect(editorFacade.toolManager.startToolFamily).toHaveBeenCalledWith("stamp");
        expect(manager.currentWorkspace?.serialize()).toEqual(storedWorkspaceData);
        expect(WorkspaceStorageService.save).not.toHaveBeenCalled();
    });

    it("falls back to a default workspace and schedules a save when existing session loading fails", async () => {
        const manager = new WorkspaceManager();
        const project = createProject();
        manager.setEditorContext(createEditorFacade());
        (WorkspaceStorageService.exists as any).mockResolvedValue(true);
        (WorkspaceStorageService.load as any).mockResolvedValue(Result.Error("workspace load failed"));

        const result = await manager.loadWorkspace(project);

        expect(result.status).toBe(Result.Status.Success);
        expect(manager.currentWorkspace?.serialize()).toEqual(defaultWorkspaceData);

        await vi.advanceTimersByTimeAsync(1000);
        expect(WorkspaceStorageService.save).toHaveBeenCalledWith(
            "C:/Project/Metk/test-project/.metk/session.json",
            defaultWorkspaceData,
        );
    });

    it("destroys the existing workspace before loading a replacement workspace", async () => {
        const manager = new WorkspaceManager();
        const project = createProject();
        const existingWorkspace = { destroy: vi.fn(async () => undefined) };
        manager.setEditorContext(createEditorFacade());
        manager.currentWorkspace = existingWorkspace as any;

        await manager.loadWorkspace(project);

        expect(existingWorkspace.destroy).toHaveBeenCalledTimes(1);
        expect(manager.currentWorkspace).not.toBe(existingWorkspace);
    });

    it("saves immediately when requested without debounce", async () => {
        const manager = new WorkspaceManager();
        const project = createProject();
        manager.setEditorContext(createEditorFacade());
        await manager.loadWorkspace(project);
        (WorkspaceStorageService.save as any).mockClear();

        const result = await manager.saveCurrentWorkspace(false);

        expect(result.status).toBe(Result.Status.Success);
        expect(WorkspaceStorageService.save).toHaveBeenCalledTimes(1);
        expect(WorkspaceStorageService.save).toHaveBeenCalledWith(
            "C:/Project/Metk/test-project/.metk/session.json",
            defaultWorkspaceData,
        );
    });

    it("debounces delayed saves and persists only the latest workspace state", async () => {
        const manager = new WorkspaceManager();
        const project = createProject();
        manager.setEditorContext(createEditorFacade());
        await manager.loadWorkspace(project);
        (WorkspaceStorageService.save as any).mockClear();

        await manager.saveCurrentWorkspace();
        await manager.saveCurrentWorkspace();
        await vi.advanceTimersByTimeAsync(999);
        expect(WorkspaceStorageService.save).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(1);
        expect(WorkspaceStorageService.save).toHaveBeenCalledTimes(1);
    });

    it("returns cancel when saving without a current workspace", async () => {
        const manager = new WorkspaceManager();

        const result = await manager.saveCurrentWorkspace(false);

        expect(result.status).toBe(Result.Status.Cancel);
        expect(WorkspaceStorageService.save).not.toHaveBeenCalled();
    });

    it("unloads the current workspace, clears pending saves, and emits unload", async () => {
        const manager = new WorkspaceManager();
        const editorFacade = createEditorFacade();
        const project = createProject();
        const unloaded = vi.fn();
        manager.setEditorContext(editorFacade);
        manager.on("onWorkspaceUnloaded", unloaded);
        await manager.loadWorkspace(project);
        const workspace = manager.currentWorkspace!;
        const destroy = vi.spyOn(workspace, "destroy");
        (WorkspaceStorageService.save as any).mockClear();

        await manager.saveCurrentWorkspace();
        await manager.unloadWorkspace();
        await vi.advanceTimersByTimeAsync(1000);

        expect(destroy).toHaveBeenCalledTimes(1);
        expect(editorFacade.toolManager.off).toHaveBeenCalledWith("onToolChanged", expect.any(Function));
        expect(manager.currentWorkspace).toBeNull();
        expect(unloaded).toHaveBeenCalledTimes(1);
        expect(WorkspaceStorageService.save).not.toHaveBeenCalled();
    });

    it("does nothing when unloading without a current workspace", async () => {
        const manager = new WorkspaceManager();
        const unloaded = vi.fn();
        manager.on("onWorkspaceUnloaded", unloaded);

        await manager.unloadWorkspace();

        expect(unloaded).not.toHaveBeenCalled();
    });
});
