import { EditorObjectRegistry } from "@/editor/registry/editor-object.registry";
import { FilePathSystem } from "@/infrastructure/project-path-system";
import { ImageSourceData } from "@/shared/data-types/image-source.data";
import { TilesetData, TilesetType } from "@/shared/data-types/tileset.data";
import { Tileset } from "./tileset";
import { normalizeTilesetData } from "./tileset.normalizer";

export class ImageCollectionTileset extends Tileset {
    public constructor(
        tilesetData: TilesetData,
        tilesetPathSystem: FilePathSystem,
        objectRegistry: EditorObjectRegistry,
    ) {
        super(
            tilesetData,
            tilesetPathSystem,
            objectRegistry,
            TilesetType.ImageCollection,
        );

        this.tiles = tilesetData.tiles.map((tileData) =>
            this.createTile(tileData),
        );

        this.recalculateCollectionMetrics();
    }

    public updateTileset(tilesetData: TilesetData): void {
        const data = normalizeTilesetData(tilesetData);
        this.updateCommonData(data, TilesetType.ImageCollection);

        this.replaceTiles(data.tiles);
        this.recalculateCollectionMetrics();

        this.emitTilesetUpdated("ImageCollectionTileset.updateTileset");
    }

    public addImageTiles(imageSources: ImageSourceData[]): number[] {
        if (imageSources.length === 0) return [];

        const firstTileId = Math.max(-1, ...this.tiles.map((tile) => tile.id)) + 1;
        const addedTileIds = imageSources.map((_, index) => firstTileId + index);

        this.replaceTiles([
            ...this.tiles.map((tile) => tile.serialize()),
            ...imageSources.map((image, index) => ({
                id: firstTileId + index,
                image,
            })),
        ]);
        this.recalculateCollectionMetrics();

        this.emitTilesetUpdated("ImageCollectionTileset.addImageTiles");

        return addedTileIds;
    }

    public removeTile(tileId: number): boolean {
        if (!this.tiles.some((tile) => tile.id === tileId)) return false;

        this.replaceTiles(
            this.tiles
                .filter((tile) => tile.id !== tileId)
                .map((tile) => tile.serialize()),
        );
        this.recalculateCollectionMetrics();

        this.emitTilesetUpdated("ImageCollectionTileset.removeTile");

        return true;
    }

    private recalculateCollectionMetrics(): void {
        const tileCount = this.tiles.length;

        if (tileCount === 0) {
            this.columns = 1;
            this.rows = 1;
            this.tileWidth = Math.max(1, this.tileWidth);
            this.tileHeight = Math.max(1, this.tileHeight);
            return;
        }

        if (this.columns <= 0) {
            this.columns = Math.ceil(Math.sqrt(tileCount));
        }

        this.rows = Math.ceil(tileCount / this.columns);

        this.tileWidth = Math.max(
            1,
            ...this.tiles.map((tile) => tile.imageSource?.width ?? this.tileWidth),
        );

        this.tileHeight = Math.max(
            1,
            ...this.tiles.map((tile) => tile.imageSource?.height ?? this.tileHeight),
        );
    }

    public serialize(): TilesetData {
        return {
            id: this.id,
            ...(this.cloneFrom ? { cloneFrom: this.cloneFrom } : {}),
            name: this.name,
            type: TilesetType.ImageCollection,
            columns: this.columns,
            rows: this.rows,
            tileWidth: this.tileWidth,
            tileHeight: this.tileHeight,
            image: undefined,
            tiles: this.tiles.map((tile) => tile.serialize()),
        };
    }
}
