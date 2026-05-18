import { Color, Sprite, Texture } from "pixi.js";

import { Tilemap } from "@/editor/model/tilemap/tilemap";
import { BaseLayerRenderer } from "./base-layer.renderer";
import { appKernel } from "@/application/bootstrap/app-kernel";
import { RuleLayer } from "@/editor/model/tilemap/layer/rule-layer";

type CreateRuleLayerRendererContext = {
    layer: RuleLayer;
    tilemap: Tilemap;
}

export class RuleLayerRenderer extends BaseLayerRenderer<RuleLayer> {
    private sprites: Map<string, Sprite> = new Map(); // Id -> Sprite
    private bindOnRulesetUpdated: (rulesetId: string) => void;
    private bindOnTilesChanged: (coordinates: Coordinate[]) => void
    private bindOnTextureReloaded: (tilesetId: string) => void;
    constructor(context: CreateRuleLayerRendererContext) {
        super(context.layer, context.tilemap);

        this.bindOnTilesChanged = this.onTilesChanged.bind(this);
        this.bindOnTextureReloaded = this.onTextureReloaded.bind(this);
        this.bindOnRulesetUpdated = this.onRulesetUpdated.bind(this);

        this.layer.eventEmitter.on("rulesetRefsOutputChanged", this.bindOnTilesChanged);
        appKernel.textureManager.on("onTextureReloaded", this.bindOnTextureReloaded);
        this.layer.rulesetRefManager.rulesetManager.on("onRulesetUpdated", this.bindOnRulesetUpdated);

        this.layer.reCalculateAllOutputs();
        this.renderLayer();
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

        const drawPotision = this.coordToPos({ col: x, row: y});
        currentSprite.x = drawPotision.x;
        currentSprite.y = drawPotision.y;

        // TODO: Get textureManager from passing context
        const textureManager = appKernel.editorContext.textureManager;

        const output = rulesetRef.output;
        const outputTexture = output ? textureManager.getTileTexture(output.tilesetId, output.tileId) : null;
        const ruleset = this.layer.rulesetRefManager.rulesetManager.getRulesetById(rulesetRef.rulesetId);

        if (!output && ruleset) {
            currentSprite.texture = Texture.WHITE;
            currentSprite.tint = ruleset ? new Color(ruleset.color) : 0xFF0000;
            currentSprite.width = this.tilemap.tilewidth;
            currentSprite.height = this.tilemap.tileheight;
        } else if (outputTexture && ruleset) {
            currentSprite.texture = outputTexture;
            currentSprite.tint = 0xFFFFFF; // Clear tint to show natural texture colors
            currentSprite.width = outputTexture.width;
            currentSprite.height = outputTexture.height;
        } else {
            const errorTexture = await textureManager.getErrorTexture();
            currentSprite.texture = errorTexture;
            currentSprite.tint = 0xFFFFFF;
            currentSprite.width = this.tilemap.tilewidth;
            currentSprite.height = this.tilemap.tileheight;
        }
    }

    private onRulesetUpdated(rulesetId: string) {
        if (this.tilemap.rulesetRefManager.serialize().refs.map(r => r.id).includes(rulesetId)) {
            this.layer.reCalculateAllOutputs();
            this.renderLayer();
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
        this.layer.eventEmitter.off("rulesetRefsOutputChanged", this.bindOnTilesChanged);
        appKernel.textureManager.off("onTextureReloaded", this.bindOnTextureReloaded);
        this.layer.rulesetRefManager.rulesetManager.off("onRulesetUpdated", this.bindOnRulesetUpdated);
        this.sprites.forEach(s => s.destroy());
        this.sprites.clear();
    }
}