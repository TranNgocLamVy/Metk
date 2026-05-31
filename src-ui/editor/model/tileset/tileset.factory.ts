import { EditorObjectRegistry } from "@/editor/registry/editor-object.registry";
import { FilePathSystem } from "@/infrastructure/project-path-system";
import { TilesetData, TilesetType } from "@/shared/data-types/tileset.data";
import { Tileset } from "./tileset";
import { ImageCollectionTileset } from "./image-collection-tileset";
import { SingleImageTileset } from "./single-image-tileset";
import { Result } from "@/shared/types/result";
import { normalizeTilesetData } from "./tileset.normalizer";

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

    public static createFromFileData(tilesetData: unknown, tilesetPathSystem: FilePathSystem, objectRegistry: EditorObjectRegistry): Result<Tileset> {
        try {
            const data = normalizeTilesetData(tilesetData);
            return Result.Success(this.create(data, tilesetPathSystem, objectRegistry));
        } catch (error) {
            return Result.Error(`Failed to create tileset: ${String(error)}`);
        }
    }
}
