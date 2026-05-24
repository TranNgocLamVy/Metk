import { beforeEach, describe, expect, it, vi } from "vitest";

const storageState = vi.hoisted(() => ({
    ProjectStorageService: {
        load: vi.fn(),
        save: vi.fn(),
    },
    RulesetStorageService: {
        load: vi.fn(),
        save: vi.fn(),
        remove: vi.fn(),
    },
}));

vi.mock("@/infrastructure/container", () => storageState);
vi.mock("@/shared/services/console.service", () => ({
    Console: {
        log: vi.fn(),
        success: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

import { ProjectManager } from "@/application/resources/project/project.manager";
import { ProjectStorageService, RulesetStorageService } from "@/infrastructure/container";
import { Result } from "@/shared/types/result";

import {
    createProjectData,
    createProjectMetadata,
    createRulesetData,
    createRulesetMetadata,
    createTilemapMetadata,
    createTilesetMetadata,
} from "../resource-manager-test-utils";

describe("ProjectManager", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (ProjectStorageService.load as any).mockResolvedValue(Result.Success(createProjectData("project-a")));
        (ProjectStorageService.save as any).mockResolvedValue(Result.Success());
        (RulesetStorageService.load as any).mockResolvedValue(Result.Success(createRulesetData("ruleset-a")));
        (RulesetStorageService.save as any).mockResolvedValue(Result.Success());
        (RulesetStorageService.remove as any).mockResolvedValue(Result.Success());
    });

    it("loads project repository metadata and emits serialized metadata", () => {
        const manager = new ProjectManager();
        const changed = vi.fn();
        manager.on("onProjectMetadatasChanged", changed);
        const metadata = [
            createProjectMetadata("project-a"),
            createProjectMetadata("project-b", { name: "Project B" }),
        ];

        manager.load(metadata);

        expect(manager.serialize()).toEqual(metadata);
        expect(changed).toHaveBeenCalledWith(metadata);
    });

    it("loads a project from storage, initializes child manager metadata, and emits project loaded", async () => {
        const manager = new ProjectManager();
        const loaded = vi.fn();
        const projectData = createProjectData("project-a", {
            name: "Loaded Project",
            tilemaps: [createTilemapMetadata("tilemap-a")],
            tilesets: [createTilesetMetadata("tileset-a")],
            rulesets: [],
        });
        manager.on("onProjectLoaded", loaded);
        manager.load([createProjectMetadata("project-a", { directory: "C:/Project/Metk/project-a" })]);
        (ProjectStorageService.load as any).mockResolvedValue(Result.Success(projectData));

        const result = await manager.setAndLoadProject("project-a");

        expect(result.status).toBe(Result.Status.Success);
        expect(manager.currentProject).toBe(result.data);
        expect(ProjectStorageService.load).toHaveBeenCalledWith("C:/Project/Metk/project-a/.metk/project.json");
        expect(manager.currentProject?.tilemapManager.serialize()).toEqual([createTilemapMetadata("tilemap-a")]);
        expect(manager.currentProject?.tilesetManager.serialize()).toEqual([createTilesetMetadata("tileset-a")]);
        expect(loaded).toHaveBeenCalledWith(manager.currentProject);
    });

    it("returns the already loaded project when setting the same project id", async () => {
        const manager = new ProjectManager();
        manager.load([createProjectMetadata("project-a")]);

        const first = await manager.setAndLoadProject("project-a");
        const second = await manager.setAndLoadProject("project-a");

        expect(second.status).toBe(Result.Status.Success);
        expect(second.data).toBe(first.data);
        expect(ProjectStorageService.load).toHaveBeenCalledTimes(1);
    });

    it("unloads the current project before loading a different project", async () => {
        const manager = new ProjectManager();
        manager.load([
            createProjectMetadata("project-a", { directory: "C:/Project/Metk/project-a" }),
            createProjectMetadata("project-b", { directory: "C:/Project/Metk/project-b" }),
        ]);
        (ProjectStorageService.load as any).mockImplementation(async (path: string) => {
            if (path.includes("project-b")) return Result.Success(createProjectData("project-b"));
            return Result.Success(createProjectData("project-a"));
        });
        await manager.setAndLoadProject("project-a");
        const firstProject = manager.currentProject!;
        const destroy = vi.spyOn(firstProject, "destroy");

        const result = await manager.setAndLoadProject("project-b");

        expect(result.status).toBe(Result.Status.Success);
        expect(destroy).toHaveBeenCalledTimes(1);
        expect(manager.currentProject?.id).toBe("project-b");
    });

    it("returns an error when project metadata is missing", async () => {
        const manager = new ProjectManager();

        const result = await manager.setAndLoadProject("missing-project");

        expect(result).toMatchObject({
            status: Result.Status.Error,
            message: { key: "Project meta data not found" },
        });
        expect(ProjectStorageService.load).not.toHaveBeenCalled();
    });

    it("returns the storage error and leaves current project empty when loading fails", async () => {
        const manager = new ProjectManager();
        manager.load([createProjectMetadata("project-a")]);
        (ProjectStorageService.load as any).mockResolvedValue(Result.Error("storage failed"));

        const result = await manager.setAndLoadProject("project-a");

        expect(result).toMatchObject({
            status: Result.Status.Error,
            message: { key: "storage failed" },
        });
        expect(manager.currentProject).toBeNull();
    });

    it("unloads the current project and emits project unloaded", async () => {
        const manager = new ProjectManager();
        const unloaded = vi.fn();
        manager.on("onProjectUnloaded", unloaded);
        manager.load([createProjectMetadata("project-a")]);
        await manager.setAndLoadProject("project-a");
        const project = manager.currentProject!;
        const destroy = vi.spyOn(project, "destroy");

        await manager.unLoadProject();

        expect(destroy).toHaveBeenCalledTimes(1);
        expect(manager.currentProject).toBeNull();
        expect(unloaded).toHaveBeenCalledWith("project-a");
    });

    it("does nothing when unloading without a current project", async () => {
        const manager = new ProjectManager();
        const unloaded = vi.fn();
        manager.on("onProjectUnloaded", unloaded);

        await manager.unLoadProject();

        expect(unloaded).not.toHaveBeenCalled();
    });

    it("saves the current project and returns cancel when no project is loaded", async () => {
        const manager = new ProjectManager();
        manager.load([createProjectMetadata("project-a", { directory: "C:/Project/Metk/project-a" })]);

        expect((await manager.saveCurrrentProject()).status).toBe(Result.Status.Cancel);

        await manager.setAndLoadProject("project-a");
        manager.currentProject!.name = "Saved Project";
        const result = await manager.saveCurrrentProject();

        expect(result.status).toBe(Result.Status.Success);
        expect(ProjectStorageService.save).toHaveBeenCalledWith(
            "C:/Project/Metk/project-a/.metk/project.json",
            expect.objectContaining({ id: "project-a", name: "Saved Project" }),
        );
    });

    it("adds and removes metadata with change events", () => {
        const manager = new ProjectManager();
        const changed = vi.fn();
        manager.on("onProjectMetadatasChanged", changed);
        const metadata = createProjectMetadata("project-a");

        manager.addProjectMetadata(metadata);
        expect(manager.serialize()).toEqual([metadata]);
        expect(changed).toHaveBeenLastCalledWith([metadata]);

        manager.removeProjectMetadata("project-a");
        expect(manager.serialize()).toEqual([]);
        expect(changed).toHaveBeenLastCalledWith([]);
    });

    it("serializes loaded project metadata from the current project instead of stale repo metadata", async () => {
        const manager = new ProjectManager();
        manager.load([createProjectMetadata("project-a", {
            name: "Stale Name",
            directory: "C:/Project/Metk/project-a",
        })]);
        (ProjectStorageService.load as any).mockResolvedValue(Result.Success(createProjectData("project-a", {
            name: "Loaded Name",
            rulesets: [createRulesetMetadata("ruleset-a")],
        })));

        await manager.setAndLoadProject("project-a");
        manager.currentProject!.name = "Current Name";

        expect(manager.serialize()).toEqual([expect.objectContaining({
            id: "project-a",
            name: "Current Name",
            directory: "C:/Project/Metk/project-a",
        })]);
    });
});
