import { Texture } from "pixi.js";

import { BaseObject, BaseObjectEvents } from "@/core/application/baseObject";
import { TextureService } from "@/infrastructure/textureService";
import { TileData, TilesetData } from "@/shared/schema/tilesetSchema";
import { Result, ResultStatus } from "@/shared/types/result";
import { TextureUtils } from "@/shared/utils/textureUtils";
import { FilePathSystem } from "@/infrastructure/projectPathSystem";

const tileTextureFinalizer = new FinalizationRegistry((texture: Texture) => {
    texture.destroy();
});

interface TilesetEvent extends BaseObjectEvents {
    update(): void
}

export class Tileset extends BaseObject<TilesetEvent> {
    public id: string;
    public name: string;
    public columns: number;
    public rows: number;
    public tilewidth: number;
    public tileheight: number;
    public tiles: Tile[] = [];

    public image: {
        source: string;
        width: number;
        height: number;
    };
    public texture: Texture;
    public isTextureLoaded: boolean = false;

    constructor(tilesetData: TilesetData, public readonly textureService: TextureService, public readonly tilesetPathSystem: FilePathSystem) {
        super();
        this.id = tilesetData.id;
        this.name = tilesetData.name;
        this.columns = tilesetData.columns;
        this.rows = tilesetData.rows;
        this.tilewidth = tilesetData.tilewidth;
        this.tileheight = tilesetData.tileheight;
        this.image = tilesetData.image;

        const numberOfTiles = this.columns * this.rows;
        if (tilesetData.tiles.length > 0) {
            this.tiles = tilesetData.tiles.map(tileData => {
                return new Tile(tileData, this);
            });
        } else {
            this.tiles = Array.from({ length: numberOfTiles }, (_, index) => {
                return new Tile({ id: index }, this);
            });
        }
    }

    public serialize(): TilesetData {
        return {
            id: this.id,
            name: this.name,
            columns: this.columns,
            rows: this.rows,
            tilewidth: this.tilewidth,
            tileheight: this.tileheight,
            image: this.image,
            tiles: this.tiles.map(tile => tile.serialize()),
        }
    }

    public getName(): string {
        return this.name;
    }

    public async rename(name: string): Promise<Result> {
        this.name = name;
        this.eventEmitter.emit("updateProperty", "name", this.name);
        return { status: ResultStatus.Success, data: null };
    }

    public getTileFromId(id: number): Tile | null {
        return this.tiles.find(tile => tile.id === id) || null;
    }

    public getCoordinatesFromTile(id: number): Coordinate | null {
        const tileIndex = this.tiles.findIndex(tile => tile.id === id);
        if (tileIndex === -1) return null;
        const row = Math.floor(tileIndex / this.columns);
        const col = tileIndex % this.columns;
        return { row, col };
    }

    public getTileFromCoordinates(row: number, col: number): Tile | null {
        const tileIndex = row * this.columns + col;
        return this.tiles[tileIndex] || null;
    }

    public getTileCount(): number {
        return this.tiles.length;
    }

    public async loadTexture(): Promise<Result> {
        if (this.isTextureLoaded) return { status: ResultStatus.Success, data: null };
        const imageRelPath = this.image.source;

        const loadTextureResult = await this.textureService.loadTexture(imageRelPath);
        if (loadTextureResult.status === "Error") return loadTextureResult;
        const texture = loadTextureResult.data;
        if (!texture) return { status: ResultStatus.Error, message: "Failed to load texture" };
        this.texture = texture;

        this.image.width = texture.width;
        this.image.height = texture.height;

        this.columns = Math.ceil(this.image.width / this.tilewidth);
        this.rows = Math.ceil(this.image.height / this.tileheight);

        this.isTextureLoaded = true;

        const expectedTileCount = this.columns * this.rows;
        if (this.tiles.length === 0 && expectedTileCount > 0) {
            this.tiles = Array.from({ length: expectedTileCount }, (_, index) => {
                return new Tile({ id: index }, this);
            });
        }

        const tileTextureList = TextureUtils.sliceTexture(this.texture, this.tilewidth, this.tileheight);

        const sortedTiles = Array.from(this.tiles).sort((a, b) => a.id - b.id);
        sortedTiles.forEach((tile, index) => {
            const tileTexture = tileTextureList[index];
            tile.loadTexture(tileTexture);
        })

        return { status: ResultStatus.Success, data: null };
    }

    public async unloadTexture(): Promise<void> {

    }
}

export class Tile extends BaseObject {
    public id: number;
    protected texture: Texture;
    public isTextureLoaded: boolean = false;
    public tileset: Tileset;

    constructor(tileData: TileData, tileset: Tileset) {
        super();
        this.id = tileData.id;
        this.tileset = tileset;
    }

    public serialize(): TileData {
        return {
            id: this.id,
        }
    }

    public loadTexture(texture: Texture): void {
        if (this.isTextureLoaded) return;
        this.texture = texture;
        tileTextureFinalizer.register(this, texture);
        this.isTextureLoaded = true;
    }

    public getTexture(): Texture {
        return this.texture;
    }

    public destroy(): void {
        tileTextureFinalizer.unregister(this);
        this.texture.destroy();
    }
}