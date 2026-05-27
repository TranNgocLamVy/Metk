import { Application, Container, Sprite } from "pixi.js";

import { appKernel } from "@/application/bootstrap/app-kernel";
import { Tile, Tileset } from "@/editor/model/tileset/tileset";

type SelectedTileRenderOptions = {
    pixiApp: Application;
    tileset: Tileset;
    tile: Tile;
    width: number;
    height: number;
};

export function clearSelectedTileRenderer(pixiApp: Application) {
    pixiApp.stage.removeChildren();
}

export function renderSelectedTile(options: SelectedTileRenderOptions) {
    const renderer = new SelectedTilePixiRenderer(options);
    renderer.render();

    return () => renderer.destroy();
}

class SelectedTilePixiRenderer {
    private disposed = false;
    private root: Container | null = null;

    constructor(private readonly options: SelectedTileRenderOptions) {}

    public render() {
        const stage = this.options.pixiApp.stage;
        stage.removeChildren();

        this.root = new Container();
        stage.addChild(this.root);

        void this.renderTile(this.root);
    }

    public destroy() {
        this.disposed = true;
        this.options.pixiApp.stage.removeChildren();
        this.root?.destroy({ children: true });
    }

    private async renderTile(root: Container) {
        const textureManager = appKernel.editorFacade.textureManager;
        const { tileset, tile, width, height } = this.options;

        let texture = textureManager.getTileTexture(tileset.id, tile.id);

        if (!texture) {
            texture = await textureManager.getErrorTexture();
        }

        if (this.disposed) return;

        root.addChild(makeSelectedTileSprite({
            texture,
            tileSize: getTileNaturalSize(tileset, tile),
            width,
            height,
        }));
    }
}

function makeSelectedTileSprite({
    texture,
    tileSize,
    width,
    height,
}: {
    texture: Sprite["texture"];
    tileSize: { width: number; height: number };
    width: number;
    height: number;
}) {
    const padding = 24;
    const scale = Math.max(
        0.01,
        Math.min(
            (width - padding * 2) / tileSize.width,
            (height - padding * 2) / tileSize.height,
        ),
    );

    const sprite = new Sprite(texture);

    sprite.width = tileSize.width * scale;
    sprite.height = tileSize.height * scale;
    sprite.position.set(
        (width - sprite.width) / 2,
        (height - sprite.height) / 2,
    );

    return sprite;
}

function getTileNaturalSize(
    tileset: Tileset,
    tile: Tile,
): {
    width: number;
    height: number;
} {
    return {
        width: Math.max(1, tile.image?.width ?? tileset.tilewidth ?? 1),
        height: Math.max(1, tile.image?.height ?? tileset.tileheight ?? 1),
    };
}
