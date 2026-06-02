import { beforeEach, describe, expect, it, vi } from "vitest";

const textureMocks = vi.hoisted(() => {
    class Rectangle {
        constructor(
            public x: number,
            public y: number,
            public width: number,
            public height: number,
        ) {}
    }

    class Texture {
        public source: { width: number; height: number };
        public frame?: Rectangle;
        public width: number;
        public height: number;
        public destroy = vi.fn();

        constructor(options: any = {}) {
            this.source = options.source ?? { width: options.width ?? 32, height: options.height ?? 32 };
            this.frame = options.frame;
            this.width = options.frame?.width ?? options.width ?? this.source.width;
            this.height = options.frame?.height ?? options.height ?? this.source.height;
        }
    }

    return {
        Texture,
        Rectangle,
        Assets: {
            load: vi.fn(),
        },
        fs: {
            exists: vi.fn(),
            readFile: vi.fn(),
        },
        textureUtils: {
            processTexture: vi.fn(),
        },
        console: {
            error: vi.fn(),
        },
    };
});

vi.mock("pixi.js", () => ({
    Assets: textureMocks.Assets,
    Rectangle: textureMocks.Rectangle,
    Texture: textureMocks.Texture,
}));
vi.mock("@tauri-apps/plugin-fs", () => textureMocks.fs);
vi.mock("@/shared/utils/texture.utils", () => ({ TextureUtils: textureMocks.textureUtils }));
vi.mock("@/shared/services/console.service", () => ({ Console: textureMocks.console }));

import { SingleImageTileset } from "@/editor/model/tileset/single-image-tileset";
import { EditorObjectRegistry } from "@/editor/registry/editor-object.registry";
import { TextureManager } from "@/graphics/texture/texture.manager";
import { FilePathSystem, ProjectPathSystem } from "@/infrastructure/project-path-system";
import { Result } from "@/shared/types/result";

const createTileset = (id = "terrain") => {
    const projectPathSystem = new ProjectPathSystem("C:/Project/Metk/texture-project");
    const tilesetPathSystem = new FilePathSystem(id, projectPathSystem, `tilesets/${id}.json`);
    return new SingleImageTileset(
        {
            id,
            name: `${id} tiles`,
            columns: 2,
            rows: 1,
            tileWidth: 16,
            tileHeight: 16,
            image: { source: `../textures/${id}.png`, width: 32, height: 16 },
            tiles: [],
        },
        tilesetPathSystem,
        new EditorObjectRegistry(),
    );
};

const createBaseTexture = (width = 32, height = 16) => new textureMocks.Texture({ width, height, source: { width, height } });

describe("TextureManager", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        textureMocks.fs.exists.mockResolvedValue(true);
        textureMocks.fs.readFile.mockResolvedValue(new Uint8Array([1, 2, 3]));
        textureMocks.textureUtils.processTexture.mockResolvedValue(createBaseTexture());
        textureMocks.Assets.load.mockResolvedValue(createBaseTexture(8, 8));
    });

    it("loads and slices tileset graphics when retained for the first time", async () => {
        const manager = new TextureManager();
        const tileset = createTileset();
        const reloaded = vi.fn();
        manager.on("onTextureReloaded", reloaded);

        const result = await manager.retainTilesetGraphics(tileset);

        expect(result.status).toBe(Result.Status.Success);
        expect(textureMocks.fs.exists).toHaveBeenCalledWith("C:/Project/Metk/texture-project/textures/terrain.png");
        expect(textureMocks.fs.readFile).toHaveBeenCalledWith("C:/Project/Metk/texture-project/textures/terrain.png");
        expect(textureMocks.textureUtils.processTexture).toHaveBeenCalledWith(new Uint8Array([1, 2, 3]));
        expect(manager.getTileTexture("terrain", 0)).toMatchObject({ width: 16, height: 16 });
        expect(manager.getTileTexture("terrain", 1)).toMatchObject({ width: 16, height: 16 });
        expect(reloaded).toHaveBeenCalledWith("terrain");
    });

    it("avoids duplicate texture allocations for retained and pending loads of the same tileset", async () => {
        const manager = new TextureManager();
        const tileset = createTileset();
        let resolveTexture!: (texture: unknown) => void;
        textureMocks.textureUtils.processTexture.mockReturnValue(new Promise((resolve) => {
            resolveTexture = resolve;
        }));

        const firstRetain = manager.retainTilesetGraphics(tileset);
        const secondRetain = manager.retainTilesetGraphics(tileset);
        resolveTexture(createBaseTexture());

        await expect(firstRetain).resolves.toMatchObject({ status: Result.Status.Success });
        await expect(secondRetain).resolves.toMatchObject({ status: Result.Status.Success });
        expect(textureMocks.fs.readFile).toHaveBeenCalledTimes(1);
        expect(textureMocks.textureUtils.processTexture).toHaveBeenCalledTimes(1);

        await manager.retainTilesetGraphics(tileset);

        expect(textureMocks.fs.readFile).toHaveBeenCalledTimes(1);
        expect(manager.getTileTexture("terrain", 0)).toBeTruthy();
    });

    it("keeps graphics alive while references remain and destroys them after the final release", async () => {
        const manager = new TextureManager();
        const tileset = createTileset();
        await manager.retainTilesetGraphics(tileset);
        await manager.retainTilesetGraphics(tileset);

        const tileTexture = manager.getTileTexture("terrain", 0) as any;
        const baseTexture = (manager as any).baseTexturesCache.get("terrain");

        manager.releaseTilesetGraphics("terrain");
        expect(manager.getTileTexture("terrain", 0)).toBe(tileTexture);
        expect(tileTexture.destroy).not.toHaveBeenCalled();

        manager.releaseTilesetGraphics("terrain");
        expect(manager.getTileTexture("terrain", 0)).toBeNull();
        expect(tileTexture.destroy).toHaveBeenCalledTimes(1);
        expect(baseTexture.destroy).toHaveBeenCalledWith(true);
    });

    it("force unloads cached graphics and emits even when callers still hold references", async () => {
        const manager = new TextureManager();
        const tileset = createTileset();
        const reloaded = vi.fn();
        manager.on("onTextureReloaded", reloaded);
        await manager.retainTilesetGraphics(tileset);

        const tileTexture = manager.getTileTexture("terrain", 1) as any;
        manager.forceUnloadTexture("terrain");

        expect(manager.getTileTexture("terrain", 1)).toBeNull();
        expect(tileTexture.destroy).toHaveBeenCalledTimes(1);
        expect(reloaded).toHaveBeenLastCalledWith("terrain");
    });

    it("reports missing texture resources without exposing partially loaded tile textures", async () => {
        const manager = new TextureManager();
        const tileset = createTileset();
        textureMocks.fs.exists.mockResolvedValue(false);

        const result = await manager.retainTilesetGraphics(tileset);

        expect(result.status).toBe(Result.Status.Error);
        expect(manager.getTileTexture("terrain", 0)).toBeNull();
        expect(textureMocks.console.error).toHaveBeenCalledWith(
            expect.objectContaining({
                message: { key: "message.texture.missing", options: { name: "terrain tiles" } },
            }),
            "loadTextureFail:terrain",
        );
    });

    it("updates a retained tileset texture and replaces old sliced textures", async () => {
        const manager = new TextureManager();
        const tileset = createTileset();
        await manager.retainTilesetGraphics(tileset);
        const oldTexture = manager.getTileTexture("terrain", 0) as any;

        manager.updateTilesetTexture(tileset, createBaseTexture(48, 16) as any);

        expect(oldTexture.destroy).toHaveBeenCalledTimes(1);
        expect(manager.getTileTexture("terrain", 1)).toMatchObject({ width: 16, height: 16 });
        expect(manager.getTileTexture("terrain", 2)).toBeNull();
        expect(tileset.columns).toBe(2);
    });

    it("caches the error texture loaded through Pixi Assets", async () => {
        const manager = new TextureManager();

        const first = await manager.getErrorTexture();
        const second = await manager.getErrorTexture();

        expect(first).toBe(second);
        expect(textureMocks.Assets.load).toHaveBeenCalledTimes(1);
    });
});
