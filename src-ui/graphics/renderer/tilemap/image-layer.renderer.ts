import { Sprite, Texture, TilingSprite } from "pixi.js";

import { appKernel } from "@/application/bootstrap/app-kernel";
import { SETTING_KEYS } from "@/application/settings/setting.enum";
import { ImageLayer } from "@/editor/model/tilemap/layer/image-layer";
import { Tilemap } from "@/editor/model/tilemap/tilemap";
import { FileSystemService } from "@/infrastructure/container";
import { TextureUtils } from "@/shared/utils/texture.utils";

import { Viewport } from "pixi-viewport";
import { BaseLayerRenderer, LayerPropertyUpdate } from "./base-layer.renderer";

type CreateImageLayerRendererContext = {
    layer: ImageLayer;
    tilemap: Tilemap;
    viewport: Viewport;
};

export class ImageLayerRenderer extends BaseLayerRenderer<ImageLayer> {
    private viewport: Viewport;
    private image: Sprite | TilingSprite | null = null;
    private texture: Texture | null = null;
    private ownsTexture = false;
    private renderGeneration = 0;
    private isDestroyed = false;
    private suppressNextImageChanged = false;
    private enableParallax = true;
    private disposable: (() => void)[] = [];

    private handleImageChanged = (): void => {
        if (this.suppressNextImageChanged) {
            this.suppressNextImageChanged = false;
            return;
        }

        void this.renderImage();
    };

    private handleViewportChanged = (): void => {
        this.updateTransform();
    };

    constructor(context: CreateImageLayerRendererContext) {
        super(context.layer, context.tilemap);

        this.viewport = context.viewport;
        const settings = appKernel.settings;
        if (settings) {
            this.enableParallax = settings.get(SETTING_KEYS.View.EnableParallax);
        }

        this.layer.eventEmitter.on("imageChanged", this.handleImageChanged);
        this.viewport.on("moved", this.handleViewportChanged);
        this.viewport.on("zoomed", this.handleViewportChanged);
        this.viewport.on("resize", this.handleViewportChanged);

        if (settings) {
            const onEnableParallaxChanged = settings.onDidChangeSetting(SETTING_KEYS.View.EnableParallax, (event) => {
                this.enableParallax = event.newValue;
                this.updateTransform();
            });
            this.disposable.push(onEnableParallaxChanged);
        }

        void this.renderImage();
    }

    private async renderImage(): Promise<void> {
        const generation = ++this.renderGeneration;
        const textureResult = await this.getTexture();

        if (
            this.isDestroyed
            || generation !== this.renderGeneration
        ) {
            if (textureResult?.owned) textureResult.texture.destroy(true);
            return;
        }

        this.clearImage();

        if (!textureResult) return;

        const { texture, owned } = textureResult;

        if (this.layer.repeatX || this.layer.repeatY) {
            this.image = new TilingSprite({ texture });
        } else {
            this.image = new Sprite(texture);
        }

        this.texture = texture;
        this.ownsTexture = owned;
        this.container.addChild(this.image);
        this.updateTransform();
        this.applyTint();
    }

    private async getTexture(): Promise<{ texture: Texture; owned: boolean } | null> {
        const imageAbsPath = this.tilemap.tilemapPathSystem.getAbsPathFromRelPath(this.layer.imageSource.source);

        try {
            const imageExists = await FileSystemService.exists(imageAbsPath);

            if (!imageExists) {
                return {
                    texture: await appKernel.textureManager.getErrorTexture(),
                    owned: false,
                };
            }

            const fileBuffer = await FileSystemService.readFile(imageAbsPath);
            return {
                texture: await TextureUtils.processTexture(fileBuffer),
                owned: true,
            };
        } catch {
            return {
                texture: await appKernel.textureManager.getErrorTexture(),
                owned: false,
            };
        }
    }

    private updateTransform(): void {
        if (!this.image) return;

        const parallaxX = this.enableParallax ? this.layer.parallax.x ?? 1 : 1;
        const parallaxY = this.enableParallax ? this.layer.parallax.y ?? 1 : 1;

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

    protected override updateProperties(update?: LayerPropertyUpdate): void {
        super.updateProperties(update);

        switch (update?.key) {
            case "imageSource":
            case "repeatX":
            case "repeatY":
                this.suppressNextImageChanged = true;
                void this.renderImage();
                break;
            case "parallax":
            case "tintcolor":
                this.suppressNextImageChanged = true;
                break;
        }

        if (!this.image) return;

        this.updateTransform();
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

    public override posToCoord(pos: Point2D): Coordinate {
        return {
            col: Math.floor((pos.x - this.layer.offset.x) / this.tilemap.tileWidth),
            row: Math.floor((pos.y - this.layer.offset.y) / this.tilemap.tileHeight),
        };
    }

    public override coordToPos(coord: Coordinate): Point2D {
        return {
            x: coord.col * this.tilemap.tileWidth + this.layer.offset.x,
            y: coord.row * this.tilemap.tileHeight + this.layer.offset.y,
        };
    }

    public override destroy(): void {
        this.isDestroyed = true;
        this.renderGeneration++;

        this.layer.eventEmitter.off("imageChanged", this.handleImageChanged);
        this.viewport.off("moved", this.handleViewportChanged);
        this.viewport.off("zoomed", this.handleViewportChanged);
        this.viewport.off("resize", this.handleViewportChanged);
        this.disposable.forEach(d => d());

        this.clearImage();

        super.destroy();
    }

    private clearImage(): void {
        this.image?.parent?.removeChild(this.image);
        this.image?.destroy();
        this.image = null;

        if (this.texture && this.ownsTexture) {
            this.texture.destroy(true);
        }

        this.texture = null;
        this.ownsTexture = false;
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
