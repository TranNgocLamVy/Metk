import { Color, Sprite, Texture } from "pixi.js";

import { Tilemap } from "@/core/application/tile/tilemap";
import { BaseLayerRenderer } from "./baseLayerRenderer";
import { AppCore } from "@/core/appcore";
import { RuleLayer } from "../tile/layer/ruleLayer";

type CreateRuleLayerRendererContext = {
    layer: RuleLayer;
    tilemap: Tilemap;
}

export class RuleLayerRenderer extends BaseLayerRenderer<RuleLayer> {
    private sprites: Map<string, Sprite> = new Map(); // Id -> Sprite
    private bindOnTilesChanged: (coordinates: Coordinate[]) => void

    constructor(context: CreateRuleLayerRendererContext) {
        super(context.layer, context.tilemap);

        this.bindOnTilesChanged = this.onTilesChanged.bind(this);

        this.renderLayer();
        this.layer.eventEmitter.on("rulesetRefsOutputChanged", this.bindOnTilesChanged);
    }

    private renderLayer(): void {
        const { width, height } = this.layer.size;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                this.renderTile(x, y);
            }
        }
    }

    private onTilesChanged(coordinates: Coordinate[]) {
        coordinates.forEach(coord => this.renderTile(coord.col, coord.row));
    };

    private async renderTile(x: number, y: number): Promise<void> {
        const rulesetRef = this.layer.getRulesetRefAt({ col: x, row: y });
        const key = `${x},${y}`;
        let currentSprite = this.sprites.get(key);

        if (!rulesetRef) {
            if (currentSprite) {
                currentSprite.destroy();
                this.sprites.delete(key);
            }
            return;
        }

        if (!currentSprite) {
            currentSprite = new Sprite();
            this.container.addChild(currentSprite);
            this.sprites.set(key, currentSprite);
        }

        const coord = { col: x + this.layer.coordinate.col, row: y + this.layer.coordinate.row };
        const drawPotision = this.layer.coordToPos(coord);

        currentSprite.width = this.tilemap.tilewidth;
        currentSprite.height = this.tilemap.tileheight;
        currentSprite.x = drawPotision.x;
        currentSprite.y = drawPotision.y;

        const textureManager = AppCore.getIns().editorContext.textureManager;
        const output = rulesetRef.output;
        
        let hasRenderedTexture = false;

        if (output != undefined) {
            const texture = textureManager.getTileTexture(output.tilesetId, output.tileId);
            if (texture) {
                currentSprite.texture = texture;
                currentSprite.tint = 0xFFFFFF; // Clear tint to show natural texture colors
                hasRenderedTexture = true;
            }
        }
        
        // Fallback to ruleset color if output is unresolved or texture is missing
        if (!hasRenderedTexture) {
            const ruleset = this.layer.rulesetRefManager.rulesetManager.getRulesetById(rulesetRef.rulesetId);
            currentSprite.texture = Texture.WHITE;
            currentSprite.tint = ruleset ? new Color(ruleset.color) : 0xFF0000;
        }
    }

    public override destroy(): void {
        this.layer.eventEmitter.off("rulesetRefsOutputChanged", this.bindOnTilesChanged);
        super.destroy();

        this.sprites.forEach(s => s.destroy());
        this.sprites.clear();
    }
}