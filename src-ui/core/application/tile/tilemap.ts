
import { v4 as uuidv4 } from "uuid";

import { BaseObject, BaseObjectEvents } from "@/core/application/baseObject";
import { TilemapData, TilesetRefData } from "@/shared/schema/tilemapSchema";
import { ErrorResult, Result, ResultStatus } from "@/shared/types/result";
import { PathUtils } from "@/shared/utils/pathUtils";

import { TilesetGetter } from "../../manager/tilemapGetter";
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

    public tilesets: TilesetRefData[];
    private nextTilesetIndex: number;

    constructor(
        tilemapData: TilemapData,
        public readonly tilesetGetter: TilesetGetter,
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
        
        this.rootLayer = new RootLayer(tilemapData.layers);
        
        this.tilesets = tilemapData.tileset;
        
        const maxIndex = Math.max(...this.tilesets.map(tileset => tileset.index)) ?? 0;
        this.nextTilesetIndex = tilemapData.nextTilesetIndex ?? maxIndex + 1;
        console.log(this);
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
            tileset: this.tilesets,
            layers: this.rootLayer.serialize(),
        }
    }

    public async load(): Promise<void> {

    }

    // ------------------------------ Layer Operations ------------------------------
    public getAllLayers(): TileLayer[] {
        return []
    }

    public getLayerById(id: string): Result<TileLayer> {
        return ErrorResult("Not implemented yet!");
        // const tilelayer = this.tilelayers.find(tilelayer => tilelayer.id === id);
        // if (tilelayer === undefined) return { status: "Error", message: "Tilelayer not found" };
        // return { status: "Success", data: tilelayer };
    }

    public async addTilelayer(name: string): Promise<Result<TileLayer>> {
        return ErrorResult("Not implemented yet!");
        // const newLayerId = uuidv4();
        // const newTilelayer = new TileLayer({
        //     id: newLayerId,
        //     name: name,
        //     width: this.width,
        //     height: this.height,
        //     visible: true,
        //     opacity: 1,
        //     locked: false,
        //     tilesData: Array.from({ length: this.height }, () => Array.from({ length: this.width }, () => null)),
        // }, this.rootLayer);
        // this.tilelayers.push(newTilelayer);
        // this.eventEmitter.emit("tilelayerAdded", "");
        // return { status: "Success", data: newTilelayer };
    }

    public async removeTilelayer(id: string): Promise<Result> {
        // TODO:
        this.eventEmitter.emit("tilelayerRemoved", "");
        return { status: "Success", data: null };
    }

    public async reorderTilelayer(id: string, newIndex: number): Promise<Result> {
        // TODO: 
        // this.eventEmitter.emit("tilelayerReordered", "", oldIndex, newIndex);
        return { status: "Success", data: null };
    }

    public setTileAtLayer(coordinate: { x: number, y: number }, tile: Tile, layerId: string): Result {
        const getLayerResult = this.getLayerById(layerId);
        if (!getLayerResult.data) return { status: "Error", message: getLayerResult.message };
        const layer = getLayerResult.data;

        if (!this.tilesets.find(tileset => tileset.id === tile.tileset.id)) {
            const projectDir = this.tilesetGetter.projectDir;
            const tilesetRelPathFromProject = this.tilesetGetter.tilesetManager.getTilesetPathById(tile.tileset.id);
            if (!tilesetRelPathFromProject) {
                console.error("Tileset not found");
                return { status: "Error", message: "Tileset not found" };
            }
            const tilesetAbsPath = PathUtils.join(projectDir, tilesetRelPathFromProject);
            const tilesetRefPathFromTilemap = PathUtils.relative(this.tilesetGetter.tilemapAbsPath, tilesetAbsPath);

            const newIndex = this.nextTilesetIndex;
            this.nextTilesetIndex += 1;
            this.tilesets.push({ id: tile.tileset.id, name: tile.tileset.name, source: tilesetRefPathFromTilemap, index: newIndex });
        }

        const tilesetIndex = this.tilesets.find(tileset => tileset.id === tile.tileset.id)?.index;
        if (tilesetIndex === undefined) {
            console.error("Tileset index not found");
            return { status: "Error", message: "Tileset index not found" };
        }

        const setResult = layer.setTileRefAt(coordinate, tile.id, tilesetIndex);
        return setResult;
    }

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