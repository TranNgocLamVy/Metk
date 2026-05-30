import { TilesetData, TilesetType } from "@/shared/data-types/tileset.data";
import { Tileset } from "./tileset";
import { FilePathSystem } from "@/infrastructure/project-path-system";
import { EditorObjectRegistry } from "@/editor/registry/editor-object.registry";
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

    private recalculateCollectionMetrics(): void {
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
            type: TilesetType.ImageCollection,
            columns: this.columns,
            rows: this.rows,
            tilewidth: this.tilewidth,
            tileheight: this.tileheight,
            image: undefined,
            tiles: this.tiles.map((tile) => tile.serialize()),
        };
    }
}
