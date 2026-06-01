import { Sprite } from "pixi.js";

import { TileLayer } from "@/editor/model/tilemap/layer/tile-layer";
import { Tilemap } from "@/editor/model/tilemap/tilemap";

import { appKernel } from "@/application/bootstrap/app-kernel";
import { Viewport } from "pixi-viewport";
import { BaseLayerRenderer } from "./base-layer.renderer";

type CreateTileLayerRendererContext = {
    layer: TileLayer;
    tilemap: Tilemap;
    viewport: Viewport;
}

export class TileLayerRenderer extends BaseLayerRenderer<TileLayer> {
    private sprites: Map<string, Sprite> = new Map(); // key: `${col},${row}` -> Sprite

    private bindOnTilesChanged: (coords: Coordinate[]) => void;
    private bindOnTextureReloaded: (tilesetId: string) => void;

    constructor(editorFacade: CreateTileLayerRendererContext) {
        super(editorFacade.layer, editorFacade.tilemap);

        this.bindOnTilesChanged = this.onTilesChanged.bind(this);
        this.bindOnTextureReloaded = this.onTextureReloaded.bind(this);
        this.layer.eventEmitter.on("tilesChanged", this.bindOnTilesChanged)
        appKernel.textureManager.on("onTextureReloaded", this.bindOnTextureReloaded);
        
        this.renderLayer();
    }

    private renderLayer(): void {
        const { width, height } = this.layer.size;
        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                this.renderTile(col, row);
            }
        }
    }

    private onTilesChanged(coordinates: Coordinate[]) {
        for (const coordinate of coordinates) {
            this.renderTile(coordinate.col, coordinate.row);
        }
    }

    private async renderTile(col: number, row: number): Promise<void> {
        const tileRef = this.layer.getTileRefAt({ col: col, row: row });
        const key = `${col},${row}`;
        let currentSprite = this.sprites.get(key);
        if (!tileRef) {
            if (!currentSprite) return;
            currentSprite.destroy();
            this.sprites.delete(key);
            return;
        }

        if (!currentSprite) {
            currentSprite = new Sprite();
            this.container.addChild(currentSprite);
            this.sprites.set(key, currentSprite);
        }

        const drawPosition = this.coordToPos({ col, row });
        currentSprite.x = drawPosition.x;
        currentSprite.y = drawPosition.y;
        
        // TODO: Get textureManager from passing editorFacade
        const textureManager = appKernel.editorFacade.textureManager;
        const texture = textureManager.getTileTexture(tileRef.tilesetId, tileRef.tileId);
        
        if (!texture) {
            const errorTexture = await textureManager.getErrorTexture();
            currentSprite.texture = errorTexture;
            currentSprite.width = this.tilemap.tilewidth;
            currentSprite.height = this.tilemap.tileheight;
        } else {
            currentSprite.texture = texture;
            currentSprite.width = texture.width;
            currentSprite.height = texture.height;
        }
    }

    private onTextureReloaded(tilesetId: string) {
        const tilesetIds = this.tilemap.tilesetRefManager.serialize().refs.map(ref => ref.id);
        if (tilesetIds.includes(tilesetId)) {
            this.renderLayer();
        }
    }

    public override posToCoord(pos: Position): Coordinate {
        switch (this.tilemap.orientation) {
            case "orthogonal":
                const col = Math.floor((pos.x - this.layer.offset.x) / this.tilemap.tilewidth) - this.layer.coordinate.col;
                const row = Math.floor((pos.y - this.layer.offset.y) / this.tilemap.tileheight) - this.layer.coordinate.row;
                return { col, row };
            case "isometric":
                // TODO: Implement isometric
                return { col: 0, row: 0 };
            case "oblique":
                // TODO: Implement oblique
                return { col: 0, row: 0 };
            case "staggered":
                // TODO: Implement staggered
                return { col: 0, row: 0 };
            case "hexagonal":
                // TODO: Implement hexagonal
                return { col: 0, row: 0 };
        }
    }

    public override coordToPos(coord: Coordinate): Position {
        switch (this.tilemap.orientation) {
            case "orthogonal":
                const x = (coord.col + this.layer.coordinate.col) * this.tilemap.tilewidth + this.layer.offset.x;
                const y = (coord.row + this.layer.coordinate.row) * this.tilemap.tileheight + this.layer.offset.y;
                return { x, y };
            case "isometric":
                // TODO: Implement isometric
                return { x: 0, y: 0 };
            case "oblique":
                // TODO: Implement oblique
                return { x: 0, y: 0 };
            case "staggered":
                // TODO: Implement staggered
                return { x: 0, y: 0 };
            case "hexagonal":
                // TODO: Implement hexagonal
                return { x: 0, y: 0 };
        }
    }

    public override destroy(): void {
        super.destroy();
        this.layer.eventEmitter.off("tilesChanged", this.bindOnTilesChanged);
        appKernel.textureManager.off("onTextureReloaded", this.bindOnTextureReloaded);
        this.sprites.forEach(s => s.destroy());
        this.sprites.clear();

    }
}