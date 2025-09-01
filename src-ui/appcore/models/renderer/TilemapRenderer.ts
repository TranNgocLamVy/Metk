import { Container, Sprite } from "pixi.js";

import { BaseTilelayer, TileData } from "../tile/Tilelayer";
import { BaseTilemap } from "../tile/Tilemap";
import { BaseTileset } from "../tile/Tileset";

export class TilemapRenderer {
    private mainContainer: Container;
    private tilemap: BaseTilemap;
    private tilesets: BaseTileset[];
    private layers: LayerRenderer[];

    public currentTileset: BaseTileset;
    public currentLayer: BaseTilelayer;


    constructor(tilemap: BaseTilemap, container: Container) {
        this.tilemap = tilemap;
        this.mainContainer = container;

        this.tilesets = tilemap.tilesets;
        this.currentTileset = this.tilesets[0];

        this.layers = []
        tilemap.layers.forEach(layer => {
            const container = new Container();
            this.mainContainer.addChild(container);
            const sprites: any[] = []

            const layerData = layer.layerData;
            for (let y = 0; y < layer.height; y++) {
                for (let x = 0; x < layer.width; x++) {
                    const tileId = layerData[y][x].tileId;
                    const tilesetId = layerData[y][x].tilesetId;

                    const tileset = this.tilesets.find(tileset => tileset.tilesetId === tilesetId);
                    if (tileset) {
                        const tile = tileset.getTile(tileId);
                        const tileData = layer.getTile(x, y);
                        if (tile && tileData) {
                            const sprite = new Sprite(tile.texture);
                            sprite.x = x * this.tilemap.tileWidth;
                            sprite.y = y * this.tilemap.tileHeight;
                            container.addChild(sprite);
                            sprites.push({ tileData, sprite });
                        }
                    }
                }
            }
            this.layers.push({ container, layer, sprites });

            layer.on("tileChange", ({ x, y, tileId, tilesetId, layerId }) => {
                if (layerId === layer.layerId) {
                    const tileset = this.tilesets.find(tileset => tileset.tilesetId === tilesetId);
                    const layer = this.layers.find(layer => layer.layer.layerId === layerId);
                    if (tileset && layer) {
                        const tile = tileset.getTile(tileId);
                        const tileData = layer.layer.getTile(x, y);
                        if (tile && tileData) {
                            const sprite = layer.sprites.find(sprite => sprite.tileData.tileId === tileData.tileId && sprite.tileData.tilesetId === tileData.tilesetId);
                            if (sprite) {
                                console.log("set")
                                sprite.sprite.texture = tile.texture;
                            } else {
                                console.log("add")
                                const sprite = new Sprite(tile.texture);
                                sprite.x = x * this.tilemap.tileWidth;
                                sprite.y = y * this.tilemap.tileHeight;
                                layer.container.addChild(sprite);
                                layer.sprites.push({ tileData, sprite });
                            }
                        }
                    }
                }
            });
        });
        this.currentLayer = this.layers[0].layer;
        this.currentTileset = this.tilesets[0];

    }
}

type LayerRenderer = {
    container: Container;
    layer: BaseTilelayer;
    sprites: {
        tileData: TileData;
        sprite: Sprite;
    }[];
}