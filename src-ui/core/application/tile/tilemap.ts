
import { v4 as uuidv4 } from "uuid";

import { BaseObject, BaseObjectEvents } from "@/core/application/baseObject";
import { TilesetRefManager } from "@/core/manager/tilesetRefManager";
import { TilemapData, TilesetRefData } from "@/shared/schema/tilemapSchema";
import { ErrorResult, Result, ResultStatus } from "@/shared/types/result";
import { PathUtils } from "@/shared/utils/pathUtils";

import { RootLayer } from "./layer/rootLayer";
import { TileLayer } from "./layer/tileLayer";
import { Tile } from "./tileset";

interface TilemapEvent extends BaseObjectEvents {
    tilelayerAdded: (layerId: string) => void
    tilelayerRemoved: (layerId: string) => void
    tilelayerReordered: (layerId: string, oldIndex: number, newIndex: number) => void
}

export class Tilemap extends BaseObject<TilemapEvent> {
    public id: string;
    public name: string;
    public infinite: boolean;
    public backgroundcolor: string;

    public width: number;
    public height: number;
    public tilewidth: number;
    public tileheight: number;

    public rootLayer: RootLayer;

    constructor(
        tilemapData: TilemapData,
        public readonly tilesetRefManager: TilesetRefManager
    ) {
        super();

        this.id = tilemapData.id;
        this.name = tilemapData.name;
        this.infinite = tilemapData.infinite ?? false;
        this.backgroundcolor = tilemapData.backgroundcolor ?? "#AARRGGBB";

        this.width = tilemapData.width;
        this.height = tilemapData.height;
        this.tilewidth = tilemapData.tilewidth;
        this.tileheight = tilemapData.tileheight;
        
        this.rootLayer = new RootLayer(tilemapData.layers, this.tilesetRefManager, this);
        
        this.tilesetRefManager.load(tilemapData.tileset);
    }

    public serialize(): TilemapData {
        return {
            id: this.id,
            name: this.name,
            height: this.height,
            width: this.width,
            tilewidth: this.tilewidth,
            tileheight: this.tileheight,
            infinite: this.infinite,
            backgroundcolor: this.backgroundcolor,
            tileset: this.tilesetRefManager.serialize(),
            layers: this.rootLayer.serialize(),
        }
    }

    public async load(): Promise<void> {

    }

    // public setTileAtLayer(coordinate: { x: number, y: number }, tile: Tile, layerId: string): Result {
    //     const getLayerResult = this.getLayerById(layerId);
    //     if (!getLayerResult.data) return { status: "Error", message: getLayerResult.message };
    //     const layer = getLayerResult.data;

    //     if (!this.tilesets.find(tileset => tileset.id === tile.tileset.id)) {
    //         const projectDir = this.tilesetGetter.projectDir;
    //         const tilesetRelPathFromProject = this.tilesetGetter.tilesetManager.getTilesetPathById(tile.tileset.id);
    //         if (!tilesetRelPathFromProject) {
    //             console.error("Tileset not found");
    //             return { status: "Error", message: "Tileset not found" };
    //         }
    //         const tilesetAbsPath = PathUtils.join(projectDir, tilesetRelPathFromProject);
    //         const tilesetRefPathFromTilemap = PathUtils.relative(this.tilesetGetter.tilemapAbsPath, tilesetAbsPath);

    //         const newIndex = this.nextTilesetIndex;
    //         this.nextTilesetIndex += 1;
    //         this.tilesets.push({ id: tile.tileset.id, name: tile.tileset.name, source: tilesetRefPathFromTilemap, index: newIndex });
    //     }

    //     const tilesetIndex = this.tilesets.find(tileset => tileset.id === tile.tileset.id)?.index;
    //     if (tilesetIndex === undefined) {
    //         console.error("Tileset index not found");
    //         return { status: "Error", message: "Tileset index not found" };
    //     }

    //     const setResult = layer.setTileRefAt(coordinate, tile.id, tilesetIndex);
    //     return setResult;
    // }

    // ------------------------------ Properties Operations ------------------------------
    public getName(): string {
        return this.name;
    }

    public async rename(name: string): Promise<Result> {
        this.name = name;
        this.eventEmitter.emit("updateProperty", "name", this.name);
        return { status: ResultStatus.Success, data: null };
    }
}