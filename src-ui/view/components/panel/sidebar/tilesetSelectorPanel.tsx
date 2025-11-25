import { IDockviewPanelProps, PanelDimensionChangeEvent } from "dockview";
import { Viewport } from "pixi-viewport";
import { Application } from "pixi.js";
import { FC, useEffect, useRef } from "react";

import { DefaultTilesetRenderer } from "@/core/default/renderer/defaultTilesetRenderer";
import { DefaultTileset } from "@/core/default/tile/defaultTileset";

import { BasePanel } from "../basePanel";

type CreateTilesetSelectorDockOptions = {
	tileset: DefaultTileset;
};

export class TilesetSelectorPanel extends BasePanel {
	public id: string;
	public title: string;
	private pixiApp: Application;
	private tileset: DefaultTileset;
	private viewport: Viewport;
	private tilesetRenderer: DefaultTilesetRenderer;
	public component: FC<IDockviewPanelProps>;
	private containerDiv: HTMLDivElement;

	constructor(options: CreateTilesetSelectorDockOptions) {
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
			const containerRef = useRef<HTMLDivElement>(null);

			useEffect(() => {
				let timeout: ReturnType<typeof setTimeout>;
				const disposable = props.api.onDidDimensionsChange((event: PanelDimensionChangeEvent) => {
					clearTimeout(timeout);
					timeout = setTimeout(() => {
						if (!containerRef.current || !self.pixiApp.renderer) return;
						const w = containerRef.current.clientWidth + 400;
						const h = containerRef.current.clientHeight;
						self.pixiApp.renderer.resize(w, h);
					});
				});

				return () => {
					clearTimeout(timeout);
					disposable.dispose();
				};
			}, [props.api]);

			useEffect(() => {
                const init = async () => {
                    if (!containerRef.current) return;
                    await self.initialize();
                    self.setContainer(containerRef.current);
                }
                init();

                return () => {
                    self.uninitialize();
                }
            }, [containerRef.current]);

			return (
				<div className="bg-background w-full h-full overflow-hidden p-y-2">
					<div ref={containerRef} className="relative bg-black/40 rounded-lg w-full h-full border-2">
					</div>
					<div className="absolute inset-0 pointer-events-none z-20">
						<div className="absolute inset-0 rounded-lg border-y-8 border-background" />
					</div>
				</div>
			);
		};
	}

	private async initialize(): Promise<void> {
		this.pixiApp = new Application();
		await this.pixiApp.init({
			autoStart: true,
			sharedTicker: true,
			backgroundAlpha: 0,
		});

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

		this.tilesetRenderer = new DefaultTilesetRenderer({ tileset: this.tileset });
		this.tilesetRenderer.initRenderer(this.viewport);
	}

	private setContainer(container: HTMLDivElement): void {
		this.containerDiv = container;
		container.appendChild(this.pixiApp.canvas);
		const w = container.clientWidth;
		const h = container.clientHeight;
		this.pixiApp.renderer.resize(w, h);
	}

	public uninitialize(): void {
		this.pixiApp.destroy();
	}
}
