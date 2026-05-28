import { beforeEach, describe, expect, it, vi } from "vitest";

const serviceMocks = vi.hoisted(() => ({
    uuid: vi.fn(() => "generated-id"),
    readFile: vi.fn(),
    appKernel: {
        projectManager: {
            setAndLoadProject: vi.fn(),
            unLoadProject: vi.fn(),
            addProjectMetadata: vi.fn(),
            removeProjectMetadata: vi.fn(),
            saveCurrrentProject: vi.fn(),
        },
        saveProjectManager: vi.fn(),
        layoutManager: {
            loadLayout: vi.fn(),
            unloadLayout: vi.fn(),
        },
        workspaceManager: {
            currentWorkspace: null as any,
            loadProjectWorkspace: vi.fn(),
            unloadWorkspace: vi.fn(),
            saveCurrentWorkspace: vi.fn(),
        },
        editorFacade: {
            currentProject: null as any,
            currentWorkspace: null as any,
            projectManager: {
                saveCurrrentProject: vi.fn(),
            },
            textureManager: {
                getTileTexture: vi.fn(),
                updateTilesetTexture: vi.fn(),
                forceUnloadTexture: vi.fn(),
            },
        },
        textureManager: {
            forceUnloadTexture: vi.fn(),
            updateTilesetTexture: vi.fn(),
        },
    },
    fileDialogs: {
        open: vi.fn(),
        saveFile: vi.fn(),
    },
    storage: {
        ProjectStorageService: {
            load: vi.fn(),
            save: vi.fn(),
        },
        TilemapStorageService: {
            load: vi.fn(),
            save: vi.fn(),
        },
        TilesetStorageService: {
            load: vi.fn(),
            save: vi.fn(),
        },
        RulesetStorageService: {
            load: vi.fn(),
            save: vi.fn(),
        },
        TauriFileStorage: {
            mkdir: vi.fn(),
        },
    },
    textureUtils: {
        processImage: vi.fn(),
        processTexture: vi.fn(),
    },
    console: {
        error: vi.fn(),
        success: vi.fn(),
        warn: vi.fn(),
    },
}));

vi.mock("uuid", () => ({ v4: serviceMocks.uuid }));
vi.mock("@tauri-apps/plugin-fs", () => ({ readFile: serviceMocks.readFile }));
vi.mock("@/application/bootstrap/app-kernel", () => ({ appKernel: serviceMocks.appKernel }));
vi.mock("@/shared/utils/file-dialog.utils", () => ({ FileDialogUtils: serviceMocks.fileDialogs }));
vi.mock("@/infrastructure/container", () => serviceMocks.storage);
vi.mock("@/shared/utils/texture.utils", () => ({ TextureUtils: serviceMocks.textureUtils }));
vi.mock("@/shared/services/console.service", () => ({ Console: serviceMocks.console }));
vi.mock("react-i18next", () => ({
    initReactI18next: {
        type: "3rdParty",
        init: vi.fn(),
    },
    useTranslation: () => ({ t: (key: string) => key }),
}));

import { Result } from "@/shared/types/result";
import { DialogService } from "@/shared/services/dialog.service";
import { ProjectService } from "@/shared/services/project.service";
import { RulesetService } from "@/shared/services/ruleset.service";
import { TextureService } from "@/shared/services/texture.service";
import { TilemapService } from "@/shared/services/tilemap.service";
import { TilesetService } from "@/shared/services/tileset.service";
import { WorkspaceService } from "@/shared/services/workspace.service";
import { useNavigationStore } from "@/ui/stores/navigation.store";

const resetNavigationStore = () => {
    useNavigationStore.setState({ navigate: null });
};

const createSavedPathManager = () => ({
    getTilemapDir: vi.fn(() => "C:/project/tilemaps"),
    setTilemapDir: vi.fn(),
    getTilesetDir: vi.fn(() => "C:/project/tilesets"),
    setTilesetDir: vi.fn(),
    getRulesetDir: vi.fn(() => "C:/project/rulesets"),
    setRulesetDir: vi.fn(),
    getTextureDir: vi.fn(() => "C:/project/textures"),
    setTextureDir: vi.fn(),
});

const createWorkspace = () => ({
    savedPathManager: createSavedPathManager(),
    tilesetSessionManager: {
        tilesetSessionManagerData: { currentTilesetSessionId: null as string | null },
        createTilesetSession: vi.fn(),
        openTilesetSession: vi.fn(),
        closeTilesetSession: vi.fn(),
        getSession: vi.fn(),
        getLastTilesetSessionId: vi.fn(),
        getSessionByTilesetId: vi.fn(),
    },
    tilemapSessionManager: {
        createTilemapSession: vi.fn(),
        openTilemapSession: vi.fn(),
        closeTilemapSession: vi.fn(),
        getSession: vi.fn(),
        getSessionByTilemapId: vi.fn(),
    },
    rulesetSessionManager: {
        setSelectedRuleId: vi.fn(),
        getSelectedRuleId: vi.fn(),
    },
});

const createProject = () => ({
    id: "project-a",
    metaData: { id: "project-a", name: "Project A" },
    serialize: vi.fn(() => ({ id: "project-a", name: "Project A" })),
    projectPathSystem: {
        getAbsPathFromRelPath: vi.fn((path: string) => `C:/project/${path}`),
    },
    tilemapManager: {
        addTilemap: vi.fn(),
        loadTilemap: vi.fn().mockResolvedValue(Result.Success({ id: "generated-id" })),
        removeTilemapMetadata: vi.fn(),
        deleteTilemap: vi.fn(),
        saveTilemap: vi.fn(),
        removeTilesetRef: vi.fn(),
        removeRulesetRef: vi.fn(),
    },
    tilesetManager: {
        addTileset: vi.fn(),
        loadTileset: vi.fn().mockResolvedValue(Result.Success({ id: "generated-id" })),
        removeTileset: vi.fn(),
        deleteTileset: vi.fn(),
        getTilesetById: vi.fn(),
        saveTileset: vi.fn(),
    },
    rulesetManager: {
        addRuleset: vi.fn(),
        loadRuleset: vi.fn().mockResolvedValue(Result.Success({ id: "generated-id" })),
        removeRuleset: vi.fn(),
        deleteRuleset: vi.fn(),
        removeRulesetRef: vi.fn(),
        removeTilesetRef: vi.fn(),
    },
});

const attachProjectAndWorkspace = () => {
    const project = createProject();
    const workspace = createWorkspace();
    serviceMocks.appKernel.editorFacade.currentProject = project;
    serviceMocks.appKernel.editorFacade.currentWorkspace = workspace;
    serviceMocks.appKernel.workspaceManager.currentWorkspace = workspace;
    return { project, workspace };
};

beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    resetNavigationStore();
    serviceMocks.uuid.mockReturnValue("generated-id");
    serviceMocks.appKernel.editorFacade.currentProject = null;
    serviceMocks.appKernel.editorFacade.currentWorkspace = null;
    serviceMocks.appKernel.workspaceManager.currentWorkspace = null;
    serviceMocks.appKernel.projectManager.setAndLoadProject.mockResolvedValue(Result.Success(createProject()));
    serviceMocks.appKernel.layoutManager.loadLayout.mockResolvedValue(Result.Success());
    serviceMocks.appKernel.workspaceManager.loadProjectWorkspace.mockResolvedValue(Result.Success(createWorkspace()));
    serviceMocks.appKernel.workspaceManager.saveCurrentWorkspace.mockResolvedValue(undefined);
    serviceMocks.appKernel.saveProjectManager.mockResolvedValue(undefined);
    serviceMocks.appKernel.editorFacade.projectManager.saveCurrrentProject.mockResolvedValue(undefined);
    serviceMocks.appKernel.projectManager.saveCurrrentProject.mockResolvedValue(undefined);
    serviceMocks.fileDialogs.open.mockResolvedValue(null);
    serviceMocks.fileDialogs.saveFile.mockResolvedValue(null);
    serviceMocks.storage.ProjectStorageService.load.mockResolvedValue(Result.Success({ id: "project-a", name: "Project A" }));
    serviceMocks.storage.ProjectStorageService.save.mockResolvedValue(Result.Success());
    serviceMocks.storage.TilemapStorageService.load.mockResolvedValue(Result.Success());
    serviceMocks.storage.TilemapStorageService.save.mockResolvedValue(Result.Success());
    serviceMocks.storage.TilesetStorageService.load.mockResolvedValue(Result.Success());
    serviceMocks.storage.TilesetStorageService.save.mockResolvedValue(Result.Success());
    serviceMocks.storage.RulesetStorageService.load.mockResolvedValue(Result.Success());
    serviceMocks.storage.RulesetStorageService.save.mockResolvedValue(Result.Success());
    serviceMocks.storage.TauriFileStorage.mkdir.mockResolvedValue(Result.Success());
    serviceMocks.readFile.mockResolvedValue(new Uint8Array([1, 2, 3]));
    serviceMocks.textureUtils.processImage.mockResolvedValue({ width: 64, height: 32 });
    serviceMocks.textureUtils.processTexture.mockResolvedValue({ width: 32, height: 32 });
});

describe("WorkspaceService orchestration", () => {
    it("loads project, layout, workspace, reopens the persisted tileset tab, and persists workspace state", async () => {
        const workspace = createWorkspace();
        workspace.tilesetSessionManager.tilesetSessionManagerData.currentTilesetSessionId = "session-tileset";
        serviceMocks.appKernel.workspaceManager.loadProjectWorkspace.mockImplementation(async () => {
            serviceMocks.appKernel.workspaceManager.currentWorkspace = workspace;
            return Result.Success(workspace);
        });

        const result = await WorkspaceService.loadProjectWorkspace("project-a");

        expect(result.status).toBe(Result.Status.Success);
        expect(serviceMocks.appKernel.projectManager.setAndLoadProject).toHaveBeenCalledWith("project-a");
        expect(serviceMocks.appKernel.layoutManager.loadLayout).toHaveBeenCalledWith(expect.objectContaining({ id: "project-a" }));
        expect(workspace.tilesetSessionManager.openTilesetSession).toHaveBeenCalledWith("session-tileset");
        expect(serviceMocks.appKernel.workspaceManager.saveCurrentWorkspace).toHaveBeenCalledWith(false);
    });

    it("returns an error result and does not load layout when project loading fails", async () => {
        serviceMocks.appKernel.projectManager.setAndLoadProject.mockResolvedValue(Result.Error("load-failed"));

        const result = await WorkspaceService.loadProjectWorkspace("missing-project");

        expect(result.status).toBe(Result.Status.Error);
        expect(serviceMocks.appKernel.layoutManager.loadLayout).not.toHaveBeenCalled();
        expect(serviceMocks.console.error).toHaveBeenCalledWith({ message: { key: "load-failed" } });
    });

    it("closes a dirty tilemap session according to the save dialog decision", async () => {
        const { project, workspace } = attachProjectAndWorkspace();
        const tilemapSession = { id: "tilemap-session", isDirty: true, tilemap: { id: "tilemap-a" } };
        workspace.tilemapSessionManager.getSession.mockReturnValue(tilemapSession);
        vi.spyOn(DialogService, "openSaveDialog").mockResolvedValue("save");

        await WorkspaceService.closeTilemapSession("tilemap-session");

        expect(project.tilemapManager.saveTilemap).toHaveBeenCalledWith("tilemap-a");
        expect(workspace.tilemapSessionManager.closeTilemapSession).toHaveBeenCalledWith("tilemap-session");
        expect(serviceMocks.appKernel.workspaceManager.saveCurrentWorkspace).toHaveBeenCalledWith(false);
    });

    it("cancels a dirty tilemap close when the save dialog is cancelled", async () => {
        const { project, workspace } = attachProjectAndWorkspace();
        workspace.tilemapSessionManager.getSession.mockReturnValue({ id: "tilemap-session", isDirty: true, tilemap: { id: "tilemap-a" } });
        vi.spyOn(DialogService, "openSaveDialog").mockResolvedValue("cancel");

        await WorkspaceService.closeTilemapSession("tilemap-session");

        expect(project.tilemapManager.saveTilemap).not.toHaveBeenCalled();
        expect(workspace.tilemapSessionManager.closeTilemapSession).not.toHaveBeenCalled();
    });
});

describe("ProjectService orchestration", () => {
    it("imports project metadata and navigates when the user chooses to open it", async () => {
        const navigate = vi.fn();
        useNavigationStore.getState().setNavigate(navigate);
        serviceMocks.fileDialogs.open.mockResolvedValue("C:/projects/metk/.metk/project.json");
        vi.spyOn(DialogService, "openPermissionDialog").mockResolvedValue(true);

        await ProjectService.importProject();

        expect(serviceMocks.storage.ProjectStorageService.load).toHaveBeenCalledWith("C:/projects/metk/.metk/project.json");
        expect(serviceMocks.appKernel.projectManager.addProjectMetadata).toHaveBeenCalledWith(expect.objectContaining({ id: "project-a" }));
        expect(serviceMocks.appKernel.saveProjectManager).toHaveBeenCalled();
        expect(navigate).toHaveBeenCalledWith("/workspace/project-a");
    });

    it("does not import a project when file selection is cancelled", async () => {
        serviceMocks.fileDialogs.open.mockResolvedValue(null);

        await ProjectService.importProject();

        expect(serviceMocks.storage.ProjectStorageService.load).not.toHaveBeenCalled();
        expect(serviceMocks.appKernel.projectManager.addProjectMetadata).not.toHaveBeenCalled();
    });

    it("creates the project directories, saves project data, and leaves navigation unchanged when open is declined", async () => {
        const navigate = vi.fn();
        useNavigationStore.getState().setNavigate(navigate);
        vi.spyOn(DialogService, "openFormDialog").mockResolvedValue({ name: "New Project", destination: "C:/projects" } as any);
        vi.spyOn(DialogService, "openPermissionDialog").mockResolvedValue(false);

        await ProjectService.createProject();

        expect(serviceMocks.storage.TauriFileStorage.mkdir).toHaveBeenNthCalledWith(1, "C:/projects/New Project");
        expect(serviceMocks.storage.TauriFileStorage.mkdir).toHaveBeenNthCalledWith(2, "C:/projects/New Project/.metk");
        expect(serviceMocks.storage.ProjectStorageService.save).toHaveBeenCalledWith(
            "C:/projects/New Project/.metk/project.json",
            expect.objectContaining({ name: "New Project" }),
        );
        expect(serviceMocks.appKernel.projectManager.addProjectMetadata).toHaveBeenCalled();
        expect(navigate).not.toHaveBeenCalled();
    });

    it("removes project metadata only after confirmation", async () => {
        vi.spyOn(DialogService, "openPermissionDialog").mockResolvedValueOnce(false);

        await ProjectService.removeProject("project-a");

        expect(serviceMocks.appKernel.projectManager.removeProjectMetadata).not.toHaveBeenCalled();

        vi.mocked(DialogService.openPermissionDialog).mockResolvedValueOnce(true);
        await ProjectService.removeProject("project-a");

        expect(serviceMocks.appKernel.projectManager.removeProjectMetadata).toHaveBeenCalledWith("project-a");
        expect(serviceMocks.appKernel.saveProjectManager).toHaveBeenCalled();
    });
});

describe("TilemapService orchestration", () => {
    it("creates a tilemap, updates saved paths, persists metadata, and opens a session", async () => {
        const { project, workspace } = attachProjectAndWorkspace();
        vi.spyOn(DialogService, "openFormDialog").mockResolvedValue({
            tilemap: { name: "Overworld", type: "orthogonal" },
            options: {
                map: { mapwidth: 20, mapheight: 10 },
                tile: { tilewidth: 16, tileheight: 16 },
            },
        } as any);
        serviceMocks.fileDialogs.saveFile.mockResolvedValue("C:/project/tilemaps/overworld.tm.json");

        await TilemapService.createTilemap();

        expect(workspace.savedPathManager.setTilemapDir).toHaveBeenCalledWith("C:/project/tilemaps");
        expect(serviceMocks.storage.TilemapStorageService.save).toHaveBeenCalledWith(
            "C:/project/tilemaps/overworld.tm.json",
            expect.objectContaining({ id: "generated-id", name: "Overworld", width: 20, height: 10 }),
        );
        expect(project.tilemapManager.addTilemap).toHaveBeenCalledWith(expect.objectContaining({ id: "generated-id" }), "C:/project/tilemaps/overworld.tm.json");
        expect(serviceMocks.appKernel.editorFacade.projectManager.saveCurrrentProject).toHaveBeenCalled();
        expect(project.tilemapManager.loadTilemap).toHaveBeenCalledWith("generated-id");
        expect(workspace.tilemapSessionManager.createTilemapSession).toHaveBeenCalledWith({ id: "generated-id" });
    });

    it("imports a tilemap and returns cancellation on id mismatch without adding metadata", async () => {
        const { project } = attachProjectAndWorkspace();
        serviceMocks.fileDialogs.open.mockResolvedValue("C:/project/tilemaps/imported.tm.json");
        serviceMocks.storage.TilemapStorageService.load.mockResolvedValue(Result.Success({ id: "other-id", name: "Imported" }));

        const result = await TilemapService.importTilemap("expected-id");

        expect(result.status).toBe(Result.Status.Cancel);
        expect(project.tilemapManager.addTilemap).not.toHaveBeenCalled();
        expect(serviceMocks.console.error).toHaveBeenCalledWith(expect.objectContaining({ message: "message.tilemap.importFail" }));
    });

    it("removes a tilemap, closes its open session, and returns the manager result", async () => {
        const { project, workspace } = attachProjectAndWorkspace();
        vi.spyOn(DialogService, "openPermissionDialog").mockResolvedValue(true);
        project.tilemapManager.removeTilemapMetadata.mockResolvedValue(Result.Success({ removed: true }));
        workspace.tilemapSessionManager.getSessionByTilemapId.mockReturnValue({ id: "tilemap-session" });
        workspace.tilemapSessionManager.getSession.mockReturnValue({ id: "tilemap-session", isDirty: false, tilemap: { id: "tilemap-a" } });

        const result = await TilemapService.removeTilemap("tilemap-a");

        expect(result.status).toBe(Result.Status.Success);
        expect(project.tilemapManager.removeTilemapMetadata).toHaveBeenCalledWith("tilemap-a");
        expect(workspace.tilemapSessionManager.closeTilemapSession).toHaveBeenCalledWith("tilemap-session");
        expect(serviceMocks.appKernel.workspaceManager.saveCurrentWorkspace).toHaveBeenCalledWith(false);
    });
});

describe("TilesetService orchestration", () => {
    it("creates a tileset from an image without re-testing graphics processing", async () => {
        const { project, workspace } = attachProjectAndWorkspace();
        vi.spyOn(DialogService, "openFormDialog").mockResolvedValue({
            tileset: { name: "Terrain", type: "single-image" },
            image: {
                source: ["C:/project/textures/terrain.png"],
                setting: { tile: { tilewidth: 16, tileheight: 16 } },
            },
        } as any);
        serviceMocks.fileDialogs.saveFile.mockResolvedValue("C:/project/tilesets/terrain.ts.json");
        serviceMocks.textureUtils.processImage.mockResolvedValue({ width: 64, height: 32 });

        await TilesetService.createTileset();

        expect(serviceMocks.readFile).toHaveBeenCalledWith("C:/project/textures/terrain.png");
        expect(serviceMocks.textureUtils.processImage).toHaveBeenCalledWith(new Uint8Array([1, 2, 3]));
        expect(serviceMocks.storage.TilesetStorageService.save).toHaveBeenCalledWith(
            "C:/project/tilesets/terrain.ts.json",
            expect.objectContaining({
                id: "generated-id",
                name: "Terrain",
                columns: 4,
                rows: 2,
                image: expect.objectContaining({ source: "../textures/terrain.png" }),
            }),
        );
        expect(project.tilesetManager.addTileset).toHaveBeenCalled();
        expect(project.tilesetManager.loadTileset).toHaveBeenCalledWith("generated-id");
        expect(workspace.tilesetSessionManager.createTilesetSession).toHaveBeenCalledWith({ id: "generated-id" });
    });

    it("removes a tileset, prunes references, unloads texture, and closes its session", async () => {
        const { project, workspace } = attachProjectAndWorkspace();
        vi.spyOn(DialogService, "openPermissionDialog").mockResolvedValue(true);
        project.tilesetManager.removeTileset.mockResolvedValue(Result.Success({ removed: true }));
        workspace.tilesetSessionManager.getSessionByTilesetId.mockReturnValue({ id: "tileset-session" });
        workspace.tilesetSessionManager.getSession.mockReturnValue({ id: "tileset-session", isDirty: false, tileset: { id: "tileset-a" } });

        const result = await TilesetService.removeTileset("tileset-a");

        expect(result.status).toBe(Result.Status.Success);
        expect(project.tilemapManager.removeTilesetRef).toHaveBeenCalledWith("tileset-a");
        expect(project.rulesetManager.removeTilesetRef).toHaveBeenCalledWith("tileset-a");
        expect(serviceMocks.appKernel.textureManager.forceUnloadTexture).toHaveBeenCalledWith("tileset-a");
        expect(workspace.tilesetSessionManager.closeTilesetSession).toHaveBeenCalledWith("tileset-session");
    });
});

describe("RulesetService orchestration", () => {
    it("creates a ruleset and persists project plus workspace state", async () => {
        const { project, workspace } = attachProjectAndWorkspace();
        vi.spyOn(DialogService, "openFormDialog").mockResolvedValue({ name: "Terrain Rules", color: "#22cc88" } as any);
        serviceMocks.fileDialogs.saveFile.mockResolvedValue("C:/project/rulesets/terrain.rs.json");

        await RulesetService.createRuleset();

        expect(workspace.savedPathManager.setRulesetDir).toHaveBeenCalledWith("C:/project/rulesets");
        expect(serviceMocks.storage.RulesetStorageService.save).toHaveBeenCalledWith(
            "C:/project/rulesets/terrain.rs.json",
            expect.objectContaining({ id: "generated-id", name: "Terrain Rules", color: "#22cc88", size: 5 }),
        );
        expect(project.rulesetManager.addRuleset).toHaveBeenCalled();
        expect(serviceMocks.appKernel.editorFacade.projectManager.saveCurrrentProject).toHaveBeenCalled();
        expect(serviceMocks.appKernel.workspaceManager.saveCurrentWorkspace).toHaveBeenCalledWith(false);
    });

    it("removes a selected ruleset and clears the workspace selection", async () => {
        const { project, workspace } = attachProjectAndWorkspace();
        vi.spyOn(DialogService, "openPermissionDialog").mockResolvedValue(true);
        project.rulesetManager.removeRuleset.mockResolvedValue(Result.Success({ removed: true }));
        workspace.rulesetSessionManager.getSelectedRuleId.mockReturnValue("ruleset-a");

        const result = await RulesetService.removeRuleset("ruleset-a");

        expect(result.status).toBe(Result.Status.Success);
        expect(project.tilemapManager.removeRulesetRef).toHaveBeenCalledWith("ruleset-a");
        expect(project.rulesetManager.removeRulesetRef).toHaveBeenCalledWith("ruleset-a");
        expect(workspace.rulesetSessionManager.setSelectedRuleId).toHaveBeenCalledWith(null);
    });

    it("returns an error result when importing a ruleset fails to load", async () => {
        attachProjectAndWorkspace();
        serviceMocks.fileDialogs.open.mockResolvedValue("C:/project/rulesets/bad.rs.json");
        serviceMocks.storage.RulesetStorageService.load.mockResolvedValue(Result.Error("bad-json"));

        const result = await RulesetService.importRuleset();

        expect(result.status).toBe(Result.Status.Error);
        expect(serviceMocks.console.error).toHaveBeenCalledWith(expect.objectContaining({ message: "message.ruleset.importFail" }));
    });
});

describe("TextureService orchestration", () => {
    it("imports a matching-size texture and updates the tileset texture path", async () => {
        const { project, workspace } = attachProjectAndWorkspace();
        const tileset = {
            id: "tileset-a",
            imageSource: { width: 32, height: 32 },
            tilesetPathSystem: { getFileAbsDir: vi.fn(() => "C:/project/tilesets") },
            updateImageSource: vi.fn(),
        };
        project.tilesetManager.getTilesetById.mockReturnValue(tileset);
        serviceMocks.fileDialogs.open.mockResolvedValue("C:/project/textures/replacement.png");
        serviceMocks.textureUtils.processTexture.mockResolvedValue({ width: 32, height: 32 });
        vi.spyOn(DialogService, "openPermissionDialog").mockResolvedValue(false);

        const result = await TextureService.importTexture("tileset-a");

        expect(result.status).toBe(Result.Status.Success);
        expect(workspace.savedPathManager.setTextureDir).toHaveBeenCalledWith("C:/project/textures");
        expect(tileset.updateImageSource).toHaveBeenCalledWith({
            source: "../textures/replacement.png",
            width: 32,
            height: 32,
        });
        expect(project.tilesetManager.saveTileset).toHaveBeenCalledWith("tileset-a");
        expect(serviceMocks.appKernel.textureManager.updateTilesetTexture).toHaveBeenCalledWith(tileset, { width: 32, height: 32 });
        expect(DialogService.openPermissionDialog).not.toHaveBeenCalled();
    });

    it("asks before accepting a mismatched texture size and cancels when declined", async () => {
        const { project } = attachProjectAndWorkspace();
        const tileset = {
            id: "tileset-a",
            imageSource: { width: 32, height: 32 },
            tilesetPathSystem: { getFileAbsDir: vi.fn(() => "C:/project/tilesets") },
            updateImageSource: vi.fn(),
        };
        project.tilesetManager.getTilesetById.mockReturnValue(tileset);
        serviceMocks.fileDialogs.open.mockResolvedValue("C:/project/textures/large.png");
        serviceMocks.textureUtils.processTexture.mockResolvedValue({ width: 64, height: 64 });
        vi.spyOn(DialogService, "openPermissionDialog").mockResolvedValue(false);

        const result = await TextureService.importTexture("tileset-a");

        expect(result.status).toBe(Result.Status.Cancel);
        expect(DialogService.openPermissionDialog).toHaveBeenCalledWith({
            title: "dialog.import.textureMismatchSize.title",
            description: "dialog.import.textureMismatchSize.description",
        });
        expect(tileset.updateImageSource).not.toHaveBeenCalled();
        expect(project.tilesetManager.saveTileset).not.toHaveBeenCalled();
    });

    it("returns an error result when texture processing fails", async () => {
        attachProjectAndWorkspace();
        serviceMocks.fileDialogs.open.mockResolvedValue("C:/project/textures/bad.png");
        serviceMocks.textureUtils.processTexture.mockRejectedValue(new Error("decode failed"));

        const result = await TextureService.importTexture("tileset-a");

        expect(result.status).toBe(Result.Status.Error);
        expect(result.message).toEqual({ key: "message.texture.importFail" });
    });
});
