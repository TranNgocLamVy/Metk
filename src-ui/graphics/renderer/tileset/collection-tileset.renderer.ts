import { Container, Sprite, Texture } from "pixi.js";

import { appKernel } from "@/application/bootstrap/app-kernel";
import { Tileset } from "@/editor/model/tileset/tileset";

import { CollectionTilesetGridRenderer } from "./collection-tileset-grid.renderer";

export type CreateCollectionTilesetRendererContext = {
    tileset: Tileset;
    parent: Container;
    grid: CollectionTilesetGridRenderer;
};

export class CollectionTilesetRenderer {
    public readonly container: Container;

    private tileset: Tileset;
    private grid: CollectionTilesetGridRenderer;
    private sprites: Sprite[] = [];

    private bindOnTextureReloaded: (tilesetId: string) => void;
    private bindOnTilesetUpdate: () => void;

    constructor(context: CreateCollectionTilesetRendererContext) {
        this.tileset = context.tileset;
        this.grid = context.grid;

        this.container = new Container();
        this.container.position.set(0, 0);

        this.bindOnTextureReloaded = this.onTextureReloaded.bind(this);
        this.bindOnTilesetUpdate = this.rerenderTiles.bind(this);

        appKernel.textureManager.on(
            "onTextureReloaded",
            this.bindOnTextureReloaded,
        );

        this.tileset.eventEmitter.on("update", this.bindOnTilesetUpdate);

        this.renderTiles();
    }

    public async renderTiles(): Promise<void> {
        const textureManager = appKernel.editorFacade.textureManager;

        this.sprites.forEach((sprite) => sprite.destroy());
        this.sprites = [];

        this.container.removeChildren();

        let errorTexture: Texture | null = null;

        for (const layout of this.grid.getLayouts()) {
            let texture = textureManager.getTileTexture(
                this.tileset.id,
                layout.tile.id,
            );

            if (!texture) {
                if (!errorTexture) {
                    errorTexture = await textureManager.getErrorTexture();
                }

                texture = errorTexture;
            }

            const sprite = new Sprite(texture);

            sprite.position.set(layout.x, layout.y);
            sprite.width = layout.width;
            sprite.height = layout.height;
            sprite.zIndex = 0;

            this.sprites.push(sprite);
            this.container.addChild(sprite);
        }
    }

    public rerenderTiles(): void {
        this.grid.rerenderGrid();
        this.renderTiles();
    }

    private onTextureReloaded(tilesetId: string): void {
        if (tilesetId !== this.tileset.id) return;

        this.renderTiles();
    }

    public destroy(): void {
        appKernel.textureManager.off(
            "onTextureReloaded",
            this.bindOnTextureReloaded,
        );

        this.tileset.eventEmitter.off("update", this.bindOnTilesetUpdate);

        this.sprites.forEach((sprite) => sprite.destroy());
        this.sprites = [];

        this.container.destroy({ children: true });
    }
}