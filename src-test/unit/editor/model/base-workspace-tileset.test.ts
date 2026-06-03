import { v4 as uuidv4 } from "uuid";
import { beforeEach, describe, expect, it, vi } from "vitest";

const workspaceModelMocks = vi.hoisted(() => {
    const instances = {
        tilesetSessionManager: null as any,
        tilemapSessionManager: null as any,
        rulesetSessionManager: null as any,
        toolSessionManager: null as any,
        savedPathManager: null as any,
    };

    class MockTilesetSessionManager {
        public loadTilesetSessions = vi.fn();
        public destroy = vi.fn();
        public serialize = vi.fn(() => ({ tilesetSessions: [{ id: "tileset-session" }], currentTilesetSessionId: "tileset-session" }));
        constructor(public data: any, public editorFacade: any) {
            instances.tilesetSessionManager = this;
        }
    }

    class MockTilemapSessionManager {
        public loadTilemapSessions = vi.fn();
        public detroy = vi.fn();
        public serialize = vi.fn(() => ({ tilemapSessions: [{ id: "tilemap-session" }], currentTilemapSessionId: "tilemap-session" }));
        constructor(public data: any, public editorFacade: any) {
            instances.tilemapSessionManager = this;
        }
    }

    class MockRulesetSessionManager {
        public serialize = vi.fn(() => ({ selectedRuleId: "ruleset-a" }));
        constructor(public data: any, public editorFacade: any) {
            instances.rulesetSessionManager = this;
        }
    }

    class MockToolSessionManager {
        public load = vi.fn();
        public destroy = vi.fn();
        public serialize = vi.fn(() => ({ currentToolFamily: "tool.stamp" }));
        constructor(public data: any, public editorFacade: any) {
            instances.toolSessionManager = this;
        }
    }

    class MockWorkspaceSavedPathManager {
        public serialize = vi.fn(() => ({ exportPaths: ["C:/exports"], tilemapDir: "C:/tilemaps" }));
        constructor(public data: any, public projectPathSystem: any) {
            instances.savedPathManager = this;
        }
    }

    return {
        instances,
        MockTilesetSessionManager,
        MockTilemapSessionManager,
        MockRulesetSessionManager,
        MockToolSessionManager,
        MockWorkspaceSavedPathManager,
    };
});

vi.mock("@/application/workspace/session/tileset-session.manager", () => ({ TilesetSessionManager: workspaceModelMocks.MockTilesetSessionManager }));
vi.mock("@/application/workspace/session/tilemap-session.manager", () => ({ TilemapSessionManager: workspaceModelMocks.MockTilemapSessionManager }));
vi.mock("@/application/workspace/session/ruleset-session.manager", () => ({ RulesetSessionManager: workspaceModelMocks.MockRulesetSessionManager }));
vi.mock("@/application/workspace/session/tool-session.manager", () => ({ ToolSessionManager: workspaceModelMocks.MockToolSessionManager }));
vi.mock("@/application/workspace/workspace-saved-path.manager", () => ({ WorkspaceSavedPathManager: workspaceModelMocks.MockWorkspaceSavedPathManager }));

import { BaseObject } from "@/editor/model/base-object";
import { SingleImageTileset } from "@/editor/model/tileset/single-image-tileset";
import { Workspace } from "@/editor/model/workspace/workspace";
import { NumberProperty, StringProperty } from "@/editor/properties/properties.decorator";
import { EditorObjectRegistry } from "@/editor/registry/editor-object.registry";
import { FilePathSystem, ProjectPathSystem } from "@/infrastructure/project-path-system";
import { defaultWorkspaceData } from "@/shared/data-types/workspace.data";
import { Result } from "@/shared/types/result";

class TestBaseObject extends BaseObject {
    @StringProperty<TestBaseObject>({
        label: "Name",
        get: target => target.name,
        set: (target, value) => {
            target.name = value;
        },
    })
    public name = "Initial";

    @NumberProperty<TestBaseObject>({
        label: "Opacity",
        get: target => target.opacity,
        set: (target, value) => {
            target.opacity = value;
        },
    })
    public opacity = 1;
}

const createTilesetPathSystem = (id = "tileset-a") => {
    const projectPathSystem = new ProjectPathSystem("C:/Project/Metk/model-project");
    return new FilePathSystem(id, projectPathSystem, `tilesets/${id}.json`);
};

const createTileset = (overrides: Partial<ConstructorParameters<typeof SingleImageTileset>[0]> = {}) => new SingleImageTileset(
    {
        id: "tileset-a",
        name: "Terrain",
        columns: 2,
        rows: 2,
        tileWidth: 16,
        tileHeight: 16,
        image: { source: "textures/terrain.png", width: 32, height: 32 },
        tiles: [],
        ...overrides,
    },
    createTilesetPathSystem(),
    new EditorObjectRegistry(),
);

describe("BaseObject", () => {
    it("initializes decorated property metadata and exposes runtime properties", () => {
        const model = new TestBaseObject(uuidv4());

        expect(model.properties.get("name")).toMatchObject({ label: "Name" });
        expect(model.properties.get("opacity")).toMatchObject({ label: "Opacity" });
        expect(model.properties.get("name")?.target).toBe(model);
        expect(model.properties.get("opacity")?.target).toBe(model);
    });
});

describe("Workspace model", () => {
    beforeEach(() => {
        workspaceModelMocks.instances.tilesetSessionManager = null;
        workspaceModelMocks.instances.tilemapSessionManager = null;
        workspaceModelMocks.instances.rulesetSessionManager = null;
        workspaceModelMocks.instances.toolSessionManager = null;
        workspaceModelMocks.instances.savedPathManager = null;
    });

    it("constructs session and saved-path managers from workspace data", () => {
        const editorFacade = { id: "editor" };
        const projectPathSystem = new ProjectPathSystem("C:/Project/Metk/workspace-project");
        const workspaceResult = Workspace.createFromFileData(defaultWorkspaceData, {} as any, {} as any, projectPathSystem, editorFacade as any);
        if (workspaceResult.status !== Result.Status.Success) throw new Error(String(workspaceResult.message));
        const workspace = workspaceResult.data;

        expect(workspace.tilesetSessionManager).toBe(workspaceModelMocks.instances.tilesetSessionManager);
        expect(workspace.tilemapSessionManager).toBe(workspaceModelMocks.instances.tilemapSessionManager);
        expect(workspace.rulesetSessionManager).toBe(workspaceModelMocks.instances.rulesetSessionManager);
        expect(workspace.toolSessionManager).toBe(workspaceModelMocks.instances.toolSessionManager);
        expect(workspace.savedPathManager).toBe(workspaceModelMocks.instances.savedPathManager);
        expect(workspaceModelMocks.instances.savedPathManager.projectPathSystem).toBe(projectPathSystem);
    });

    it("loads, destroys, and serializes through its child managers", async () => {
        const tilesetManager = { id: "tileset-manager" };
        const tilemapManager = { id: "tilemap-manager" };
        const workspaceResult = Workspace.createFromFileData(defaultWorkspaceData, tilesetManager as any, tilemapManager as any, new ProjectPathSystem("C:/Project/Metk/workspace-project"), {} as any);
        if (workspaceResult.status !== Result.Status.Success) throw new Error(String(workspaceResult.message));
        const workspace = workspaceResult.data;

        await expect(workspace.loadSession()).resolves.toEqual(Result.Success());

        expect(workspaceModelMocks.instances.tilesetSessionManager.loadTilesetSessions).toHaveBeenCalledWith(tilesetManager);
        expect(workspaceModelMocks.instances.tilemapSessionManager.loadTilemapSessions).toHaveBeenCalledWith(tilemapManager);
        expect(workspaceModelMocks.instances.toolSessionManager.load).toHaveBeenCalledTimes(1);

        expect(workspace.serialize()).toEqual({
            tilesets: { tilesetSessions: [{ id: "tileset-session" }], currentTilesetSessionId: "tileset-session" },
            tilemaps: { tilemapSessions: [{ id: "tilemap-session" }], currentTilemapSessionId: "tilemap-session" },
            ruleset: { selectedRuleId: "ruleset-a" },
            entityCollection: { selectedEntityCollectionId: null, selectedEntityId: null },
            propertyPanel: { selectedObjectId: null },
            toolState: { currentToolFamily: "tool.stamp" },
            savedPath: { exportPaths: ["C:/exports"], tilemapDir: "C:/tilemaps" },
        });

        await workspace.destroy();

        expect(workspaceModelMocks.instances.tilesetSessionManager.destroy).toHaveBeenCalledTimes(1);
        expect(workspaceModelMocks.instances.tilemapSessionManager.detroy).toHaveBeenCalledTimes(1);
        expect(workspaceModelMocks.instances.toolSessionManager.destroy).toHaveBeenCalledTimes(1);
    });
});

describe("Tileset model", () => {
    it("creates default tile objects and resolves ids to coordinates", () => {
        const tileset = createTileset();

        expect(tileset.tiles.map((tile) => tile.id)).toEqual([0, 1, 2, 3]);
        expect(tileset.getTileFromId(2)?.serialize()).toEqual({ id: 2 });
        expect(tileset.getCoordinatesFromTile(3)).toEqual({ row: 1, col: 1 });
        expect(tileset.getCoordinatesFromTile(99)).toBeNull();
        expect(tileset.getTileFromCoordinates(1, 0)?.id).toBe(2);
        expect(tileset.getTileFromCoordinates(9, 9)).toBeNull();
    });

    it("preserves explicit tile ids during construction and serialization", () => {
        const tileset = createTileset({
            columns: 3,
            rows: 1,
            tiles: [{ id: 2 }, { id: 5 }],
        });

        expect(tileset.tiles.map((tile) => tile.id)).toEqual([2, 5]);
        expect(tileset.serialize()).toMatchObject({
            id: "tileset-a",
            name: "Terrain",
            columns: 3,
            rows: 1,
            tiles: [{ id: 2 }, { id: 5 }],
        });
    });

    it("emits property updates when renamed or when the texture path changes", async () => {
        const tileset = createTileset();
        const listener = vi.fn();
        tileset.eventEmitter.on("updateProperty", listener as any);

        await expect(tileset.rename("Terrain Edited")).resolves.toEqual(Result.Success());
        tileset.updateImageSource({ source: "../textures/terrain-v2.png", width: 32, height: 32});

        expect(tileset.name).toBe("Terrain Edited");
        expect(tileset.imageSource.source).toBe("../textures/terrain-v2.png");
        expect(listener).toHaveBeenCalledWith("name", "Terrain Edited", {
            origin: "external",
            source: "Tileset.rename",
        });
        expect(listener).toHaveBeenCalledWith("imageSource", tileset.imageSource, {
            origin: "external",
            source: "SingleImageTileset.updateImageSource",
        });
    });
});
