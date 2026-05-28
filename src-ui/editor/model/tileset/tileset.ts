import {
    BaseObject,
    BaseObjectEvents,
    PropertyUpdateMeta,
} from "@/editor/model/base-object";
import {
    TileData,
    TilesetData,
    TilesetType,
} from "@/shared/schema/tileset.schema";
import { Result } from "@/shared/types/result";
import { FilePathSystem } from "@/infrastructure/project-path-system";
import { EditorObjectRegistry } from "@/editor/registry/editor-object.registry";
import {
    EnumProperty,
    NumberProperty,
    Point2DProperty,
    StringProperty,
} from "@/editor/properties/properties.decorator";
import { ImageSourceData } from "@/shared/schema/image-source.schema";
import { ImageSource } from "../image-source";
import { ImageCollectionTileset } from "./image-collection-tileset";

interface TilesetEvent extends BaseObjectEvents {
    update(): void;
}

export abstract class Tileset extends BaseObject<TilesetEvent> {
    @StringProperty<Tileset>({
        label: "ID",
        readonly: true,
        get: (target) => target.id,
    })
    public id: string;

    @StringProperty<Tileset>({
        label: "Name",
        get: (target) => target.name,
        set: (target, value, meta) => {
            target.rename(value, meta);
        },
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
            ];
        },
    })
    public type: TilesetType;

    @Point2DProperty<Tileset>({
        label: "Tile Size",
        group: "Properties",
        order: 1,
        readonly: true,
        pointLabel: { x: "Width", y: "Height" },
        visible: (target) => target.type === TilesetType.SingleImage,
        get: (target) => ({
            x: target.tilewidth,
            y: target.tileheight,
        }),
    })
    public tilewidth: number;

    public tileheight: number;

    public columns: number;
    public rows: number;

    public tiles: Tile[] = [];

    protected constructor(
        tilesetData: TilesetData,
        public readonly tilesetPathSystem: FilePathSystem,
        protected readonly objectRegistry: EditorObjectRegistry,
        type: TilesetType,
    ) {
        super(`tileset:${tilesetData.id}`);

        this.id = tilesetData.id;
        this.name = tilesetData.name;
        this.type = type;

        this.columns = tilesetData.columns;
        this.rows = tilesetData.rows;
        this.tilewidth = tilesetData.tilewidth;
        this.tileheight = tilesetData.tileheight;
    }

    public override getObjectChildren(): BaseObject<any>[] {
        return this.tiles;
    }

    public getName(): string {
        return this.name;
    }

    public async rename(name: string, meta?: PropertyUpdateMeta): Promise<Result> {
        this.name = name;
        this.emitUpdateProperty("name", this.name, {
            origin: meta?.origin ?? "external",
            source: meta?.source ?? "Tileset.rename",
        });
        return Result.Success();
    }

    public getTileFromId(id: number): Tile | null {
        return this.tiles.find((tile) => tile.id === id) || null;
    }

    public getCoordinatesFromTile(id: number): Coordinate | null {
        const tileIndex = this.tiles.findIndex((tile) => tile.id === id);
        if (tileIndex === -1) return null;
        if (this.columns <= 0) return null;
        const row = Math.floor(tileIndex / this.columns);
        const col = tileIndex % this.columns;

        return { row, col };
    }

    public getTileFromCoordinates(row: number, col: number): Tile | null {
        if (this.columns <= 0) return null;
        const tileIndex = row * this.columns + col;
        return this.tiles[tileIndex] || null;
    }

    protected updateCommonData(tilesetData: TilesetData, type: TilesetType): void {
        this.name = tilesetData.name;
        this.type = type;

        this.columns = tilesetData.columns;
        this.rows = tilesetData.rows;
        this.tilewidth = tilesetData.tilewidth;
        this.tileheight = tilesetData.tileheight;
    }

    protected createTile(tileData: TileData): Tile {
        const tile = new Tile(tileData, this);

        this.objectRegistry.register(tile);

        return tile;
    }

    protected replaceTiles(nextTileData: TileData[]): void {
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

            return this.createTile(tileData);
        });
    }

    protected emitTilesetUpdated(source: string): void {
        this.eventEmitter.emit("update");
        this.emitUpdateProperty("name", this.name, {
            origin: "external",
            source,
        });
    }

    public abstract updateTileset(tilesetData: TilesetData): void;

    public abstract serialize(): TilesetData;

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
        get: (target) => ({
            x: target.imageSource?.width ?? target.tileset.tilewidth,
            y: target.imageSource?.height ?? target.tileset.tileheight,
        }),
    })
    private imageSize: any;

    @Point2DProperty<Tile>({
        label: "Tile Size",
        group: "Properties",
        order: 1,
        readonly: true,
        pointLabel: { x: "Width", y: "Height" },
        visible: (target) => target.imageSource == null,
        get: (target) => ({
            x: target.tileset.tilewidth,
            y: target.tileset.tileheight,
        }),
    })
    private tileSize: any;

    public constructor(
        tileData: TileData,
        public readonly tileset: Tileset,
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

        this.emitUpdateProperty("imageSource", this.imageSource, {
            origin: "external",
            source: "Tile.updateTile",
        });
    }

    public serialize(): TileData {
        return {
            id: this.id,
            image: this.imageSource ? this.imageSource.serialize() : undefined,
        };
    }
}

type Coordinate = {
    row: number;
    col: number;
};