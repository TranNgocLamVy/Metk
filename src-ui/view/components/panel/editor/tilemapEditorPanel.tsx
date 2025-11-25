import { IDockviewPanelProps, PanelDimensionChangeEvent } from "dockview";
import { Viewport } from "pixi-viewport";
import { Application } from "pixi.js";
import { FC, useEffect, useRef } from "react";

import { DefaultTilemapRenderer } from "@/core/default/renderer/defaultTilemapRenderer";
import { DefaultTilemap } from "@/core/default/tile/defaultTilemap";
import { useSidebarDockStore } from "@/view/stores/dock/sidebarDockStore";
import { useTilesetSelectorDockStore } from "@/view/stores/dock/tilesetSelectorDockStore";
import { Application as PixiApplication } from "@pixi/react";

import { BasePanel } from "../basePanel";
import { TilelayerControllerPanel } from "../sidebar/tilelayerControllerPanel";
import { TilesetSelectorPanel } from "../sidebar/tilesetSelectorPanel";

type CreateTilemapEditorDockOptions = {
	tilemap: DefaultTilemap;
};

export class TilemapEditorPanel extends BasePanel {
	public id: string;
	public title: string;
	private pixiApp: Application;
	private tilemap: DefaultTilemap;
	private viewport: Viewport;
	private tilemapRenderer: DefaultTilemapRenderer;
	public component: FC<IDockviewPanelProps>;
    private tilelayerControllerPanel: TilelayerControllerPanel | null;
	constructor(options: CreateTilemapEditorDockOptions) {
		super();
		const tilemap = options.tilemap;
		this.tilemap = tilemap;
		this.id = tilemap.id;
		this.title = tilemap.getName();
		this.component = this.initComponent();
	}

	private initComponent(): React.FC<IDockviewPanelProps> {
		const self = this;
		return function Component(props: IDockviewPanelProps) {
			const containerRef = useRef<HTMLDivElement>(null);

			useEffect(() => {
				let timeout: ReturnType<typeof setTimeout>;
				const disposable = props.api.onDidDimensionsChange((event: PanelDimensionChangeEvent) => {
					clearTimeout(timeout);
					timeout = setTimeout(() => {
						if (!containerRef.current) return;
						const w = containerRef.current.clientWidth + 400;
						const h = containerRef.current.clientHeight;
						self.pixiApp.renderer.resize(w, h);
					});
				});

				return () => {
					clearTimeout(timeout);
					disposable.dispose();
					self.uninitialize();
				};
			}, [props.api]);

			const onInit = (app: Application) => {
				if (!containerRef.current) return;
				const w = containerRef.current.clientWidth;
				const h = containerRef.current.clientHeight;
				app.renderer.resize(w, h);
				self.initialize(app);
			};

			return (
				<div className="bg-background w-full h-full overflow-hidden py-2">
					<div ref={containerRef} className="relative bg-black/40 rounded-lg w-full h-full border-2">
						<PixiApplication onInit={onInit} autoStart sharedTicker backgroundAlpha={0} className="absolute inset-0 z-0" />
					</div>
					<div className="absolute inset-0 pointer-events-none z-20">
						<div className="absolute inset-0 rounded-lg border-y-8 border-background" />
					</div>
				</div>
			);
		};
	}

	private async initialize(pixiApp: Application): Promise<void> {
		this.tilemapRenderer = new DefaultTilemapRenderer({ tilemap: this.tilemap });
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

		this.tilemapRenderer.initRenderer(this.viewport);

        const tilemapPanels = this.tilemap.tilesets.map((tileset) => {
            const panel = new TilesetSelectorPanel({ tileset: tileset.tileset });
            return panel;
		});

        useTilesetSelectorDockStore.getState().openTilesetSelectorPanels(tilemapPanels);

        if (!this.tilelayerControllerPanel) {
            const tilelayerControllerPanel = new TilelayerControllerPanel({ tilemap: this.tilemap });
            useSidebarDockStore.getState().openTilelayerControllerPanel(tilelayerControllerPanel);
            this.tilelayerControllerPanel = tilelayerControllerPanel;
        } else {
            useSidebarDockStore.getState().openTilelayerControllerPanel(this.tilelayerControllerPanel);
        }
	}

	public uninitialize(): void {
		this.pixiApp.destroy();
	}
}
