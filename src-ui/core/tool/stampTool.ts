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
import { GeometryUtils } from "@/shared/utils/geometryUtils";

import icon from "@/assets/icons/stamp.svg?raw";
import { TilemapSessionView } from "../application/session/tilemapSessionView";

@Tool({
    id: "tool.stamp",
    label: "workspace.tool.stamp.label",
    displayOnToolbar: {
        icon: icon,
        tooltip: "workspace.tool.stamp.description",
        index: 0,
    },
    shortcuts: ["S"],
    when: "inWorkspace && !isModalOpen",
})
export class StampTool implements ITool {
    private drawStrategys: IDrawStrategy[];
    private activeDrawStrategy: IDrawStrategy | null = null;

    private currentSession: TilemapSession | null = null;
    private currentSessionView: TilemapSessionView | null = null;

    private overlayContainer: Container | null = null;

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
        this.hoverSprites = [];
    }

    public onDisable(): void {
        this.clearDrawPreview();
        this.clearHoverPreview();

        this.isDragging = false;
        this.previousMousePosition = null!;
        this.currentMousePosition = null!;
    }

    public attach(session: TilemapSession, view: TilemapSessionView): void {
        this.currentSession = session;
        this.currentSessionView = view;

        const viewport = this.currentSessionView.viewport;

        this.overlayContainer = this.currentSessionView.overlayerContainer;

        viewport.on("pointerdown", this.bindPointerOnDown);
        viewport.on("pointermove", this.bindPointerOnMove);
        viewport.on("pointerup", this.bindPointerOnUp);
        viewport.on("pointerupoutside", this.bindPointerOnUp);
        viewport.addEventListener("mouseleave", this.bindPointerOutside);

        this.updateActiveDrawStrategy();

        this.currentSession.eventEmitter.on("onSelectedLayersChanged", this.bindOnSelectedLayersChanged);
    }

    public detach(): void {
        if (!this.currentSession || !this.currentSessionView) return;
        const viewport = this.currentSessionView.viewport;

        viewport.off("pointerdown", this.bindPointerOnDown);
        viewport.off("pointermove", this.bindPointerOnMove);
        viewport.off("pointerup", this.bindPointerOnUp);
        viewport.off("pointerupoutside", this.bindPointerOnUp);
        viewport.removeEventListener("mouseleave", this.bindPointerOutside);

        this.currentSession.eventEmitter.off("onSelectedLayersChanged", this.bindOnSelectedLayersChanged);

        this.currentSession = null;
        this.overlayContainer = null;

        this.isDragging = false;
        this.targetLayer = null;

        this.clearHoverPreview();
        this.clearDrawPreview();
    }

    private onPointerDown(e: FederatedPointerEvent) {
        if (!this.currentSession || e.button !== 0) return;

        if (!this.targetLayer || !this.activeDrawStrategy) return;

        this.isDragging = true;
        this.previousMousePosition = this.currentMousePosition = this.getLocalPos(e);
        this.updateDrawPayload();
    }

    private onPointerMove(e: FederatedPointerEvent) {
        if (!this.currentSession || !this.activeDrawStrategy || !this.targetLayer) return;

        const newMousePosition = this.getLocalPos(e);
        this.previousMousePosition = { ...this.currentMousePosition };
        this.currentMousePosition = newMousePosition;

        if (this.activeDrawStrategy.comparePosition(this.previousMousePosition, newMousePosition, this.targetLayer)) return;
        this.drawHoverPreview(newMousePosition);

        if (!this.isDragging) return;
        this.updateDrawPayload();
    }

    private onPointerUp(e: FederatedPointerEvent) {
        if (!this.currentSession || !this.isDragging) return;
        this.isDragging = false;

        if (this.activeDrawStrategy && this.targetLayer) {
            this.activeDrawStrategy.commit(this.targetLayer, Array.from(this.drawPayloads.values()), this.editorContext);
        }

        this.clearDrawPreview();
    }

    private onPointerOutside(e: FederatedPointerEvent) {
        this.clearHoverPreview();
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

    private drawHoverPreview(position: Position) {
        if (!this.currentSession || !this.overlayContainer) return;

        this.hoverSprites.forEach(sprite => sprite.destroy());
        this.hoverSprites = [];

        if (this.activeDrawStrategy) {
            this.hoverSprites = this.activeDrawStrategy.drawHoverPreview(position, this.targetLayer!, this.editorContext, this.currentSession, this.overlayContainer);
        }
    }

    private updateDrawPayload() {
        if (!this.isDragging || !this.activeDrawStrategy || !this.currentSession || !this.overlayContainer) return;

        const startCoordinate = this.targetLayer!.posToCoord(this.previousMousePosition);
        const endCoordinate = this.targetLayer!.posToCoord(this.currentMousePosition);

        const drawCoordinates = GeometryUtils.calculateLine(startCoordinate, endCoordinate);
        if (drawCoordinates.length == 0) drawCoordinates.push(endCoordinate);

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

    private getLocalPos(e: FederatedPointerEvent): Position {
        const localPosition = this.currentSessionView!.viewport.toLocal(new Point(e.global.x, e.global.y));
        return { x: localPosition.x, y: localPosition.y };
    }

    private clearDrawPreview() {
        this.drawPayloads.forEach((data) => data.sprite.destroy());
        this.drawPayloads.clear();
    }

    private clearHoverPreview() {
        this.hoverSprites.forEach(sprite => sprite.destroy());
        this.hoverSprites = [];
    }
}