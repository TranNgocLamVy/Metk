import { Color, Sprite, Texture } from "pixi.js";

import { Tilemap } from "@/core/application/tile/tilemap";

import { BaseLayerRenderer } from "./baseLayerRenderer";
import { AppCore } from "@/core/appcore";
import { RuleLayer } from "../tile/layer/ruleLayer";

type CreateRuleLayerRendererContext = {
    layer: RuleLayer;
    tilemap: Tilemap;
    gap: number;
}

export class RuleLayerRenderer extends BaseLayerRenderer<RuleLayer> {
    private sprites: Map<string, Sprite> = new Map(); // Id -> Sprite

    private bindOnTileChanged: (x: number, y: number) => void

    constructor(context: CreateRuleLayerRendererContext) {
        super(context.layer, context.tilemap);
        this.gap = context.gap;

        this.bindOnTileChanged = this.onTileChanged.bind(this);

        // Initial render
        this.renderLayer();
        this.layer.eventEmitter.on("rulesetRefOutputChanged", this.bindOnTileChanged);
    }

    private renderLayer(): void {
        const { width, height } = this.layer.size;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                this.renderTile(x, y);
            }
        }
    }

    private onTileChanged(x: number, y: number) {
        this.renderTile(x, y);
    };

    private async renderTile(x: number, y: number): Promise<void> {
        const rulesetRef = this.layer.getRulesetRefAt({ col: x, row: y });
        const key = `${x},${y}`;
        let currentSprite = this.sprites.get(key);
        if (!rulesetRef) {
            if (currentSprite) {
                currentSprite.destroy();
                this.container.removeChild(currentSprite);
                this.sprites.delete(key);
            }
            return;
        }
        if (!currentSprite) {
            currentSprite = new Sprite();
            this.container.addChild(currentSprite);
            this.sprites.set(key, currentSprite);
        }

        const posX = (x + this.layer.coordinate.col) * (this.tilemap.tilewidth + this.gap) + this.layer.offset.x;
        const posY = (y + this.layer.coordinate.row) * (this.tilemap.tileheight + this.gap) + this.layer.offset.y;

        const textureManager = AppCore.getIns().editorContext.textureManager;
        const output = rulesetRef.output;

        if (output != undefined) {
            const texture = textureManager.getTileTexture(output.tilesetId, output.tileId);
            // TODO: Handle unfound tileset, render error texture
            if (!texture) return;
            currentSprite.texture = texture;
            currentSprite.tint = 0xFFFFFF;
            currentSprite.width = this.tilemap.tilewidth;
            currentSprite.height = this.tilemap.tileheight;
            currentSprite.x = posX;
            currentSprite.y = posY;
        } else {
            // create a texture with ruleset color
            const ruleset = this.layer.rulesetRefManager.rulesetManager.getRulesetById(rulesetRef.rulesetId);
            if (!ruleset) return;
            const color = new Color(ruleset.color);
            currentSprite.texture = Texture.WHITE;
            currentSprite.tint = color;

            currentSprite.width = this.tilemap.tilewidth;
            currentSprite.height = this.tilemap.tileheight;

            currentSprite.x = posX;
            currentSprite.y = posY;
        }
    }

    public override setGap(gap: number): void {
        super.setGap(gap);
        this.renderLayer();
    }

    public override destroy(): void {
        this.layer.eventEmitter.off("rulesetRefOutputChanged", this.bindOnTileChanged);
        super.destroy();
        this.sprites.clear();
    }
}