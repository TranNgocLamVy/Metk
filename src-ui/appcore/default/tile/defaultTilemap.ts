import { type } from "arktype";
import { XMLParser } from "fast-xml-parser";

import { Result, ResultStatus } from "@/appcore/interface/common/result";
import { BaseTilemap } from "@/appcore/models/tile/Tilemap";
import { ExternalTileset, TilemapData, TilemapSchema, UnionTilesetData } from "@/appcore/schemas/tilemapSchema";
import { TilesetData } from "@/appcore/schemas/tilesetSchema";
import { TextureUtils } from "@/appcore/utils/TextureUtils";
import { join } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-fs";

import { DefaultTileLayer } from "./defaultTilelayer";
import { DefaultTileset } from "./defaultTileset";

export class DefaultTilemap extends BaseTilemap {
    public metaData: {
        basePath: string,
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

    private tilesets : {
        type: "external" | "internal",
        tileset: DefaultTileset,
    }[] = [];

    private tilelayers: DefaultTileLayer[] = [];

    public static event = {
        ...BaseTilemap.event,
    }

    constructor(filePath: string, tilemapData: TilemapData) {
        super();

        const basePath = filePath.split("\\").slice(0, -1).join("\\");
        this.metaData = { basePath };

        const name = filePath.split("\\").slice(-1)[0].split(".")[0];
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

        this.loadAssets(tilemapData.tileset, tilemapData.layer);
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
                // TODO: Load external tileset
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
        this.emit(BaseTilemap.event.TilelayerAdded);
        return { status: "Success" };
    }

    public async removeTilelayer(id: string): Promise<Result> {
        this.emit(BaseTilemap.event.TilelayerRemoved);
        return { status: "Success" };
    }

    public async reorderTilelayer(id: string, newIndex: number): Promise<Result> {
        this.emit(BaseTilemap.event.TilelayerReordered);
        return { status: "Success" };
    }

    public static async createTileMap(): Promise<DefaultTilemap | null> {
        return null;
    }

    public static async loadTilemap(filePath: string): Promise<DefaultTilemap | null> {
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

        const newTilemap = new DefaultTilemap(filePath, parseJSON.map);

        return newTilemap;
    }
}