import { BaseObject, BaseObjectEvents } from "@/editor/model/base-object";
import { ImageData, TileData, TilesetData, TilesetType } from "@/shared/schema/tileset.schema";
import { Result } from "@/shared/types/result";
import { FilePathSystem } from "@/infrastructure/project-path-system";
import { EditorObjectRegistry } from "@/editor/registry/editor-object.registry";
import { NumberProperty, StringProperty } from "@/editor/properties/properties.decorator";

interface TilesetEvent extends BaseObjectEvents {
    update(): void;
}

export class Tileset extends BaseObject<TilesetEvent> {
    public id: string;
    public name: string;
    public type: TilesetType;

    public columns: number;
    public rows: number;
    public tilewidth: number;
    public tileheight: number;
    public tiles: Tile[] = [];
    public image: ImageData;

    constructor(
        tilesetData: TilesetData,
        public readonly tilesetPathSystem: FilePathSystem,
        private readonly objectRegistry: EditorObjectRegistry,
    ) {
        super(`tileset:${tilesetData.id}`);
        this.id = tilesetData.id;
        this.name = tilesetData.name;
        this.type = tilesetData.type ?? TilesetType.SingleImage;

        this.columns = tilesetData.columns;
        this.rows = tilesetData.rows;
        this.tilewidth = tilesetData.tilewidth;
        this.tileheight = tilesetData.tileheight;

        this.image = tilesetData.image ?? {
            source: "",
            width: this.columns * this.tilewidth,
            height: this.rows * this.tileheight,
        };

        if (this.type === TilesetType.ImageCollection) {
            this.tiles = tilesetData.tiles.map((tileData) => {
                const tile = new Tile(tileData, this);
                this.objectRegistry.register(tile);
                return tile;
            });

            this.recalculateCollectionMetrics();
            return;
        }

        const numberOfTiles = this.columns * this.rows;

        if (tilesetData.tiles.length > 0) {
            this.tiles = tilesetData.tiles.map((tileData) => {
                const tile = new Tile(tileData, this);
                this.objectRegistry.register(tile);
                return tile;
            });
        } else {
            this.tiles = Array.from({ length: numberOfTiles }, (_, index) => {
                const tile = new Tile({ id: index }, this);
                this.objectRegistry.register(tile);
                return tile;
            });
        }
    }

    public override getObjectChildren(): BaseObject<any>[] {
        return this.tiles;
    }

    public getName(): string {
        return this.name;
    }

    public async rename(name: string): Promise<Result> {
        this.name = name;
        this.eventEmitter.emit("updateProperty", "name", this.name);
        return Result.Success();
    }

    public isImageCollection(): boolean {
        return this.type === TilesetType.ImageCollection;
    }

    public getTileFromId(id: number): Tile | null {
        return this.tiles.find((tile) => tile.id === id) || null;
    }

    public getCoordinatesFromTile(id: number): Coordinate | null {
        const tileIndex = this.tiles.findIndex((tile) => tile.id === id);
        if (tileIndex === -1) return null;

        const row = Math.floor(tileIndex / this.columns);
        const col = tileIndex % this.columns;

        return { row, col };
    }

    public getTileFromCoordinates(row: number, col: number): Tile | null {
        const tileIndex = row * this.columns + col;
        return this.tiles[tileIndex] || null;
    }

    public getCanvasWidth(gap = 0): number {
        if (this.columns <= 0) return 0;
        return this.columns * this.tilewidth + Math.max(0, this.columns - 1) * gap;
    }

    public getCanvasHeight(gap = 0): number {
        if (this.rows <= 0) return 0;
        return this.rows * this.tileheight + Math.max(0, this.rows - 1) * gap;
    }

    public updateTileset(tilesetData: TilesetData): void {
        this.name = tilesetData.name;
        this.type = tilesetData.type ?? TilesetType.SingleImage;
    
        this.columns = tilesetData.columns;
        this.rows = tilesetData.rows;
        this.tilewidth = tilesetData.tilewidth;
        this.tileheight = tilesetData.tileheight;
    
        this.image = tilesetData.image ?? {
            source: "",
            width: this.columns * this.tilewidth,
            height: this.rows * this.tileheight,
        };
    
        const nextTileData =
            this.type === TilesetType.ImageCollection
                ? tilesetData.tiles
                : tilesetData.tiles.length > 0
                    ? tilesetData.tiles
                    : Array.from(
                        { length: Math.max(0, this.columns * this.rows) },
                        (_, index) => ({ id: index }),
                    );
    
        const currentTilesById = new Map(
            this.tiles.map((tile) => [tile.id, tile]),
        );
    
        const nextTileIds = new Set(nextTileData.map((tile) => tile.id));
    
        for (const tile of this.tiles) {
            if (!nextTileIds.has(tile.id)) {
                this.objectRegistry.unregister(tile);
                tile.destroy();
            }
        }
    
        this.tiles = nextTileData.map((tileData) => {
            const existingTile = currentTilesById.get(tileData.id);
    
            if (existingTile) {
                existingTile.updateTile(tileData);
                return existingTile;
            }
    
            const tile = new Tile(tileData, this);
            this.objectRegistry.register(tile);
            return tile;
        });
    
        if (this.type === TilesetType.ImageCollection) {
            this.recalculateCollectionMetrics();
        }
    
        this.eventEmitter.emit("update");
        this.eventEmitter.emit("updateProperty", "name", this.name);
    }

    public checkTextureSize(width: number, height: number): void {
        if (this.isImageCollection()) return;

        this.image.width = width;
        this.image.height = height;

        this.columns = Math.ceil(this.image.width / this.tilewidth);
        this.rows = Math.ceil(this.image.height / this.tileheight);

        const expectedTileCount = this.columns * this.rows;

        if (this.tiles.length === 0 && expectedTileCount > 0) {
            this.tiles = Array.from({ length: expectedTileCount }, (_, index) => {
                const tile = new Tile({ id: index }, this);
                this.objectRegistry.register(tile);
                return tile;
            });
        }
    }

    public updateTexturePath(textureRelPath: string): void {
        if (this.isImageCollection()) return;

        this.image.source = textureRelPath;
        this.eventEmitter.emit("updateProperty", "image", this.image);
    }

    private recalculateCollectionMetrics(): void {
        if (!this.isImageCollection()) return;

        const tileCount = this.tiles.length;

        if (tileCount === 0) {
            this.columns = 1;
            this.rows = 1;
            this.tilewidth = Math.max(1, this.tilewidth);
            this.tileheight = Math.max(1, this.tileheight);
            this.image.width = this.tilewidth;
            this.image.height = this.tileheight;
            return;
        }

        if (this.columns <= 0) {
            this.columns = Math.ceil(Math.sqrt(tileCount));
        }

        this.rows = Math.ceil(tileCount / this.columns);

        this.tilewidth = Math.max(
            1,
            ...this.tiles.map((tile) => tile.image?.width ?? this.tilewidth),
        );

        this.tileheight = Math.max(
            1,
            ...this.tiles.map((tile) => tile.image?.height ?? this.tileheight),
        );

        this.image.width = this.getCanvasWidth();
        this.image.height = this.getCanvasHeight();
    }

    public serialize(): TilesetData {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            columns: this.columns,
            rows: this.rows,
            tilewidth: this.tilewidth,
            tileheight: this.tileheight,
            image: this.isImageCollection() ? undefined : this.image,
            tiles: this.tiles.map((tile) => tile.serialize()),
        };
    }

    public override destroy(): void {
        this.tiles.forEach((tile) => tile.destroy());
        super.destroy();
    }
}

export class Tile extends BaseObject {
    @NumberProperty<Tile>({
        label: "ID",
        readonly: true,
        get: (target) => target.id,
    })
    public id: number;

    public tileset: Tileset;
    public image?: ImageData;

    @StringProperty<Tile>({
        label: "Image source",
        group: "Image",
        readonly: true,
        visible: (target) => !!target.image?.source,
        get: (target) => target.image?.source ?? "",
    })
    public readonly imageSource: string = "";

    @NumberProperty<Tile>({
        label: "Width",
        group: "Image",
        readonly: true,
        get: (target) => target.image?.width ?? target.tileset.tilewidth,
    })
    public readonly imageWidth: number = 0;

    @NumberProperty<Tile>({
        label: "Height",
        group: "Image",
        readonly: true,
        get: (target) => target.image?.height ?? target.tileset.tileheight,
    })
    public readonly imageHeight: number = 0;

    constructor(tileData: TileData, tileset: Tileset) {
        super(`${tileset.objectId}:tile:${tileData.id}`);

        this.id = tileData.id;
        this.tileset = tileset;
        this.image = tileData.image;
    }

    public updateTile(tileData: TileData): void {
        this.image = tileData.image;

        this.eventEmitter.emit("updateProperty", "image", this.image);
    }

    public serialize(): TileData {
        return {
            id: this.id,
            image: this.image,
        };
    }
}