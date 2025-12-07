import { Texture } from "pixi.js";

import { BaseObject } from "@/core/application/baseObject";
import { TextureService } from "@/infrastructure/textureService";
import { TileData, TilesetData } from "@/shared/schema/tilesetSchema";
import { Result, ResultStatus } from "@/shared/types/result";
import { TextureUtils } from "@/shared/utils/textureUtils";

const tileTextureFinalizer = new FinalizationRegistry((texture: Texture) => {
    texture.destroy();
});

export class Tileset extends BaseObject {
    public id: string;
    public name: string;
    public columns: number;
    public rows: number;
    public tilewidth: number;
    public tileheight: number;
    public grid?: {
        orientation: "orthogonal" | "isometric";
        width: number;
        height: number;
    }
    public tiles: Tile[] = [];

    public image: {
        source: string;
        width: number;
        height: number;
    };
    public texture: Texture;
    public isTextureLoaded: boolean = false;

    constructor(tilesetData: TilesetData, private textureService: TextureService) {
        super();
        this.id = tilesetData.id;
        this.name = tilesetData.name;
        this.columns = tilesetData.columns;
        this.rows = tilesetData.rows;
        this.tilewidth = tilesetData.tilewidth;
        this.tileheight = tilesetData.tileheight;
        this.image = tilesetData.image;
        this.grid = tilesetData.grid;

        const numberOfTiles = this.columns * this.rows;
        if (tilesetData.tile.length > 0) {
            this.tiles = tilesetData.tile.map(tileData => {
                return new Tile(tileData);
            });
        } else {
            this.tiles = Array.from({ length: numberOfTiles }, (_, index) => {
                return new Tile({ id: index });
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
            tile: this.tiles.map(tile => tile.serialize()),
        }
    }

    public getName(): string {
        return this.name;
    }

    public async rename(name: string): Promise<Result> {
        this.name = name;
        this.emit(BaseObject.event.UpdateProperty);
        return { status: ResultStatus.Success, data: null };
    }

    public getTile(id: number): Tile | null {
        return this.tiles.find(tile => tile.id === id) || null;
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

    constructor(tileData: TileData) {
        super();
        this.id = tileData.id;
    }

    public serialize(): TileData {
        return {
            id: this.id,
            // x: this.x,
            // y: this.y,
            // width: this.width,
            // height: this.height,
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