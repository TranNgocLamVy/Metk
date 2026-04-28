import { BaseObject, BaseObjectEvents } from "@/core/application/baseObject";
import { TileData, TilesetData } from "@/shared/schema/tilesetSchema";
import { Result } from "@/shared/types/result";
import { FilePathSystem } from "@/infrastructure/projectPathSystem";


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

    constructor(tilesetData: TilesetData, public readonly tilesetPathSystem: FilePathSystem) {
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
    
    public async load(): Promise<void> { }

    public async unload(): Promise<void> { }

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
        return Result.Success();
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

    public checkTextureSize(width: number, height: number): void {
        this.image.width = width;
        this.image.height = height;

        this.columns = Math.ceil(this.image.width / this.tilewidth);
        this.rows = Math.ceil(this.image.height / this.tileheight);

        const expectedTileCount = this.columns * this.rows;
        if (this.tiles.length === 0 && expectedTileCount > 0) {
            this.tiles = Array.from({ length: expectedTileCount }, (_, index) => {
                return new Tile({ id: index }, this);
            });
        }
    }

    public updateTexturePath(textureRelPath: string) {
        this.image.source = textureRelPath;
        this.eventEmitter.emit("updateProperty", "image", this.image);
    }
}

export class Tile extends BaseObject {
    public id: number;
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
}