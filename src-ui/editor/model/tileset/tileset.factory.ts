import { EditorObjectRegistry } from "@/editor/registry/editor-object.registry";
import { FilePathSystem } from "@/infrastructure/project-path-system";
import { TilesetData, TilesetType } from "@/shared/schema/tileset.schema";
import { Tileset } from "./tileset";
import { ImageCollectionTileset } from "./image-collection-tileset";
import { SingleImageTileset } from "./single-image-tileset";

export class TilesetFactory {
    public static create(tilesetData: TilesetData, tilesetPathSystem: FilePathSystem, objectRegistry: EditorObjectRegistry): Tileset {
        switch (tilesetData.type ?? TilesetType.SingleImage) {
            case TilesetType.ImageCollection:
                return new ImageCollectionTileset(tilesetData, tilesetPathSystem, objectRegistry);
            case TilesetType.SingleImage:
            default:
                return new SingleImageTileset(tilesetData, tilesetPathSystem, objectRegistry);
        }
    }
}