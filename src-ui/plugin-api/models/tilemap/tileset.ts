import { BaseObject } from '../base-object';
import { Texture } from 'pixi.js';
import { TextureUtils } from '@/appcore/utils/texture-utils';


const tileTextureFinalizer = new FinalizationRegistry((texture: Texture) => {
    texture.destroy();
});

interface TilesetEvent {

}

interface ITileset {
    tilesetId: number;
    tilesetName: string;
    tileWidth: number;
    tileHeight: number;
    tileCount: number;
    tileColumns: number;
    tileRows: number;
    image: {
        path: string;
        texture: Texture;
    }
    tiles: BaseTile[];

    getTile(id: number): BaseTile | null;
    destroy(): void;
}

type TilesetData = Pick<ITileset, "tilesetName" | "tilesetId" | "tileWidth" | "tileHeight" | "image">;

export class BaseTileset extends BaseObject<TilesetEvent> implements ITileset {
    public tilesetId: number;
    public tilesetName: string;
    public tileWidth: number;
    public tileHeight: number;
    public tileCount: number;
    public tileColumns: number;
    public tileRows: number;
    public image: {
        path: string;
        texture: Texture;
    }
    public tiles: BaseTile[];

    constructor(data: TilesetData) {
        super();

        const { tilesetName, tilesetId, tileWidth, tileHeight, image } = data;
        this.tilesetId = tilesetId;
        this.tilesetName = tilesetName;
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
        this.image = image;  

        const sliceTile = TextureUtils.sliceTexture(this.image.texture, this.tileWidth, this.tileHeight);

        this.tileCount = sliceTile.length;
        this.tileColumns = Math.ceil(Math.sqrt(this.tileCount));
        this.tileRows = Math.ceil(this.tileCount / this.tileColumns);

        this.tiles = sliceTile.map((texture, index) => {
            return new BaseTile({
                id: index + 1,
                Class: "BaseTile",
                tileWidth: this.tileWidth,
                tileHeight: this.tileHeight,
                texture: texture
            });
        });

        tileTextureFinalizer.register(this, this.image.texture);
    }

    public getTile(id: number): BaseTile | null{
        if (id < 1 || id > this.tileCount) {
            return null;
        }
        return this.tiles[id - 1];
    }

    public destroy(): void {
        tileTextureFinalizer.unregister(this);
        this.image.texture.destroy();
    }
}

interface TileEvent {

}

interface ITile {
    id: number;
    Class: string;
    tileWidth: number;
    tileHeight: number;
    texture: Texture;

    destroy(): void;
}

type TileData = Pick<ITile, "id" | "Class" | "tileWidth" | "tileHeight" | "texture">;

export class BaseTile extends BaseObject<TileEvent> implements ITile {
    public id: number;
    public Class: string;
    public tileWidth: number;
    public tileHeight: number; 
    public texture: Texture;

    constructor(data: TileData) {
        super();
        const { id, Class, tileWidth, tileHeight, texture } = data;
        this.id = id;
        this.Class = Class;
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
        this.texture = texture;

        tileTextureFinalizer.register(this, this.texture);
    }

    destroy(): void {
        tileTextureFinalizer.unregister(this);
        this.texture.destroy();
    }
}