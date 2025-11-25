import { Result, ResultStatus } from "@/core/constance/common/result";
import { ITilelayer } from "@/core/interface/tile/ITilelayer";
import { BaseObject } from "@/core/models/core/baseObject";
import { TileLayerData } from "@/core/schema/tilemapSchema";

export class DefaultTileLayer extends BaseObject implements ITilelayer {
    public id: string;
    protected name: string;

    public tiles: DefaultTileData[][] = [];

    public layerClass: string;
    public coordinate: { x: number, y: number } = { x: 0, y: 0 };
    public offset: { x: number, y: number } = { x: 0, y: 0 };
    public size: { width: number, height: number } = { width: 0, height: 0 }
    public opacity: number = 1;
    public visible: boolean = true;
    public locked: boolean = false;

    public static event = {
        ...BaseObject.event,
        TileChanged: "TileChanged"
    }

    constructor(tileLayerData: TileLayerData) {
        super();
        this.id = tileLayerData.id;
        this.name = tileLayerData.name;
        this.coordinate.x = tileLayerData.x ?? 0;
        this.coordinate.y = tileLayerData.y ?? 0;
        this.size.width = tileLayerData.width;
        this.size.height = tileLayerData.height;
        this.opacity = tileLayerData.opacity ?? 1;
        this.visible = tileLayerData.visible != 0 ? true : false;
        this.locked = tileLayerData.locked != 0 ? true : false;
        this.offset.x = tileLayerData.offsetx ?? 0;
        this.offset.y = tileLayerData.offsety ?? 0;

        if (tileLayerData.data.encoding === "csv") {
            const total = this.size.width * this.size.height;

            const raw = tileLayerData.data["#text"] ?? "";
            const flat: number[] = raw.split(",").map(v => v.trim()).filter(v => v.length > 0).map(v => {
                const n = Number(v);
                return Number.isFinite(n) ? n : 0;
            });

            if (flat.length < total) {
                flat.push(...Array(total - flat.length).fill(0));
            }
            const gids = flat.slice(0, total);
            this.tiles = Array.from({ length: this.size.width }, () => new Array<DefaultTileData>(this.size.height));
            for (let y = 0; y < this.size.height; y++) {
                for (let x = 0; x < this.size.width; x++) {
                    const i = y * this.size.width + x;
                    const gid = gids[i] ?? 0;
                    const tile = new DefaultTileData({ x, y }, gid);
                    this.tiles[x][y] = tile;
                }
            }
        }
    }

    public getName(): string {
        return this.name;
    }

    public async rename(name: string): Promise<Result> {
        this.name = name;
        this.emit(BaseObject.event.UpdateProperty);
        return { status: "Success" };
    }

    public getTileAt(position: { x: number, y: number }): DefaultTileData | null {
        if (!this.tiles[position.x]) return null;
        if (!this.tiles[position.x][position.y]) return null;
        return this.tiles[position.x][position.y];
    }

    public async setTileAt(coordinate: { x: number, y: number }, id: number): Promise<Result> {
        const result = this.tiles[coordinate.x][coordinate.y].setId(id);
        if (result.status === ResultStatus.Success) {
            this.emit("TileChanged", { x: coordinate.x, y: coordinate.y });
            return result;
        }
        return { status: ResultStatus.Cancel };
    }
}

export class DefaultTileData {
    private id: number;
    private coordinate: { x: number, y: number };

    constructor(coordinate: { x: number, y: number }, id: number) {
        this.coordinate = coordinate;
        this.id = id;
    }

    public getCoordinate(): { x: number, y: number } {
        return this.coordinate;
    }
    public getId(): number {
        return this.id;
    }
    public setId(id: number): Result {
        this.id = id;
        return { status: ResultStatus.Success };
    }
}