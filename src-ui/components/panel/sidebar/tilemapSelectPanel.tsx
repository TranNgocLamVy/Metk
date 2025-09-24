import { IDockviewPanelProps, PanelDimensionChangeEvent } from "dockview";
import { Viewport } from "pixi-viewport";
import { Application } from "pixi.js";
import { FC, useEffect } from "react";

import { DefaultTilesetRenderer } from "@/appcore/default/renderer/defaultTilesetRenderer";
import { DefaultTileset } from "@/appcore/default/tile/defaultTileset";
import { Application as PixiApplication } from "@pixi/react";

import { BasePanel } from "../basePanel";

type CreateTilesetSelectDockOptions = {
    tileset: DefaultTileset;
};

export class TilesetSelectPanel extends BasePanel {
    public id: string;
    public title: string;
    private pixiApp: Application;
    private tileset: DefaultTileset;
    private viewport: Viewport;
    private tilesetRenderer: DefaultTilesetRenderer;
    public component: FC<IDockviewPanelProps>;
    constructor(options: CreateTilesetSelectDockOptions) {
        super();
        const tileset = options.tileset;
        this.tileset = tileset;
        this.id = tileset.id;
        this.title = tileset.getName();
        this.component = this.initComponent();
    }

    private initComponent(): React.FC<IDockviewPanelProps> {
        const self = this;
        return function Component(props: IDockviewPanelProps) {
            useEffect(() => {
                let timeout: ReturnType<typeof setTimeout>;
                const disposable = props.api.onDidDimensionsChange((event: PanelDimensionChangeEvent) => {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => {
                        const w = props.api.width;
                        const h = props.api.height;
                        self.pixiApp.renderer.resize(w, h);
                    }, 100);
                });

                return () => {
                    clearTimeout(timeout);
                    disposable.dispose();
                    self.uninitialize();
                };
            }, [props.api]);

            const onInit = (app: Application) => {
                const w = props.api.width;
                const h = props.api.height;
                app.renderer.resize(w, h);
                self.initialize(app);
            };

            return <PixiApplication onInit={onInit} autoStart sharedTicker backgroundAlpha={0} className="bg-secondary-background" />;
        };
    }

    private async initialize(pixiApp: Application): Promise<void> {
        this.tilesetRenderer = new DefaultTilesetRenderer({ tileset: this.tileset });
        this.pixiApp = pixiApp;

        this.viewport = new Viewport({
            screenWidth: this.pixiApp.screen.width,
            screenHeight: this.pixiApp.screen.height,
            worldHeight: this.pixiApp.screen.height,

            passiveWheel: true,
            stopPropagation: true,
            allowPreserveDragOutside: true,
            events: this.pixiApp.renderer.events,
        });
        this.viewport.drag({ mouseButtons: "middle" }).wheel().decelerate({ friction: 0 });
        this.viewport.eventMode = "static";
        this.viewport.hitArea = this.pixiApp.screen;

        this.pixiApp.stage.addChild(this.viewport);
        this.pixiApp.renderer.on("resize", () => {
            const w = this.pixiApp.renderer.width;
            const h = this.pixiApp.renderer.height;
            this.viewport.resize(w, h);
        });

        this.tilesetRenderer.initRenderer(this.viewport);
    }

    public uninitialize(): void {
        this.pixiApp.destroy();
    }
}
