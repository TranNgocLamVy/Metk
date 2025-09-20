import { type } from "arktype";
import { XMLParser } from "fast-xml-parser";
import { Texture } from "pixi.js";
import { v4 as uuidv4 } from "uuid";

import { Result, ResultStatus } from "@/appcore/interface/common/result";
import { ITile, ITileset } from "@/appcore/interface/tile/ITileset";
import { BaseObject } from "@/appcore/models/core/baseObject";
import { TileData, TilesetData, tilesetSchema } from "@/appcore/schemas/tilesetSchema";
import { TextureUtils } from "@/appcore/utils/TextureUtils";
import { join } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-fs";

const tileTextureFinalizer = new FinalizationRegistry((texture: Texture) => {
    texture.destroy();
});

export class DefaultTileset extends BaseObject implements ITileset {
    public id: string;

    public name: string;
    public texture: Texture | null;
    public columns: number;
    public tilecount: number;
    public tilewidth: number;
    public tileheight: number;
    public version: string;
    public image?: {
        source: string;
        width: number;
        height: number;
    };
    public grid?: {
        orientation: "orthogonal" | "isometric";
        width: number;
        height: number;
    }
    public tiles: DefaultTile[] = [];

    constructor(tilesetData: TilesetData, texture: Texture | null) {
        super();
        this.id = uuidv4();
        this.texture = texture;
        this.name = tilesetData.name;
        this.columns = tilesetData.columns;
        this.tilecount = tilesetData.tilecount;
        this.tilewidth = tilesetData.tilewidth;
        this.tileheight = tilesetData.tileheight;
        this.version = tilesetData.version ?? "1.0";
        this.image = tilesetData.image;
        this.grid = tilesetData.grid;


        if (!this.texture) return;
        const tileTextureList = TextureUtils.sliceTexture(this.texture, this.tilewidth, this.tileheight);
        if (tilesetData.tile.length > 0) {
            this.tiles = tilesetData.tile.map(tileData => {
                const tileTexture = tileTextureList[tileData.id];
                return new DefaultTile(tileData, tileTexture);
            });
        } else {
            this.tiles = tileTextureList.map((texture, index) => {
                return new DefaultTile({ id: index }, texture);
            });
        }
    }

    public getName(): string {
        return this.name;
    }

    public async rename(name: string): Promise<Result> {
        this.name = name;
        this.emit(BaseObject.event.UpdateProperty);
        return { status: ResultStatus.Success };
    }

    getTile(id: number): DefaultTile | null {
        return this.tiles.find(tile => tile.id === id) || null;
    }

    public getTileCount(): number {
        return this.tiles.length;
    }

    public static async loadTileset(filePath: string): Promise<DefaultTileset | null> {
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

        const parseJSON = tilesetSchema(json);

        if (parseJSON instanceof type.errors) {
            console.error(parseJSON.summary)
            return null;
        }

        if (!parseJSON.tileset.image) {
            return new DefaultTileset(parseJSON.tileset, null);
        }

        const basePath = filePath.split("\\").slice(0, -1).join("\\");
        const imageSrc = parseJSON.tileset.image.source;
        const imageFullPath = await join(basePath, imageSrc);
        const texture = await TextureUtils.loadTextureFromPath(imageFullPath);

        return new DefaultTileset(parseJSON.tileset, texture);
    }
}

export class DefaultTile extends BaseObject implements ITile {
    public id: number;
    protected texture: Texture;

    constructor(tileData: TileData, texture: Texture) {
        super();
        this.id = tileData.id;
        this.texture = texture;
        tileTextureFinalizer.register(this, texture);
    }

    public getTexture(): Texture {
        return this.texture;
    }

    public destroy(): void {
        tileTextureFinalizer.unregister(this);
        this.texture.destroy();
    }
}