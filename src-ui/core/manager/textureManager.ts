import { ImageSource, Rectangle, Texture } from "pixi.js";
import { Result } from "@/shared/types/result";
import { Tileset } from "../application/tile/tileset";
import { exists, readFile } from "@tauri-apps/plugin-fs";

export class TextureManager {
    private tileTexturesCache: Map<string, Map<number, Texture>> = new Map(); // tilesetId -> Map<tileId, Texture>
    private baseTexturesCache: Map<string, Texture> = new Map(); // tilesetId -> Base Texture

    private refCounts: Map<string, number> = new Map();
    private pendingLoads: Map<string, Promise<Result>> = new Map();

    constructor() { }

    public async loadDefaultTextures(): Promise<void> {

    }

    public async retainTilesetGraphics(tileset: Tileset): Promise<Result> {
        const currentCount = this.refCounts.get(tileset.id) || 0;
        this.refCounts.set(tileset.id, currentCount + 1);

        if (this.baseTexturesCache.has(tileset.id)) return Result.Success();

        if (this.pendingLoads.has(tileset.id)) return await this.pendingLoads.get(tileset.id)!;

        const loadPromise = this.performLoad(tileset);
        this.pendingLoads.set(tileset.id, loadPromise);

        const result = await loadPromise;
        this.pendingLoads.delete(tileset.id);

        return result;
    }

    private async performLoad(tileset: Tileset): Promise<Result> {
        const tilesetAbsPath = tileset.tilesetPathSystem.getAbsPathFromRelPath(tileset.image.source);
        const loadResult = await this.loadTexture(tilesetAbsPath);
        if (loadResult.status === Result.Status.Error) return loadResult;

        const baseTexture = loadResult.data!;
        this.baseTexturesCache.set(tileset.id, baseTexture);

        tileset.checkTextureSize(baseTexture.width, baseTexture.height);

        const slicedTextures = this.sliceTexture(baseTexture, tileset.tilewidth, tileset.tileheight);

        const tiletextureMap = new Map<number, Texture>();

        const sortedTiles = Array.from(tileset.tiles).sort((a, b) => a.id - b.id);
        sortedTiles.forEach((tile, index) => { if (slicedTextures[index]) tiletextureMap.set(tile.id, slicedTextures[index]) });

        this.tileTexturesCache.set(tileset.id, tiletextureMap);
        return Result.Success();
    }

    private async loadTexture(textureAbsPath: string): Promise<Result<Texture | null>> {
        // TODO: Move load texture logic into Infrastructure
        const exist = await exists(textureAbsPath);
        if (!exist) return Result.Error(`Texture file not found at ${textureAbsPath}`);
        try {
            const fileBuffer = await readFile(textureAbsPath);

            const blob = new Blob([new Uint8Array(fileBuffer)], { type: 'image' });
            const url = URL.createObjectURL(blob);

            const image = new Image();
            image.src = url;
            await image.decode();

            const texture = new Texture({ source: new ImageSource({ resource: image, scaleMode: "nearest" }) })
            return Result.Success(texture);
        } catch (error) {
            return Result.Error(`Failed to load texture error: ${error}`);
        }
    }

    public releaseTilesetGraphics(tilesetId: string): void {
        const count = this.refCounts.get(tilesetId);
        if (count === undefined) return;

        const newCount = count - 1;

        if (newCount <= 0) {
            this.refCounts.delete(tilesetId);
            this.destroyTextures(tilesetId);
        } else {
            this.refCounts.set(tilesetId, newCount);
        }
    }

    public forceUnloadTexture(tilesetId: string): void {
        this.refCounts.delete(tilesetId);
        this.destroyTextures(tilesetId);
    }

    private destroyTextures(tilesetId: string): void {
        const tiletexturesMap = this.tileTexturesCache.get(tilesetId);
        if (tiletexturesMap) {
            tiletexturesMap.forEach(texture => texture.destroy());
            this.tileTexturesCache.delete(tilesetId);
        }

        const base = this.baseTexturesCache.get(tilesetId);
        if (base) {
            base.destroy(true);
            this.baseTexturesCache.delete(tilesetId);
        }
    }

    public getTileTexture(tilesetId: string, tileId: number): Texture | null {
        return this.tileTexturesCache.get(tilesetId)?.get(tileId) || null;
    }

    private sliceTexture(texture: Texture, tileWidth: number, tileHeight: number): Texture[] {
        const textures: Texture[] = [];
        const base = texture.source;

        const cols = Math.floor(base.width / tileWidth);
        const rows = Math.floor(base.height / tileHeight);

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const frame = new Rectangle(
                    x * tileWidth,
                    y * tileHeight,
                    tileWidth,
                    tileHeight,
                );
                const slice = new Texture({ source: texture.source, frame });
                textures.push(slice);
            }
        }

        return textures;
    }
}