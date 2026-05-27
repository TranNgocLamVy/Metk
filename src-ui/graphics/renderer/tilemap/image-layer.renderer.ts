import { exists, readFile } from "@tauri-apps/plugin-fs";
import { Sprite, Texture, TilingSprite } from "pixi.js";

import { appKernel } from "@/application/bootstrap/app-kernel";
import { ImageLayer } from "@/editor/model/tilemap/layer/image-layer";
import { Tilemap } from "@/editor/model/tilemap/tilemap";
import { TextureUtils } from "@/shared/utils/texture.utils";

import { BaseLayerRenderer } from "./base-layer.renderer";

type CreateImageLayerRendererContext = {
    layer: ImageLayer;
    tilemap: Tilemap;
};

export class ImageLayerRenderer extends BaseLayerRenderer<ImageLayer> {
    private imageSprite: Sprite | TilingSprite | null = null;
    private texture: Texture | null = null;

    private bindOnImageChanged: () => void;

    constructor(context: CreateImageLayerRendererContext) {
        super(context.layer, context.tilemap);

        this.bindOnImageChanged = this.renderImage.bind(this);
        this.layer.eventEmitter.on("imageChanged", this.bindOnImageChanged);

        void this.renderImage();
    }

    private async renderImage(): Promise<void> {
        this.imageSprite?.destroy();
        this.imageSprite = null;

        if (this.texture) {
            this.texture.destroy(true);
            this.texture = null;
        }

        if (!this.layer.imageSource) return;

        const imageAbsPath = this.tilemap.tilemapPathSystem.getAbsPathFromRelPath(this.layer.imageSource.source);

        const imageExists = await exists(imageAbsPath);

        if (!imageExists) {
            this.texture = await appKernel.textureManager.getErrorTexture();
        } else {
            const fileBuffer = await readFile(imageAbsPath);
            this.texture = await TextureUtils.processTexture(fileBuffer);
        }

        if (this.layer.repeatX || this.layer.repeatY) {
            const width = this.layer.repeatX
                ? this.tilemap.width * this.tilemap.tilewidth
                : this.layer.imageSource.width;

            const height = this.layer.repeatY
                ? this.tilemap.height * this.tilemap.tileheight
                : this.layer.imageSource.height;

            this.imageSprite = new TilingSprite({
                texture: this.texture,
                width,
                height,
            });
        } else {
            this.imageSprite = new Sprite(this.texture);
            this.imageSprite.width = this.layer.imageSource.width;
            this.imageSprite.height = this.layer.imageSource.height;
        }

        this.imageSprite.x = this.layer.offset.x;
        this.imageSprite.y = this.layer.offset.y;

        this.applyTint();

        this.container.addChild(this.imageSprite);
        this.updateProperties();
    }

    protected override updateProperties(): void {
        super.updateProperties();

        if (!this.imageSprite) return;

        this.imageSprite.x = this.layer.offset.x;
        this.imageSprite.y = this.layer.offset.y;

        this.applyTint();
    }

    private applyTint(): void {
        if (!this.imageSprite) return;

        const tint = parseTintColor(this.layer.tintcolor);

        if (tint == null) {
            this.imageSprite.tint = 0xffffff;
            return;
        }

        this.imageSprite.tint = tint;
    }

    public override posToCoord(pos: Position): Coordinate {
        return {
            col: Math.floor((pos.x - this.layer.offset.x) / this.tilemap.tilewidth),
            row: Math.floor((pos.y - this.layer.offset.y) / this.tilemap.tileheight),
        };
    }

    public override coordToPos(coord: Coordinate): Position {
        return {
            x: coord.col * this.tilemap.tilewidth + this.layer.offset.x,
            y: coord.row * this.tilemap.tileheight + this.layer.offset.y,
        };
    }

    public override destroy(): void {
        this.layer.eventEmitter.off("imageChanged", this.bindOnImageChanged);

        this.imageSprite?.destroy();
        this.imageSprite = null;

        if (this.texture) {
            this.texture.destroy(true);
            this.texture = null;
        }

        super.destroy();
    }
}

function parseTintColor(value: string): number | null {
    const normalized = value.trim();

    if (!normalized) return null;

    const hex = normalized.startsWith("#")
        ? normalized.slice(1)
        : normalized;

    if (hex.length === 8) {
        return Number.parseInt(hex.slice(2), 16);
    }

    if (hex.length === 6) {
        return Number.parseInt(hex, 16);
    }

    return null;
}