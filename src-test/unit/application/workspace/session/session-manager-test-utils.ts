import { vi } from "vitest";

import { EditorFacade } from "@/application/editor.facade";
import { Tileset } from "@/editor/model/tileset/tileset";
import { FilePathSystem, ProjectPathSystem } from "@/infrastructure/project-path-system";
import { TilesetData } from "@/shared/schema/tileset.schema";
import { Result } from "@/shared/types/result";

import { createTilemap } from "../../commands/layer/layer-command-test-utils";

export const createTileset = (id = "tileset-a"): Tileset => {
    const projectPathSystem = new ProjectPathSystem("C:/Project/Metk/test-project");
    const filePathSystem = new FilePathSystem(id, projectPathSystem, `tilesets/${id}.json`);
    const data: TilesetData = {
        id,
        name: `${id} name`,
        columns: 2,
        rows: 2,
        tilewidth: 16,
        tileheight: 16,
        image: {
            source: `textures/${id}.png`,
            width: 32,
            height: 32,
        },
        tiles: [],
    };

    return new Tileset(data, filePathSystem);
};

export const createEditorFacadeHarness = () => {
    const tileset = createTileset("tileset-a");
    const tilemap = createTilemap();

    const textureManager = {
        retainTilesetGraphics: vi.fn(async () => undefined),
        releaseTilesetGraphics: vi.fn(),
    };
    const tilesetManager = {
        getTilesetById: vi.fn((id: string) => id === tileset.id ? tileset : null),
        loadTileset: vi.fn(async (id: string) => id === tileset.id ? Result.Success(tileset) : Result.Error("tileset load failed")),
        unloadTileset: vi.fn(async () => undefined),
    };
    const tilemapManager = {
        loadTilemap: vi.fn(async (id: string) => id === tilemap.id ? Result.Success(tilemap) : Result.Error("tilemap load failed")),
        unloadTilemap: vi.fn(async () => undefined),
    };
    const toolManager = {
        startTool: vi.fn(),
        getCurrentToolId: vi.fn(() => null as string | null),
        on: vi.fn(),
        off: vi.fn(),
    };
    const workspaceManager = {
        saveCurrentWorkspace: vi.fn(async () => Result.Success()),
    };
    const editorFacade = {
        textureManager,
        toolManager,
        workspaceManager,
        currentProject: {
            tilesetManager,
            tilemapManager,
        },
    } as unknown as EditorFacade;

    return {
        editorFacade,
        textureManager,
        tilesetManager,
        tilemapManager,
        toolManager,
        workspaceManager,
        tileset,
        tilemap,
    };
};
