import { Container, FederatedPointerEvent, Point, Sprite } from "pixi.js";
import { IDrawStrategy, DrawPayload } from "./drawStrategy/IDrawStrategy";
import { ITool } from "@/core/interface/ITool";
import { TilemapSession } from "@/core/application/session/tilemapSession";
import { DrawTileStrategy } from "./drawStrategy/drawTileStrategy";
import { DrawRuleStrategy } from "./drawStrategy/drawRuleStrategy";
import { EditorContext } from "@/core/application/editorContext";
import { Tool } from "@/core/decorator/tool";
import { BaseLayer } from "@/core/application/tile/layer/baseLayer";
import { GroupLayer } from "../application/tile/layer/groupLayer";

import icon from "@/assets/icons/ruler.svg?raw";
import { GeometryUtils } from "@/shared/utils/geometryUtils";
import { TilemapView } from "../application/view/tilemapView";

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
    private drawStrategys: IDrawStrategy[];
    private activeDrawStrategy: IDrawStrategy | null = null;

    private currentSession: TilemapSession | null = null;
    private currentView: TilemapView | null = null;

    private overlayContainer: Container | null = null;

    private startMousePosition: Position = null!;
    private previousMousePosition: Position = null!;
    private currentMousePosition: Position = null!;
    private isDragging: boolean = false;

    private hoverSprites: Sprite[] = [];
    private drawPayloads: Map<string, DrawPayload> = new Map();

    private targetLayer: BaseLayer<any> | null = null;

    private bindPointerOnDown: (event: FederatedPointerEvent) => void;
    private bindPointerOnMove: (event: FederatedPointerEvent) => void;
    private bindPointerOnUp: (event: FederatedPointerEvent) => void;
    private bindPointerOutside: (event: FederatedPointerEvent) => void;
    private bindOnSelectedLayersChanged: () => void;

    constructor(private readonly editorContext: EditorContext) {
        this.drawStrategys = [
            new DrawTileStrategy(),
            new DrawRuleStrategy()
        ];

        this.bindPointerOnDown = this.onPointerDown.bind(this);
        this.bindPointerOnMove = this.onPointerMove.bind(this);
        this.bindPointerOnUp = this.onPointerUp.bind(this);
        this.bindPointerOutside = this.onPointerOutside.bind(this);
        this.bindOnSelectedLayersChanged = this.updateActiveDrawStrategy.bind(this);
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
    }

    public attach(session: TilemapSession, view: TilemapView): void {
        this.currentSession = session;
        this.currentView = view;

        const viewport = this.currentView.viewport;
        this.overlayContainer = this.currentView.overlayerContainer;

        viewport.on("pointerdown", this.bindPointerOnDown);
        viewport.on("pointermove", this.bindPointerOnMove);
        viewport.on("pointerup", this.bindPointerOnUp);
        viewport.on("pointerupoutside", this.bindPointerOnUp);
        viewport.addEventListener("mouseleave", this.bindPointerOutside);

        this.updateActiveDrawStrategy();
        this.currentSession.on("onSelectedLayersChanged", this.bindOnSelectedLayersChanged);
    }

    public detach(): void {
        if (!this.currentSession || !this.currentView) return;
        const viewport = this.currentView.viewport;

        viewport.off("pointerdown", this.bindPointerOnDown);
        viewport.off("pointermove", this.bindPointerOnMove);
        viewport.off("pointerup", this.bindPointerOnUp);
        viewport.off("pointerupoutside", this.bindPointerOnUp);
        viewport.removeEventListener("mouseleave", this.bindPointerOutside);

        this.currentSession.off("onSelectedLayersChanged", this.bindOnSelectedLayersChanged);
        this.currentSession = null;

        this.overlayContainer = null;

        this.clearHoverPreview();

        this.clearDrawPreview();

        this.isDragging = false;
        this.startMousePosition = null!;
        this.previousMousePosition = null!;
        this.currentMousePosition = null!;
    }

    private onPointerDown(e: FederatedPointerEvent): void {
        if (!this.currentSession || e.button !== 0 || !this.targetLayer || !this.activeDrawStrategy) return;

        this.isDragging = true;
        this.startMousePosition = this.currentMousePosition = this.previousMousePosition = this.getLocalPos(e);
        this.updateDrawPayload();
    }

    private onPointerMove(e: FederatedPointerEvent): void {
        if (!this.currentSession || !this.activeDrawStrategy || !this.targetLayer) return;

        const newMousePosition = this.getLocalPos(e);
        this.previousMousePosition = { ...this.currentMousePosition };
        this.currentMousePosition = newMousePosition;

        if (this.activeDrawStrategy.comparePosition(this.previousMousePosition, newMousePosition, this.targetLayer)) return;

        this.clearDrawPreview();

        if (!this.isDragging) {
            this.drawHoverPreview(newMousePosition);
        } else {   
            this.updateDrawPayload();
        }
    }

    private onPointerUp(e: FederatedPointerEvent): void {
        if (!this.currentSession || !this.isDragging) return;

        const historyManager = this.editorContext.getCurrentHistoryManager();

        if (historyManager && this.activeDrawStrategy && this.targetLayer && this.drawPayloads.size > 0) {
            this.activeDrawStrategy.commit(this.targetLayer, Array.from(this.drawPayloads.values()), this.editorContext);
        }

        this.clearDrawPreview();
        this.isDragging = false;
        this.startMousePosition = null!;
        this.currentMousePosition = null!;
    }

    private onPointerOutside(e: FederatedPointerEvent) {
        this.clearDrawPreview();
    }

    private drawHoverPreview(pos: Position): void {
        this.clearHoverPreview();

        if (!this.currentSession || !this.overlayContainer || !this.targetLayer) return;

        if (this.activeDrawStrategy) {
            this.hoverSprites = this.activeDrawStrategy.drawHoverPreview(pos, this.targetLayer, this.editorContext, this.currentSession, this.overlayContainer);
        }
    }

    private updateDrawPayload(): void {
        this.clearDrawPreview();

        if (!this.activeDrawStrategy || !this.currentSession || !this.overlayContainer || !this.startMousePosition || !this.currentMousePosition) return;

        const startCoord = this.targetLayer!.posToCoord(this.startMousePosition);
        const endCoord = this.targetLayer!.posToCoord(this.currentMousePosition);
        
        const drawCoordinates = GeometryUtils.calculateLine(startCoord, endCoord);

        const drawPositions = drawCoordinates.map(c => this.targetLayer!.coordToPos(c));

        drawPositions.forEach((drawPosition) => {
            const drawPayloads = this.activeDrawStrategy!.getPayload(drawPosition, this.targetLayer!, this.editorContext, this.currentSession!);
            if (drawPayloads.length <= 0) return;
            drawPayloads.forEach((drawPayload) => {
                if (this.drawPayloads.has(drawPayload.key)) this.drawPayloads.get(drawPayload.key)!.sprite.destroy();
                this.overlayContainer!.addChild(drawPayload.sprite);
                this.drawPayloads.set(drawPayload.key, drawPayload);
            });
        });
    }

    private updateActiveDrawStrategy(): void {
        if (!this.currentSession) return;
        
        this.targetLayer = null;
        this.activeDrawStrategy = null;

        const selectedIds = this.currentSession.layerState.selectedLayers;
        if (selectedIds.length === 0) return;


        let targetLayer: BaseLayer<any> | null = null;
        for (const id of selectedIds) {
            const layer = this.currentSession.tilemap.rootLayer.findLayer(id);
            if (layer && !(layer instanceof GroupLayer)) {
                targetLayer = layer;
                break;
            }
        }

        if (!targetLayer || targetLayer?.locked || !targetLayer?.visible) return;

        this.activeDrawStrategy = this.drawStrategys.find(s => s.canHandle(targetLayer!, this)) || null;
        if (!this.activeDrawStrategy) return;
        this.targetLayer = targetLayer;
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