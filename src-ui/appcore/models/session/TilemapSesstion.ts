import { Viewport } from "pixi-viewport";
import { Application } from "pixi.js";
import { v4 as uuidv4 } from "uuid";

import { DefaultTilemapRenderer } from "@/appcore/default/renderer/defaultTilemapRenderer";
import { DefaultTilemap } from "@/appcore/default/tile/defaultTilemap";

export class TilemapSession {
    public id: string;
    private pixiApp: Application;
    private tilemap: DefaultTilemap;
    private tilemapRenderer: DefaultTilemapRenderer;
    private resizeObserver: ResizeObserver;

    constructor(tilemap: DefaultTilemap) {
        this.id = uuidv4();
        this.tilemap = tilemap;
    }

    public static createTilemapSession(tilemap: DefaultTilemap): Promise<TilemapSession> {
        return new Promise(async (resolve) => {
            const tilemapSession = new TilemapSession(tilemap);
            await tilemapSession.initializeSession();
            resolve(tilemapSession);
        });
    }

    private async initializeSession(): Promise<void> {
        this.tilemapRenderer = new DefaultTilemapRenderer({ tilemap: this.tilemap });
        this.pixiApp = new Application();
        await this.pixiApp.init({
            backgroundAlpha: 0,
            sharedTicker: true,
            autoStart: true,
        })

        const viewport = new Viewport({
            screenWidth: this.pixiApp.screen.width,
            screenHeight: this.pixiApp.screen.height,
            worldWidth: this.pixiApp.screen.width,
            worldHeight: this.pixiApp.screen.height,
            passiveWheel: true,
            stopPropagation: true,
            allowPreserveDragOutside: true,
            events: this.pixiApp.renderer.events,
        });
        viewport.drag({ mouseButtons: "middle" }).wheel().decelerate({ friction: 0 });
        viewport.eventMode = "static";
        viewport.hitArea = this.pixiApp.screen;
        this.pixiApp.stage.addChild(viewport);

        this.tilemapRenderer.initRenderer(viewport);
    }

    public uninitalizeSession(): void {
        
    }

    public setContainer(container: HTMLElement): void {
        container.appendChild(this.pixiApp.canvas);
        this.resize(container);
        this.resizeObserver = new ResizeObserver(() => {
            this.resize(container);
        });
        this.resizeObserver.observe(container);
    }

    private resize(container: HTMLElement) {
        const width = container.clientWidth;
        const height = container.clientHeight;
        this.pixiApp.renderer.resize(width, height);
    }
}