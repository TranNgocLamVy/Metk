import { EventEmitter } from "eventemitter3";
import { Assets, Rectangle, Texture } from "pixi.js";
import { exists, readFile } from "@tauri-apps/plugin-fs";
import errorTexture from "@/assets/sprites/Missing_texture.png";
import { Tileset } from "@/editor/model/tileset/tileset";
import { Result } from "@/shared/types/result";
import { TextureUtils } from "@/shared/utils/texture.utils";
import { Console } from "@/shared/services/console.service";

interface TextureManagerEvent {
    onTextureReloaded: (tilesetId: string) => void;
}

export class TextureManager extends EventEmitter<TextureManagerEvent> {
    private tileTexturesCache: Map<string, Map<number, Texture>> = new Map();
    private baseTexturesCache: Map<string, Texture> = new Map();

    private refCounts: Map<string, number> = new Map();
    private pendingLoads: Map<string, Promise<Result>> = new Map();
    private errorTexture: Texture | null = null;

    constructor() {
        super();
    }

    public async getErrorTexture(): Promise<Texture> {
        if (this.errorTexture) return this.errorTexture;
        const texture = await Assets.load({ src: errorTexture, data: { scaleMode: 'nearest' } });
        this.errorTexture = texture;
        return texture;
    }

    public async retainTilesetGraphics(tileset: Tileset): Promise<Result> {
        const currentCount = this.refCounts.get(tileset.id) || 0;
        this.refCounts.set(tileset.id, currentCount + 1);
    
        if (this.tileTexturesCache.has(tileset.id)) return Result.Success();
    
        if (this.pendingLoads.has(tileset.id)) {
            return await this.pendingLoads.get(tileset.id)!;
        }

        const loadPromise = this.performLoad(tileset);
        this.pendingLoads.set(tileset.id, loadPromise);

        const result = await loadPromise;
        this.pendingLoads.delete(tileset.id);

        return result;
    }

    private async performLoad(tileset: Tileset): Promise<Result> {
        if (tileset.isImageCollection()) {
            return this.performLoadImageCollection(tileset);
        }

        return this.performLoadSingleImage(tileset);
    }

    private async performLoadSingleImage(tileset: Tileset): Promise<Result> {
        const tilesetAbsPath = tileset.tilesetPathSystem.getAbsPathFromRelPath(
            tileset.imageSource.source,
        );

        const loadResult = await this.loadTexture(tilesetAbsPath);

        if (loadResult.status === Result.Status.Error) {
            this.reportTilesetTextureLoadError(tileset, loadResult);
            return loadResult;
        }

        const baseTexture = loadResult.data!;
        this.baseTexturesCache.set(tileset.id, baseTexture);

        const slicedTextures = this.sliceTexture(
            baseTexture,
            tileset.tilewidth,
            tileset.tileheight,
        );

        const tileTextureMap = new Map<number, Texture>();

        const sortedTiles = Array.from(tileset.tiles).sort(
            (a, b) => a.id - b.id,
        );

        sortedTiles.forEach((tile, index) => {
            const texture = slicedTextures[index];
            if (!texture) return;

            tileTextureMap.set(tile.id, texture);
        });

        this.tileTexturesCache.set(tileset.id, tileTextureMap);
        this.emit("onTextureReloaded", tileset.id);

        return Result.Success();
    }

    private async performLoadImageCollection(tileset: Tileset): Promise<Result> {
        const tileTextureMap = new Map<number, Texture>();

        const sortedTiles = Array.from(tileset.tiles).sort(
            (a, b) => a.id - b.id,
        );

        for (const tile of sortedTiles) {
            if (!tile.imageSource?.source) continue;

            const tileAbsPath = tileset.tilesetPathSystem.getAbsPathFromRelPath(
                tile.imageSource.source,
            );

            const loadResult = await this.loadTexture(tileAbsPath);

            if (loadResult.status === Result.Status.Error) {
                this.reportTilesetTextureLoadError(tileset, loadResult);
                continue;
            }

            tileTextureMap.set(tile.id, loadResult.data!);
        }

        this.tileTexturesCache.set(tileset.id, tileTextureMap);
        this.emit("onTextureReloaded", tileset.id);

        return Result.Success();
    }

    private reportTilesetTextureLoadError(tileset: Tileset, loadResult: Result<Texture | null>): void {
        const customId = "loadTextureFail:" + tileset.id;
        Console.error(
            {
                message: {
                    key: "message.texture.missing",
                    options: { name: tileset.name },
                },
                stacks: loadResult.message ? [loadResult.message] : [],
                actions: [
                    {
                        label: "global.action.texture.import",
                        variant: "outline",
                        onClick: async () => {
                            const { TextureService } = await import(
                                "@/shared/services/texture.service"
                            );

                            return await TextureService.importTexture(
                                tileset.id,
                            );
                        },
                    },
                ],
            },
            customId,
        );
    }

    private async loadTexture(textureAbsPath: string): Promise<Result<Texture | null>> {
        const exist = await exists(textureAbsPath);

        if (!exist) {
            return Result.Error({
                key: "message.system.fs.fileNotFoundAt",
                options: { path: textureAbsPath },
            });
        }

        const fileBuffer = await readFile(textureAbsPath);
        const texture = await TextureUtils.processTexture(fileBuffer);

        return Result.Success(texture);
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

        this.emit("onTextureReloaded", tilesetId);
    }

    public forceUnloadTexture(tilesetId: string): void {
        this.refCounts.delete(tilesetId);
        this.destroyTextures(tilesetId);
        this.emit("onTextureReloaded", tilesetId);
    }

    public updateTilesetTexture(tileset: Tileset, texture: Texture): void {
        if (tileset.isImageCollection()) return;

        this.destroyTextures(tileset.id);

        this.baseTexturesCache.set(tileset.id, texture);

        const slicedTextures = this.sliceTexture(texture, tileset.tilewidth, tileset.tileheight);
        const tileTextureMap = new Map<number, Texture>();
        const sortedTiles = Array.from(tileset.tiles).sort((a, b) => a.id - b.id);

        sortedTiles.forEach((tile, index) => {
            const tileTexture = slicedTextures[index];
            if (!tileTexture) return;

            tileTextureMap.set(tile.id, tileTexture);
        });

        this.tileTexturesCache.set(tileset.id, tileTextureMap);
        this.emit("onTextureReloaded", tileset.id);
    }

    private destroyTextures(tilesetId: string): void {
        const tileTextureMap = this.tileTexturesCache.get(tilesetId);
        const baseTexture = this.baseTexturesCache.get(tilesetId);

        if (tileTextureMap) {
            tileTextureMap.forEach((texture) => {
                texture.destroy(!baseTexture);
            });

            this.tileTexturesCache.delete(tilesetId);
        }
        if (baseTexture) {
            baseTexture.destroy(true);
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