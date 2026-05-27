import { BaseObject, BaseObjectEvents } from "@/editor/model/base-object";
import { TileData, TilesetData, TilesetType } from "@/shared/schema/tileset.schema";
import { Result } from "@/shared/types/result";
import { FilePathSystem } from "@/infrastructure/project-path-system";
import { EditorObjectRegistry } from "@/editor/registry/editor-object.registry";
import { EnumProperty, NumberProperty, Point2DProperty, StringProperty } from "@/editor/properties/properties.decorator";
import { ImageSourceData } from "@/shared/schema/image-source.schema";
import { ImageSource } from "../image-source";

interface TilesetEvent extends BaseObjectEvents {
    update(): void;
}

export class Tileset extends BaseObject<TilesetEvent> {
    @StringProperty<Tileset>({
        label: "ID",
        readonly: true,
        get: (target) => target.id,
    })
    public id: string;

    @StringProperty<Tileset>({
        label: "Name",
        get: (target) => target.name,
        set: (target, value) => { target.rename(value) },
    })
    public name: string;

    @EnumProperty<Tileset>({
        label: "Type",
        order: 3,
        readonly: true,
        get: (target) => target.type,
        options: () => {
            return [
                { label: "Single image", value: "single-image" },
                { label: "Image Collection", value: "image-collection" },
            ]
        },
    })
    public type: TilesetType;

    @Point2DProperty<Tileset>({
        label: "Tile Size",
        group: "Properties",
        order: 1,
        readonly: true,
        pointLabel: { x: "Width", y: "Height" },
        visible: (target) => target.type == "single-image",
        get: (target) => ({ x: target.tilewidth, y: target.tileheight }),
    })
    public tilewidth: number;
    public tileheight: number;

    public columns: number;
    public rows: number;

    @StringProperty<Tileset>({
        label: "Source",
        group: "Image",
        order: 1,
        readonly: true,
        visible: (target) => target.type == "single-image",
        get: (target) => target.imageSource?.source ?? "",
    })
    public imageSource: ImageSource;

    @Point2DProperty<Tileset>({
        label: "Size",
        group: "Image",
        order: 2,
        readonly: true,
        pointLabel: { x: "Width", y: "Height" },
        visible: (target) => target.type == "single-image",
        get: (target) => ({ x: target.imageSource.width, y: target.imageSource.height }),
    })
    private imageSize: any;

    public tiles: Tile[] = [];


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


        const sourceData = tilesetData.image ?? {
            source: "",
            width: this.columns * this.tilewidth,
            height: this.rows * this.tileheight,
        };
        this.imageSource = new ImageSource(sourceData);

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

        const imageSourceData = tilesetData.image ?? {
            source: "",
            width: this.columns * this.tilewidth,
            height: this.rows * this.tileheight,
        };
        this.imageSource.setSource(imageSourceData);

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

    public updateImageSource(source: ImageSourceData): void {
        this.imageSource.setSource(source);
        this.eventEmitter.emit("updateProperty", "image", this.imageSource);
    }

    private recalculateCollectionMetrics(): void {
        if (!this.isImageCollection()) return;

        const tileCount = this.tiles.length;

        if (tileCount === 0) {
            this.columns = 1;
            this.rows = 1;
            this.tilewidth = Math.max(1, this.tilewidth);
            this.tileheight = Math.max(1, this.tileheight);
            return;
        }

        if (this.columns <= 0) {
            this.columns = Math.ceil(Math.sqrt(tileCount));
        }

        this.rows = Math.ceil(tileCount / this.columns);

        this.tilewidth = Math.max(
            1,
            ...this.tiles.map((tile) => tile.imageSource?.width ?? this.tilewidth),
        );

        this.tileheight = Math.max(
            1,
            ...this.tiles.map((tile) => tile.imageSource?.height ?? this.tileheight),
        );
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
            image: this.isImageCollection() ? undefined : this.imageSource.serialize(),
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

    @StringProperty<Tile>({
        label: "Source",
        group: "Image",
        readonly: true,
        visible: (target) => !!target.imageSource?.source,
        get: (target) => target.imageSource?.source ?? "",
    })
    public imageSource: ImageSource | null;

    @Point2DProperty<Tile>({
        label: "Size",
        group: "Image",
        order: 1,
        readonly: true,
        pointLabel: { x: "Width", y: "Height" },
        visible: (target) => !!target.imageSource?.source,
        get: (target) => ({ x: target.imageSource?.width ?? target.tileset.tilewidth, y: target.imageSource?.height ?? target.tileset.tileheight }),
    })
    private imageSize: any;

    @Point2DProperty<Tile>({
        label: "Tile Size",
        group: "Properties",
        order: 1,
        readonly: true,
        pointLabel: { x: "Width", y: "Height" },
        visible: (target) => { return target.imageSource == null },
        get: (target) => ({ x: target.tileset.tilewidth, y: target.tileset.tileheight }),
    })
    private tileSize: any;

    constructor(
        tileData: TileData,
        public readonly tileset: Tileset
    ) {
        super(`${tileset.objectId}:tile:${tileData.id}`);

        this.id = tileData.id;

        this.imageSource = tileData.image ? new ImageSource(tileData.image) : null;
    }

    public updateTile(tileData: TileData): void {
        if (tileData.image) {
            this.imageSource = new ImageSource(tileData.image);
        } else {
            this.imageSource = null;
        }

        this.eventEmitter.emit("updateProperty", "image", this.imageSource);
    }

    public serialize(): TileData {
        return {
            id: this.id,
            image: this.imageSource ? this.imageSource.serialize() : undefined,
        };
    }
}