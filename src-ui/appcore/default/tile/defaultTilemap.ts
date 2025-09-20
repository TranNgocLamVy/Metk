import { type } from "arktype";
import { XMLParser } from "fast-xml-parser";
import { v4 as uuidv4 } from "uuid";

import { Result, ResultStatus } from "@/appcore/interface/common/result";
import { ITilemap } from "@/appcore/interface/tile/ITilemap";
import { BaseObject } from "@/appcore/models/core/BaseObject";
import { TilesetManager } from "@/appcore/models/manager/TilesetManager";
import { ExternalTileset, TilemapData, TilemapSchema } from "@/appcore/schemas/tilemapSchema";
import { TilesetData } from "@/appcore/schemas/tilesetSchema";
import { TextureUtils } from "@/appcore/utils/TextureUtils";
import { join } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-fs";

import { DefaultTileLayer } from "./defaultTilelayer";
import { DefaultTile, DefaultTileset } from "./defaultTileset";

export type CreateTilemapContext = {
    tilesetManager: TilesetManager,
}

export class DefaultTilemap extends BaseObject implements ITilemap {
    public metaData: {
        basePath: string,
    }
    private context: CreateTilemapContext;

    public id: string;
    protected name: string;
    public static event = {
        ...BaseObject.event,
        TilelayerAdded: "TilelayerAdded",
        TilelayerRemoved: "TilelayerRemoved",
        TilelayerReordered: "TilelayerReordered",
    }
    public getName(): string {
        return this.name;
    }
    public async rename(name: string): Promise<Result> {
        this.name = name;
        this.emit(BaseObject.event.UpdateProperty);
        return { status: ResultStatus.Success };
    }

    public version: string;
    public orientation: "orthogonal" | "isometric" = "orthogonal";
    public renderorder: "right-down" | "right-up" | "left-down" | "left-up" = "right-down";
    public infinite: boolean;
    public backgroundcolor: string;
    public compressionlevel: number;

    public width: number;
    public height: number;
    public tilewidth: number;
    public tileheight: number;

    public nextlayerid: number;
    public nextobjectid: number;

    // For hexagonal maps (Unused at the moment)
    public hexsidelength: number;
    public staggeraxis: any;
    public staggerindex: any;
    public parallaxoriginx: number;
    public parallaxoriginy: number;

    public tilesets: {
        type: "external" | "internal",
        tileset: DefaultTileset,
    }[] = [];

    public tilelayers: DefaultTileLayer[] = [];

    constructor(filePath: string, tilemapData: TilemapData, context: CreateTilemapContext) {
        super();
        this.context = context;

        const basePath = filePath.split("\\").slice(0, -1).join("\\");
        this.metaData = { basePath };

        const name = filePath.split("\\").slice(-1)[0].split(".")[0];
        this.id = uuidv4();
        this.name = name;
        this.version = tilemapData.version ?? "1.0";
        this.orientation = tilemapData.orientation;
        this.renderorder = tilemapData.renderorder;
        this.infinite = tilemapData.infinite != 0 ? true : false;
        this.compressionlevel = tilemapData.compressionlevel ?? -1;
        this.backgroundcolor = tilemapData.backgroundcolor ?? "#AARRGGBB";

        this.width = tilemapData.width;
        this.height = tilemapData.height;
        this.tilewidth = tilemapData.tilewidth;
        this.tileheight = tilemapData.tileheight;

        this.nextlayerid = tilemapData.nextlayerid ?? 1;
        this.nextobjectid = tilemapData.nextobjectid ?? 1;

        // For hexagonal maps (Unused at the moment)
        this.hexsidelength = tilemapData.hexsidelength ?? 0;
        this.staggeraxis = tilemapData.staggeraxis;
        this.staggerindex = tilemapData.staggerindex;
        this.parallaxoriginx = tilemapData.parallaxoriginx ?? 0;
        this.parallaxoriginy = tilemapData.parallaxoriginy ?? 0;
    }

    public async loadAssets(tilesets: any[], tilelayers: any[]): Promise<Result> {
        await this.loadTileset(this.metaData.basePath, tilesets);
        await this.loadTilelayer(tilelayers);
        return { status: ResultStatus.Success };
    }

    public async loadTileset(basePath: string, tilesets: any[]): Promise<Result> {
        for (const tilesetData of tilesets) {
            if (tilesetData instanceof type.errors) {
                console.error(tilesetData.summary)
                continue;
            }
            if ((tilesetData as ExternalTileset).source) {
                const externalTilesetData = tilesetData as ExternalTileset;
                const tilesetFullPath = await join(basePath, externalTilesetData.source);
                const tileset = await this.context.tilesetManager.getTileset(tilesetFullPath);
                if (!tileset) continue;
                this.tilesets.push({ type: "external", tileset: (tileset as DefaultTileset) });
                continue;
            }
            const internalTilesetData = tilesetData as TilesetData;
            const textureFilePath = await join(basePath, internalTilesetData.image.source);
            const texture = await TextureUtils.loadTextureFromPath(textureFilePath);
            const tileset = new DefaultTileset(internalTilesetData, texture);
            this.tilesets.push({ type: "internal", tileset });
        }
        return { status: ResultStatus.Success };
    }

    public async loadTilelayer(tilelayers: any[]): Promise<Result> {
        for (const tilelayerData of tilelayers) {
            if (tilelayerData instanceof type.errors) {
                console.error(tilelayerData.summary)
                continue;
            }
            const tilelayer = new DefaultTileLayer(tilelayerData);
            this.tilelayers.push(tilelayer);
        }
        return { status: ResultStatus.Success };
    }

    public async addTilelayer(): Promise<Result> {
        this.emit(DefaultTilemap.event.TilelayerAdded);
        return { status: "Success" };
    }

    public async removeTilelayer(id: string): Promise<Result> {
        this.emit(DefaultTilemap.event.TilelayerRemoved);
        return { status: "Success" };
    }

    public async reorderTilelayer(id: string, newIndex: number): Promise<Result> {
        if (newIndex < 0 || newIndex >= this.tilelayers.length) {
            return { status: "Error", message: "Invalid index" };
        }
        const tilelayerIndex = this.tilelayers.findIndex(tilelayer => tilelayer.id === id);
        if (tilelayerIndex === -1) {
            return { status: "Error", message: "Tilelayer not found" };
        }
        const targetIndex = Math.max(0, Math.min(newIndex, this.tilelayers.length - 1));
        const [tilelayer] = this.tilelayers.splice(tilelayerIndex, 1);
        this.tilelayers.splice(targetIndex, 0, tilelayer);
        this.emit(DefaultTilemap.event.TilelayerReordered, {
            id,
            oldIndex: tilelayerIndex,
            newIndex: targetIndex,
        });

        return { status: "Success" };
    }


    public async getTilesetTileById(id: number): Promise<DefaultTile | null> {
        if (id == 0) return null;
        let i = 0;
        for (const tileset of this.tilesets) {
            const tilesetCount = tileset.tileset.getTileCount();
            if (id - i < tilesetCount) {
                return tileset.tileset.getTile(id - i - 1);
            }
            i += tilesetCount;
        }
        return null;
    }

    public static async createTileMap(): Promise<DefaultTilemap | null> {
        return null;
    }

    public static async loadTilemap(filePath: string, context: CreateTilemapContext): Promise<DefaultTilemap | null> {
        const file = await open(filePath);
        const stat = await file.stat();
        const buf = new Uint8Array(stat.size);
        await file.read(buf);
        const text = new TextDecoder().decode(buf);
        await file.close();

        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "",
            allowBooleanAttributes: true,
            preserveOrder: false,
        });

        let json = parser.parse(text);

        const parseJSON = TilemapSchema(json);

        if (parseJSON instanceof type.errors) {
            console.error(parseJSON.summary)
            return null;
        }

        const newTilemap = new DefaultTilemap(filePath, parseJSON.map, context);
        await newTilemap.loadAssets(parseJSON.map.tileset, parseJSON.map.layer);

        return newTilemap;
    }
}