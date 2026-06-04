import { Point2DProperty, StringProperty } from "@/editor/properties/properties.decorator";
import { EditorObjectRegistry } from "@/editor/registry/editor-object.registry";
import { FilePathSystem } from "@/infrastructure/project-path-system";
import { ImageSourceData } from "@/shared/data-types/image-source.data";
import { TilesetData, TilesetType } from "@/shared/data-types/tileset.data";
import { PropertyUpdateMeta } from "../base-object";
import { ImageSource } from "../image-source";
import { Tileset } from "./tileset";
import { normalizeTilesetData } from "./tileset.normalizer";

export class SingleImageTileset extends Tileset {
    @StringProperty<SingleImageTileset>({
        label: "Source",
        group: "Image",
        order: 1,
        readonly: true,
        get: (target) => target.imageSource?.source ?? "",
    })
    public imageSource: ImageSource;

    @Point2DProperty<SingleImageTileset>({
        label: "Size",
        group: "Image",
        order: 2,
        readonly: true,
        pointLabel: { x: "Width", y: "Height" },
        get: (target) => ({
            x: target.imageSource.width,
            y: target.imageSource.height,
        }),
    })
    private imageSize: any;

    public constructor(
        tilesetData: TilesetData,
        tilesetPathSystem: FilePathSystem,
        objectRegistry: EditorObjectRegistry,
    ) {
        super(
            tilesetData,
            tilesetPathSystem,
            objectRegistry,
            TilesetType.SingleImage,
        );

        const sourceData = tilesetData.image ?? {
            source: "",
            width: this.columns * this.tileWidth,
            height: this.rows * this.tileHeight,
        };

        this.imageSource = new ImageSource(sourceData);

        const numberOfTiles = Math.max(0, this.columns * this.rows);

        if (tilesetData.tiles.length > 0) {
            this.tiles = tilesetData.tiles.map((tileData) =>
                this.createTile(tileData),
            );
        } else {
            this.tiles = Array.from({ length: numberOfTiles }, (_, index) =>
                this.createTile({ id: index }),
            );
        }
    }

    public updateTileset(tilesetData: TilesetData): void {
        const data = normalizeTilesetData(tilesetData);
        this.updateCommonData(data, TilesetType.SingleImage);

        const imageSourceData = data.image ?? {
            source: "",
            width: this.columns * this.tileWidth,
            height: this.rows * this.tileHeight,
        };

        this.imageSource.setSource(imageSourceData);

        const nextTileData =
            data.tiles.length > 0
                ? data.tiles
                : Array.from(
                    { length: Math.max(0, this.columns * this.rows) },
                    (_, index) => ({ id: index }),
                );

        this.replaceTiles(nextTileData);

        this.emitTilesetUpdated("SingleImageTileset.updateTileset");
    }

    public updateImageSource(source: ImageSourceData,meta?: PropertyUpdateMeta): void {
        this.imageSource.setSource(source);

        this.emitUpdateProperty("imageSource", this.imageSource, {
            origin: meta?.origin ?? "external",
            source: meta?.source ?? "SingleImageTileset.updateImageSource",
        });
    }

    public serialize(): TilesetData {
        return {
            id: this.id,
            ...(this.cloneFrom ? { cloneFrom: this.cloneFrom } : {}),
            name: this.name,
            type: TilesetType.SingleImage,
            columns: this.columns,
            rows: this.rows,
            tileWidth: this.tileWidth,
            tileHeight: this.tileHeight,
            image: this.imageSource.serialize(),
            tiles: this.tiles.map((tile) => tile.serialize()),
        };
    }
}
