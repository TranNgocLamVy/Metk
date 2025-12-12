
import { BaseObject, BaseObjectEvents } from "@/core/application/baseObject";
import { TilemapData, TileRefData, TilesetRefData } from "@/shared/schema/tilemapSchema";
import { Result, ResultStatus } from "@/shared/types/result";
import { PathUtils } from "@/shared/utils/pathUtils";

import { TilesetGetter } from "../../manager/tilemapGetter";
import { TileLayer } from "./tilelayer";
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

    public nextlayerid: number;
    public nextobjectid: number;

    public tilesets: TilesetRefData[] = []

    public tilelayers: TileLayer[] = [];

    constructor(
        tilemapData: TilemapData,
        public readonly tilesetSelector: TilesetGetter,
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

        this.nextlayerid = tilemapData.nextlayerid ?? 1;
        this.nextobjectid = tilemapData.nextobjectid ?? 1;

        tilemapData.layers.forEach((tilelayerData) => {
            const tilelayer = new TileLayer(tilelayerData);
            this.tilelayers.push(tilelayer);
        })
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
            nextlayerid: this.nextlayerid,
            nextobjectid: this.nextobjectid,
            tileset: this.tilesets,
            layers: this.tilelayers.map(tilelayer => tilelayer.serialize()),
        }
    }

    public async load(): Promise<void> {

    }

    // ------------------------------ Layer Operations ------------------------------
    public getAllLayers(): TileLayer[] {
        return Array.from(this.tilelayers);
    }
    public getLayerById(id: string): Result<TileLayer> {
        const tilelayer = this.tilelayers.find(tilelayer => tilelayer.id === id);
        if (tilelayer === undefined) return { status: "Error", message: "Tilelayer not found" };
        return { status: "Success", data: tilelayer };
    }
    public async addTilelayer(): Promise<Result> {
        // TODO:
        this.eventEmitter.emit("tilelayerAdded", "");
        return { status: "Success", data: null };
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
    public setTileAtLayer(coordinate: { x: number, y: number }, tile: Tile, layerId: string): Result<Tile> {
        const getLayerResult = this.getLayerById(layerId);
        if (!getLayerResult.data) return { status: "Error", message: getLayerResult.message };
        const layer = getLayerResult.data;

        const tileRefData: TileRefData = { tileId: tile.id, tilesetId: tile.tileset.id }

        if (!this.tilesets.find(tileset => tileset.id === tile.tileset.id)) {
            const projectDir = this.tilesetSelector.projectDir;
            const tilesetRelPathFromProject = this.tilesetSelector.tilesetManager.getTilesetPathById(tile.tileset.id);
            if (!tilesetRelPathFromProject) {
                console.error("Tileset not found");
                return { status: "Error", message: "Tileset not found" };
            }
            const tilesetAbsPath = PathUtils.join(projectDir, tilesetRelPathFromProject);
            const tilesetRefPathFromTilemap = PathUtils.relative(this.tilesetSelector.tilemapAbsPath, tilesetAbsPath);
            this.tilesets.push({ id: tile.tileset.id, name: tile.tileset.name, source: tilesetRefPathFromTilemap });
        }

        const setResult = layer.setTileRefAt(coordinate, tileRefData);
        if (!setResult.data) return { status: "Error", message: setResult.message };

        const preTileRefData = setResult.data;
        const preTile = this.tilesetSelector.getTile(preTileRefData.tileId, preTileRefData.tilesetId);
        if (!preTile.data) return { status: "Error", message: preTile.message };

        return { status: "Success", data: preTile.data };
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