import { Container, FederatedPointerEvent, Point, Sprite } from "pixi.js";
import { IDrawStrategy, DrawPayload } from "./drawStrategy/IDrawStrategy";
import { ITool } from "@/core/interface/ITool";
import { EditorContext } from "@/core/application/editorContext";
import { Tool } from "@/core/decorator/tool";

import icon from "@/assets/icons/ruler.svg?raw";
import { GeometryUtils } from "@/shared/utils/geometryUtils";
import { TilemapView } from "../application/view/tilemapView";
import { BaseLayerRenderer } from "../application/renderer/baseLayerRenderer";

@Tool({
    id: "tool.line",
    label: "workspace.tool.line.label",
    displayOnToolbar: {
        icon: icon,
        tooltip: "workspace.tool.line.description",
        index: 1,
    },
    shortcuts: ["L"],
    when: "inWorkspace && !isModalOpen",
})
export class LineTool implements ITool {
    private activeDrawStrategy: IDrawStrategy | null = null;

    private currentView: TilemapView | null = null;

    private overlayContainer: Container | null = null;

    private startMousePosition: Position = null!;
    private previousMousePosition: Position = null!;
    private currentMousePosition: Position = null!;
    private isDragging: boolean = false;

    private hoverSprites: Sprite[] = [];
    private drawPayloads: Map<string, DrawPayload> = new Map();

    private targetLayerRenderer: BaseLayerRenderer | null = null;

    private bindPointerOnDown: (event: FederatedPointerEvent) => void;
    private bindPointerOnMove: (event: FederatedPointerEvent) => void;
    private bindPointerOnUp: (event: FederatedPointerEvent) => void;
    private bindPointerOutside: (event: FederatedPointerEvent) => void;

    constructor(private readonly editorContext: EditorContext) {
        this.bindPointerOnDown = this.onPointerDown.bind(this);
        this.bindPointerOnMove = this.onPointerMove.bind(this);
        this.bindPointerOnUp = this.onPointerUp.bind(this);
        this.bindPointerOutside = this.onPointerOutside.bind(this);
    }

    public onEnable(): void {
        this.drawPayloads = new Map<string, DrawPayload>();
    }

    public onDisable(): void {
        this.clearDrawPreview();
        this.clearHoverPreview();

        this.isDragging = false;
        this.startMousePosition = null!;
        this.previousMousePosition = null!;
        this.currentMousePosition = null!;
        this.targetLayerRenderer = null;
    }

    public attachView(view: TilemapView): void {
        this.currentView = view;

        const viewport = this.currentView.viewport;
        this.overlayContainer = this.currentView.overlayerContainer;

        viewport.on("pointerdown", this.bindPointerOnDown);
        viewport.on("pointermove", this.bindPointerOnMove);
        viewport.on("pointerup", this.bindPointerOnUp);
        viewport.on("pointerupoutside", this.bindPointerOnUp);
        viewport.addEventListener("mouseleave", this.bindPointerOutside);
    }

    public detach(): void {
        if (!this.currentView || !this.currentView) return;
        const viewport = this.currentView.viewport;

        viewport.off("pointerdown", this.bindPointerOnDown);
        viewport.off("pointermove", this.bindPointerOnMove);
        viewport.off("pointerup", this.bindPointerOnUp);
        viewport.off("pointerupoutside", this.bindPointerOnUp);
        viewport.removeEventListener("mouseleave", this.bindPointerOutside);

        this.currentView = null;

        this.overlayContainer = null;

        this.clearHoverPreview();

        this.clearDrawPreview();

        this.isDragging = false;
        this.startMousePosition = null!;
        this.previousMousePosition = null!;
        this.currentMousePosition = null!;
        this.targetLayerRenderer = null;
    }

    public setDrawStrategy(strategy: IDrawStrategy | null): void {
        this.activeDrawStrategy = strategy;
    }

    public setTargetLayerRenderer(layerRenderer: BaseLayerRenderer | null): void {
        this.targetLayerRenderer = layerRenderer;
    }

    private onPointerDown(e: FederatedPointerEvent): void {
        if (!this.currentView || e.button !== 0 || !this.targetLayerRenderer || !this.activeDrawStrategy) return;

        this.isDragging = true;
        this.startMousePosition = this.currentMousePosition = this.previousMousePosition = this.getLocalPos(e);
        this.updateDrawPayload();
    }

    private onPointerMove(e: FederatedPointerEvent): void {
        if (!this.currentView || !this.activeDrawStrategy || !this.targetLayerRenderer) return;

        const newMousePosition = this.getLocalPos(e);
        this.previousMousePosition = { ...this.currentMousePosition };
        this.currentMousePosition = newMousePosition;

        if (this.activeDrawStrategy.comparePosition(this.previousMousePosition, newMousePosition, this.targetLayerRenderer)) return;

        this.clearDrawPreview();

        if (!this.isDragging) {
            this.drawHoverPreview(newMousePosition);
        } else {   
            this.updateDrawPayload();
        }
    }

    private onPointerUp(e: FederatedPointerEvent): void {
        if (!this.currentView || !this.isDragging) return;

        const historyManager = this.editorContext.getCurrentHistoryManager();

        if (historyManager && this.activeDrawStrategy && this.targetLayerRenderer && this.drawPayloads.size > 0) {
            this.activeDrawStrategy.commit(this.targetLayerRenderer, Array.from(this.drawPayloads.values()), this.editorContext);
        }

        this.clearDrawPreview();
        this.isDragging = false;
        this.startMousePosition = null!;
        this.currentMousePosition = null!;
    }

    private onPointerOutside(e: FederatedPointerEvent) {
        if (!this.isDragging) this.clearHoverPreview();
        this.clearDrawPreview();
    }

    private drawHoverPreview(pos: Position): void {
        this.clearHoverPreview();

        if (!this.currentView || !this.overlayContainer || !this.targetLayerRenderer) return;

        if (this.activeDrawStrategy) {
            this.hoverSprites = this.activeDrawStrategy.drawHoverPreview(pos, this.targetLayerRenderer, this.editorContext, this.currentView.session, this.overlayContainer);
        }
    }

    private updateDrawPayload(): void {
        this.clearDrawPreview();

        if (!this.activeDrawStrategy || !this.currentView || !this.overlayContainer || !this.startMousePosition || !this.currentMousePosition) return;

        const startCoord = this.targetLayerRenderer!.posToCoord(this.startMousePosition);
        const endCoord = this.targetLayerRenderer!.posToCoord(this.currentMousePosition);
        
        const drawCoordinates = GeometryUtils.calculateLine(startCoord, endCoord);

        const drawPositions = drawCoordinates.map(c => this.targetLayerRenderer!.coordToPos(c));

        drawPositions.forEach((drawPosition) => {
            const drawPayloads = this.activeDrawStrategy!.getPayload(drawPosition, this.targetLayerRenderer!, this.editorContext, this.currentView!.session);
            if (drawPayloads.length <= 0) return;
            drawPayloads.forEach((drawPayload) => {
                if (this.drawPayloads.has(drawPayload.key)) this.drawPayloads.get(drawPayload.key)!.sprite.destroy();
                this.overlayContainer!.addChild(drawPayload.sprite);
                this.drawPayloads.set(drawPayload.key, drawPayload);
            });
        });
    }

    private getLocalPos(e: FederatedPointerEvent): Position {
        const localPosition = this.currentView!.viewport.toLocal(new Point(e.global.x, e.global.y));
        return { x: localPosition.x, y: localPosition.y };
    }

    private clearDrawPreview(): void {
        this.drawPayloads.forEach((data) => data.sprite.destroy());
        this.drawPayloads.clear();
    }

    private clearHoverPreview() {
        this.hoverSprites.forEach(sprite => sprite.destroy());
        this.hoverSprites = [];
    }
}