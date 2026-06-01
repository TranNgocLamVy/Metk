import { exists, readFile } from "@tauri-apps/plugin-fs";
import { Sprite, Texture, TilingSprite } from "pixi.js";

import { appKernel } from "@/application/bootstrap/app-kernel";
import { ImageLayer } from "@/editor/model/tilemap/layer/image-layer";
import { Tilemap } from "@/editor/model/tilemap/tilemap";
import { TextureUtils } from "@/shared/utils/texture.utils";

import { Viewport } from "pixi-viewport";
import { BaseLayerRenderer } from "./base-layer.renderer";

type CreateImageLayerRendererContext = {
    layer: ImageLayer;
    tilemap: Tilemap;
    viewport: Viewport;
};

export class ImageLayerRenderer extends BaseLayerRenderer<ImageLayer> {
    private viewport: Viewport;
    private image: Sprite | TilingSprite | null = null;
    private texture: Texture | null = null;
    
    private bindOnViewportChanged: () => void;

    constructor(context: CreateImageLayerRendererContext) {
        super(context.layer, context.tilemap);

        this.viewport = context.viewport;
        
        this.bindOnViewportChanged = this.updateViewTransform.bind(this);

        this.layer.eventEmitter.on("imageChanged", this.bindOnViewportChanged);
        this.viewport.on("moved", this.bindOnViewportChanged);
        this.viewport.on("zoomed", this.bindOnViewportChanged);
        this.viewport.on("resize", this.bindOnViewportChanged);

        this.renderLayer();
    }

    private async renderLayer(): Promise<void> {
        const texture = await this.getTexture();
        if (!texture) return;

        this.image?.destroy();

        if (this.layer.repeatX || this.layer.repeatY) {
            this.image = new TilingSprite({ texture });
        } else {
            this.image = new Sprite(texture);
        }

        this.container.addChild(this.image);
        this.updateViewTransform();
    }

    private async getTexture(): Promise<Texture | null> {
        const imageAbsPath = this.tilemap.tilemapPathSystem.getAbsPathFromRelPath(this.layer.imageSource.source);

        const imageExists = await exists(imageAbsPath);

        let texture: Texture | null = null;
        if (!imageExists) {
            texture = await appKernel.textureManager.getErrorTexture();
        } else {
            const fileBuffer = await readFile(imageAbsPath);
            texture = await TextureUtils.processTexture(fileBuffer);
        }
        return texture;
    }

    private updateViewTransform(): void {
        if (!this.image) return;

        const parallaxX = this.layer.parallax.x ?? 1;
        const parallaxY = this.layer.parallax.y ?? 1;

        const parallaxOriginX = (this.tilemap as any).parallaxoriginx ?? 0;
        const parallaxOriginY = (this.tilemap as any).parallaxoriginy ?? 0;

        const viewCenterX = this.viewport.center.x;
        const viewCenterY = this.viewport.center.y;

        this.container.x = (viewCenterX - parallaxOriginX) * (1 - parallaxX);
        this.container.y = (viewCenterY - parallaxOriginY) * (1 - parallaxY);

        const offsetX = this.layer.offset.x;
        const offsetY = this.layer.offset.y;

        if (this.image instanceof TilingSprite) {
            const left = this.viewport.left - this.container.x;
            const top = this.viewport.top - this.container.y;
            const right = this.viewport.right - this.container.x;
            const bottom = this.viewport.bottom - this.container.y;

            const textureWidth = this.image.texture.width;
            const textureHeight = this.image.texture.height;

            const startX = this.layer.repeatX
                ? offsetX + Math.floor((left - offsetX) / textureWidth) * textureWidth
                : offsetX;

            const startY = this.layer.repeatY
                ? offsetY + Math.floor((top - offsetY) / textureHeight) * textureHeight
                : offsetY;

            const endX = this.layer.repeatX
                ? right
                : offsetX + textureWidth;

            const endY = this.layer.repeatY
                ? bottom
                : offsetY + textureHeight;

            this.image.x = startX;
            this.image.y = startY;
            this.image.width = Math.max(textureWidth, endX - startX);
            this.image.height = Math.max(textureHeight, endY - startY);

            this.image.tilePosition.set(0, 0);
        } else {
            this.image.x = offsetX;
            this.image.y = offsetY;
        }
    }

    protected override updateProperties(): void {
        super.updateProperties();

        if (!this.image) return;

        this.image.x = this.layer.offset.x;
        this.image.y = this.layer.offset.y;

        this.applyTint();
    }

    private applyTint(): void {
        if (!this.image) return;

        const tint = parseTintColor(this.layer.tintcolor);

        if (tint == null) {
            this.image.tint = 0xffffff;
            return;
        }

        this.image.tint = tint;
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
        this.viewport.off("moved", this.bindOnViewportChanged);
        this.viewport.off("zoomed", this.bindOnViewportChanged);
        this.viewport.off("resize", this.bindOnViewportChanged);

        this.image?.destroy();
        this.image = null;

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