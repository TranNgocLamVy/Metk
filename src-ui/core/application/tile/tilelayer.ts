import { BaseObject, BaseObjectEvents } from "@/core/application/baseObject";
import { TileLayerData, TileRefData } from "@/shared/schema/tilemapSchema";
import { Result, ResultStatus } from "@/shared/types/result";

interface TilelayerEvents extends BaseObjectEvents {
    tileChanged: (x: number, y: number) => void
}

export class TileLayer extends BaseObject<TilelayerEvents> {
    public id: string;
    protected name: string;

    public tilesRef: TileRef[] = [];

    public layerClass: string;
    public coordinate: { x: number, y: number } = { x: 0, y: 0 };
    public offset: { x: number, y: number } = { x: 0, y: 0 };
    public size: { width: number, height: number } = { width: 0, height: 0 }
    public opacity: number = 1;
    public visible: boolean = true;
    public locked: boolean = false;

    constructor(tileLayerData: TileLayerData) {
        super();
        this.id = tileLayerData.id;
        this.name = tileLayerData.name;
        this.coordinate.x = tileLayerData.x ?? 0;
        this.coordinate.y = tileLayerData.y ?? 0;
        this.size.width = tileLayerData.width;
        this.size.height = tileLayerData.height;
        this.opacity = tileLayerData.opacity ?? 1;
        this.visible = tileLayerData.visible;
        this.locked = tileLayerData.locked;
        this.offset.x = tileLayerData.offsetx ?? 0;
        this.offset.y = tileLayerData.offsety ?? 0;

        tileLayerData.tilesData.forEach((tileRefData) => {
            const tileRef = new TileRef(tileRefData);
            this.tilesRef.push(tileRef);
        })
    }

    public serialize(): TileLayerData {
        return {
            id: this.id,
            name: this.name,
            x: this.coordinate.x,
            y: this.coordinate.y,
            width: this.size.width,
            height: this.size.height,
            opacity: this.opacity,
            visible: this.visible,
            locked: this.locked,
            offsetx: this.offset.x,
            offsety: this.offset.y,
            tilesData: this.tilesRef.map((tileRef) => tileRef.serialize()),
        }
    }

    public getName(): string {
        return this.name;
    }

    public async rename(name: string): Promise<Result> {
        this.name = name;
        this.eventEmitter.emit("updateProperty", "name", this.name);
        return { status: "Success", data: null };
    }

    public getTileRefAt(coordinate: { x: number, y: number }): Result<TileRef> {
        const tileRefIndex = coordinate.x * coordinate.y;
        if (tileRefIndex >= this.tilesRef.length) return { status: "Error", message: "Tile not found, x is out of range" };
        return { status: "Success", data: this.tilesRef[tileRefIndex] };
    }

    /**
     * Get TileRefData at coordinate
     * @param coordinate Coordinate of tileRef
     * @param tile New Tile
     * @returns Previous Tile in that coordinate, null mean empty
     */
    public setTileRefAt(coordinate: { x: number, y: number }, tile: TileRefData): Result<TileRefData> {
        const tileRefIndex = coordinate.x * coordinate.y;
        if (tileRefIndex >= this.tilesRef.length) return { status: "Error", message: "Tile not found, x is out of range" };
        const result = this.tilesRef[tileRefIndex].setTile(tile);
        if (result.status === ResultStatus.Success) {
            this.eventEmitter.emit("tileChanged", coordinate.x, coordinate.y);
            return result;
        }
        return result;
    }
}

export class TileRef {
    private tileId: number;
    private tilesetId: string;

    constructor(tileData: TileRefData) {
        this.tileId = tileData.tileId;
        this.tilesetId = tileData.tilesetId;

    }
    public serialize(): TileRefData {
        return {
            tileId: this.tileId,
            tilesetId: this.tilesetId,
        }
    }
    public setTile(newTileRefData: TileRefData): Result<TileRefData> {
        const preTileRefData: TileRefData = {
            tileId: this.tileId,
            tilesetId: this.tilesetId,
        }
        this.tileId = newTileRefData.tileId;
        this.tilesetId = newTileRefData.tilesetId;
        return { status: "Success", data: preTileRefData };

    }
    public getTile(): TileRefData {
        return {
            tileId: this.tileId,
            tilesetId: this.tilesetId,
        }
    }
}