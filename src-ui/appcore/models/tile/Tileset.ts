import { Texture } from "pixi.js";

import { BaseObject } from "@/appcore/core/BaseObject";
import { Result } from "@/appcore/interface/common/result";
import { ITile, ITileset, TileEvent, TilesetEvent } from "@/appcore/interface/tile/ITileset";
import { TextureUtils } from "@/appcore/utils/TextureUtils";

const tileTextureFinalizer = new FinalizationRegistry((texture: Texture) => {
    texture.destroy();
});

// interface ITileset {
//     tilesetId: number;
//     tilesetName: string;
//     tileWidth: number;
//     tileHeight: number;
//     tileCount: number;
//     tileColumns: number;
//     tileRows: number;
//     image: {
//         path: string;
//         texture: Texture;
//     }
//     tiles: BaseTile[];

//     getTile(id: number): BaseTile | null;
//     destroy(): void;
// }


export abstract class BaseTileset extends BaseObject<TilesetEvent> implements ITileset {
    public name: string;
    public tiles: BaseTile[];

    public getName(): string {
        return this.name;
    }

    public setName(name: string): Result {
        this.name = name;
        this.emit("Renamed", name);
        return { status: "Success" };
    }

    abstract getTile(id: number): BaseTile | null;

    // constructor(data: TilesetData) {
    //     super();

    //     const { tilesetName, tilesetId, tileWidth, tileHeight, image } = data;
    //     this.tilesetId = tilesetId;
    //     this.tilesetName = tilesetName;
    //     this.tileWidth = tileWidth;
    //     this.tileHeight = tileHeight;
    //     this.image = image;  

    //     const sliceTile = TextureUtils.sliceTexture(this.image.texture, this.tileWidth, this.tileHeight);

    //     this.tileCount = sliceTile.length;
    //     this.tileColumns = Math.ceil(Math.sqrt(this.tileCount));
    //     this.tileRows = Math.ceil(this.tileCount / this.tileColumns);

    //     this.tiles = sliceTile.map((texture, index) => {
    //         return new BaseTile({
    //             id: index + 1,
    //             Class: "BaseTile",
    //             tileWidth: this.tileWidth,
    //             tileHeight: this.tileHeight,
    //             texture: texture
    //         });
    //     });

    //     tileTextureFinalizer.register(this, this.image.texture);
    // }

    // public getTile(id: number): BaseTile | null{
    //     if (id < 1 || id > this.tileCount) {
    //         return null;
    //     }
    //     return this.tiles[id - 1];
    // }

    // public destroy(): void {
    //     tileTextureFinalizer.unregister(this);
    //     this.image.texture.destroy();
    // }
}

// interface ITile {
//     id: number;
//     Class: string;
//     tileWidth: number;
//     tileHeight: number;
//     texture: Texture;

//     destroy(): void;
// }

// type TileData = Pick<ITile, "id" | "Class" | "tileWidth" | "tileHeight" | "texture">;

export abstract class BaseTile extends BaseObject<TileEvent> implements ITile {
    // public id: number;
    // public Class: string;
    // public tileWidth: number;
    // public tileHeight: number; 
    // public texture: Texture;

    // constructor(data: TileData) {
    //     super();
    //     const { id, Class, tileWidth, tileHeight, texture } = data;
    //     this.id = id;
    //     this.Class = Class;
    //     this.tileWidth = tileWidth;
    //     this.tileHeight = tileHeight;
    //     this.texture = texture;

    //     tileTextureFinalizer.register(this, this.texture);
    // }

    // destroy(): void {
    //     tileTextureFinalizer.unregister(this);
    //     this.texture.destroy();
    // }

    abstract getTexutre(): Texture;
}