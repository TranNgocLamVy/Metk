import { Viewport } from "pixi-viewport";
import { Application } from "pixi.js";
import { v4 as uuidv4 } from "uuid";

import { EventBus } from "@/appcore/core/EventBus";
import { TextureUtils } from "@/appcore/utils/TextureUtils";

import { CommandManager } from "../command/CommandManager";
import { TilemapRenderer } from "../renderer/TilemapRenderer";
import { BaseTilelayer } from "../tile/Tilelayer";
import { BaseTilemap } from "../tile/Tilemap";
import { BaseTileset } from "../tile/Tileset";

export class TilemapSession {
    public readonly id: string;
    private readonly eventBus: EventBus;
    private readonly commandManager: CommandManager;
    private tilemap: BaseTilemap;
    private tilemapRenderer: TilemapRenderer;
    private pixiApp: Application;
    private viewport: Viewport;

    constructor(options: Exclude<TilemapSession, "state">) {
        this.id = uuidv4();
        this.eventBus = options.eventBus;
        this.commandManager = options.commandManager;
        this.tilemap = options.tilemap;
        // this.tilemapRenderer = new TilemapRenderer(this.tilemap, options.container);
    }

    public serialize(): any {
        // TODO: Serialize tilemap session
    }

    public async initPixiApplication(pixiApp: Application) {
        this.pixiApp = pixiApp;

        this.viewport = new Viewport({
            screenWidth: this.pixiApp.screen.width,
            screenHeight: this.pixiApp.screen.height,
            worldWidth: this.pixiApp.screen.width,
            worldHeight: this.pixiApp.screen.height,
            passiveWheel: true,
            stopPropagation: true,
            allowPreserveDragOutside: true,
            events: this.pixiApp.renderer.events,
        })

        this.viewport.drag({ mouseButtons: "middle" }).wheel().decelerate({ friction: 0 });
        this.pixiApp.stage.addChild(this.viewport);

        await this.initRenderer();
    }

    async initRenderer() {
        const imagePath = "C:\\Users\\Tran Ngoc Lam Vy\\Desktop\\Project\\AutoTile\\tilemaps\\json\\Grass.png"
        const imageTexture = await TextureUtils.loadTextureFromFile(imagePath);
        const tileset = new BaseTileset({
            tilesetName: "Grass",
            tilesetId: 1,
            tileWidth: 16,
            tileHeight: 16,
            image: {
                path: imagePath,
                texture: imageTexture
            }
        })
        const tilelayer = new BaseTilelayer({
            layerName: "Tile Layer 1",
            layerId: "1",
            width: 64,
            height: 64,
            layerData: Array(64).fill(0).map(() => Array(64).fill(0).map(() => ({ tileId: 2, tilesetId: 1 })))
        })
        const tilemap = new BaseTilemap({
            orientation: "orthogonal",
            renderOrder: "right-down",
            tileWidth: 16,
            tileHeight: 16,
            width: 64,
            height: 64,
            infinite: false,
            nextLayerId: 2,
            nextObjectId: 1,
            tilesets: [tileset],
            layers: [tilelayer]
        })
        this.tilemapRenderer = new TilemapRenderer(tilemap, this.viewport);
    }
}