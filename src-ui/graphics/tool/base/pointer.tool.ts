import { EditorFacade } from "@/application/editor.facade";
import { ITool } from "@/editor/interface/tool.interface";
import { BaseLayerRenderer } from "@/graphics/renderer/tilemap/base-layer.renderer";
import { TilemapView } from "@/graphics/view/tilemap.view";
import { Container, FederatedPointerEvent, Point } from "pixi.js";

export abstract class PointerTool implements ITool {
    protected currentView: TilemapView | null = null;
    protected overlayContainer: Container | null = null;
    protected targetLayerRenderer: BaseLayerRenderer | null = null;

    private readonly bindPointerOnDown: (event: FederatedPointerEvent) => void;
    private readonly bindPointerOnMove: (event: FederatedPointerEvent) => void;
    private readonly bindPointerOnUp: (event: FederatedPointerEvent) => void;
    private readonly bindPointerOutside: (event: FederatedPointerEvent) => void;

    constructor(protected readonly editorFacade: EditorFacade) {
        this.bindPointerOnDown = this.onPointerDown.bind(this);
        this.bindPointerOnMove = this.onPointerMove.bind(this);
        this.bindPointerOnUp = this.onPointerUp.bind(this);
        this.bindPointerOutside = this.onPointerOutside.bind(this);
    }

    public onEnable(): void { }

    public onDisable(): void { }

    public attachView(view: TilemapView): void {
        this.currentView = view;
        this.overlayContainer = view.overlayerContainer;
        this.bindPointerEvents(view);
    }

    public detach(): void {
        if (!this.currentView) return;

        this.unbindPointerEvents(this.currentView);
        this.currentView = null;
        this.overlayContainer = null;
        this.targetLayerRenderer = null;
    }

    public setTargetLayerRenderer(layerRenderer: BaseLayerRenderer | null): void {
        this.targetLayerRenderer = layerRenderer;
    }

    protected getLocalPos(e: FederatedPointerEvent): Point2D {
        const localPosition = this.currentView!.viewport.toLocal(new Point(e.global.x, e.global.y));
        return { x: localPosition.x, y: localPosition.y };
    }

    protected onPointerDown(e: FederatedPointerEvent): void { }

    protected onPointerMove(e: FederatedPointerEvent): void { }

    protected onPointerUp(e: FederatedPointerEvent): void { }

    protected onPointerOutside(e: FederatedPointerEvent): void { }

    private bindPointerEvents(view: TilemapView): void {
        const viewport = view.viewport;
        viewport.on("pointerdown", this.bindPointerOnDown);
        viewport.on("pointermove", this.bindPointerOnMove);
        viewport.on("pointerup", this.bindPointerOnUp);
        viewport.on("pointerupoutside", this.bindPointerOnUp);
        viewport.addEventListener("mouseleave", this.bindPointerOutside);
    }

    private unbindPointerEvents(view: TilemapView): void {
        const viewport = view.viewport;
        viewport.off("pointerdown", this.bindPointerOnDown);
        viewport.off("pointermove", this.bindPointerOnMove);
        viewport.off("pointerup", this.bindPointerOnUp);
        viewport.off("pointerupoutside", this.bindPointerOnUp);
        viewport.removeEventListener("mouseleave", this.bindPointerOutside);
    }
}

