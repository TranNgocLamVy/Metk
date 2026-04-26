import { Container, FederatedPointerEvent, Point } from "pixi.js";
import { IDrawStrategy, DrawPayload } from "./drawStrategy/IDrawStrategy";
import { ITool } from "@/core/interface/ITool";
import { TilemapSession } from "@/core/application/session/tilemapSession";
import { DrawTileStrategy } from "./drawStrategy/drawTileStrategy";
import { DrawRuleStrategy } from "./drawStrategy/drawRuleStrategy";
import { EditorContext } from "@/core/application/editorContext";
import { Tool } from "@/core/decorator/tool";
import { BaseLayer } from "@/core/application/tile/layer/baseLayer";
import { GroupLayer } from "../application/tile/layer/groupLayer";

import icon from "@/assets/icons/bucket.svg?raw";
import { TilemapSessionView } from "../application/session/tilemapSessionView";

@Tool({
    id: "tool.bucket",
    label: "workspace.tool.bucket.label",
    displayOnToolbar: {
        icon: icon,
        tooltip: "workspace.tool.bucket.description",
        index: 3,
    },
    shortcuts: ["F"],
    when: "inWorkspace && !isModalOpen",
})
export class BucketTool implements ITool {
    private drawStrategys: IDrawStrategy[] = [];
    private activeDrawStrategy: IDrawStrategy | null = null;

    private currentSession: TilemapSession | null = null;
    private currentSessionView: TilemapSessionView | null = null;

    private overlayContainer: Container | null = null;

    private currentFloodRegion: Set<string> = new Set();
    private stampsDataMap: Map<string, DrawPayload> = new Map();

    private startRegionCoordinate: Coordinate | null = null;
    private endRegionCoordinate: Coordinate | null = null;

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
        this.stampsDataMap = new Map<string, DrawPayload>();
        this.currentFloodRegion = new Set<string>();
    }

    public onDisable(): void {
        this.clearDrawPreview();
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
        this.currentSession.on("onSelectedLayersChanged", this.bindOnSelectedLayersChanged);
    }

    public detach(): void {
        if (!this.currentSession || !this.currentSessionView) return;
        const viewport = this.currentSessionView.viewport;

        viewport.off("pointerdown", this.bindPointerOnDown);
        viewport.off("pointermove", this.bindPointerOnMove);
        viewport.off("pointerup", this.bindPointerOnUp);
        viewport.off("pointerupoutside", this.bindPointerOnUp);
        viewport.removeEventListener("mouseleave", this.bindPointerOutside);

        this.currentSession.off("onSelectedLayersChanged", this.bindOnSelectedLayersChanged);
        this.currentSession = null;

        this.overlayContainer = null;

        this.clearDrawPreview();

        this.startRegionCoordinate = null;
        this.endRegionCoordinate = null;
        this.targetLayer = null;
    }

    private onPointerDown(e: FederatedPointerEvent): void {
        if (e.button !== 0) return;
        if (!this.currentSession || !this.targetLayer || !this.activeDrawStrategy) return;

        const pos = this.getLocalPos(e);
        const coord = this.targetLayer.posToCoord(pos);
        const key = `${coord.col},${coord.row}`;

        if (!this.currentFloodRegion.has(key)) {
            this.updateDrawPayload(coord);
        }

        const historyManager = this.editorContext.getCurrentHistoryManager();

        if (historyManager && this.activeDrawStrategy && this.targetLayer && this.stampsDataMap.size > 0) {
            this.activeDrawStrategy.commit(this.targetLayer, Array.from(this.stampsDataMap.values()), this.editorContext);
        }
        this.clearDrawPreview();
    }

    private onPointerMove(e: FederatedPointerEvent): void {
        if (!this.currentSession || !this.targetLayer || !this.activeDrawStrategy) return;

        const coord = this.targetLayer.posToCoord(this.getLocalPos(e));
        const key = `${coord.col},${coord.row}`;

        if (this.currentFloodRegion.has(key)) return;

        this.updateDrawPayload(coord);
    }

    private onPointerUp(e: FederatedPointerEvent): void { }

    private onPointerOutside(e: FederatedPointerEvent): void {
        this.clearDrawPreview();
    }

    private calculateFloodRegion(layer: BaseLayer<any>, start: Coordinate): void {
        this.currentFloodRegion.clear();

        const layerWidth = (layer as any).width ?? this.currentSession!.tilemap.width;
        const layerHeight = (layer as any).height ?? this.currentSession!.tilemap.height;

        this.startRegionCoordinate = { ...start };
        this.endRegionCoordinate = { ...start };

        if (start.col < 0 || start.col >= layerWidth || start.row < 0 || start.row >= layerHeight) return;

        const targetRef = this.activeDrawStrategy!.getRefAt(layer.coordToPos(start), layer);
        const startKey = `${start.col},${start.row}`;
        this.currentFloodRegion.add(startKey);

        if (targetRef != null) return;

        const queue: Coordinate[] = [start];

        let head = 0;
        while (head < queue.length) {
            const current = queue[head++];

            const neighbors = [
                { col: current.col, row: current.row - 1 },
                { col: current.col, row: current.row + 1 },
                { col: current.col - 1, row: current.row },
                { col: current.col + 1, row: current.row }
            ];

            for (const n of neighbors) {
                if (n.col < 0 || n.col >= layerWidth || n.row < 0 || n.row >= layerHeight) continue;

                const nKey = `${n.col},${n.row}`;
                if (this.currentFloodRegion.has(nKey)) continue;

                this.startRegionCoordinate.col = Math.min(this.startRegionCoordinate.col, n.col);
                this.startRegionCoordinate.row = Math.min(this.startRegionCoordinate.row, n.row);

                this.endRegionCoordinate.col = Math.max(this.endRegionCoordinate.col, n.col);
                this.endRegionCoordinate.row = Math.max(this.endRegionCoordinate.row, n.row);

                const ref = this.activeDrawStrategy!.getRefAt(layer.coordToPos(n), layer);
                if (ref === targetRef) {
                    this.currentFloodRegion.add(nKey);
                    queue.push(n);
                }
            }
        }
    }

    private updateDrawPayload(start: Coordinate): void {
        if (!this.activeDrawStrategy || !this.currentSession || !this.overlayContainer || !this.targetLayer) return;

        this.clearDrawPreview();
        this.calculateFloodRegion(this.targetLayer, start);

        const bounds = this.getBounds(this.startRegionCoordinate!, this.endRegionCoordinate!);
        const drawCoordinates = this.getDrawCoordinates(bounds);

        drawCoordinates.forEach((drawCoordinate) => {
            const drawPayloads = this.activeDrawStrategy!.getPayload(this.targetLayer!.coordToPos(drawCoordinate), this.targetLayer!, this.editorContext, this.currentSession!);
            if (drawPayloads.length <= 0) return;
            drawPayloads.forEach((drawPayload) => {
                if (!this.currentFloodRegion.has(drawPayload.key)) {
                    drawPayload.sprite.destroy();
                    return;
                }
                if (this.stampsDataMap.has(drawPayload.key)) this.stampsDataMap.get(drawPayload.key)!.sprite.destroy();
                this.overlayContainer!.addChild(drawPayload.sprite);
                this.stampsDataMap.set(drawPayload.key, drawPayload);
            });
        });
    }

    private getBounds(start: Coordinate, current: Coordinate) {
        let minX = Math.min(start.col, current.col);
        let maxX = Math.max(start.col, current.col);
        let minY = Math.min(start.row, current.row);
        let maxY = Math.max(start.row, current.row);
        return { minX, maxX, minY, maxY };
    }

    private getDrawCoordinates(bounds: { minX: number, maxX: number, minY: number, maxY: number }): Coordinate[] {
        const points: Coordinate[] = [];
        const { minX, maxX, minY, maxY } = bounds;

        let size = this.activeDrawStrategy!.getBrushSize(this.editorContext);

        const width = Math.ceil(Math.abs(maxX - minX + 1) / size.width);
        const height = Math.ceil(Math.abs(maxY - minY + 1) / size.height);

        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const col = minX + x * size.width;
                const row = minY + y * size.height;
                points.push({ col, row });
            }
        }
        return points;
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
        const localPosition = this.currentSessionView!.viewport.toLocal(new Point(e.global.x, e.global.y));
        return { x: localPosition.x, y: localPosition.y };
    }

    private clearDrawPreview(): void {
        this.stampsDataMap.forEach((data) => data.sprite.destroy());
        this.stampsDataMap.clear();

        this.currentFloodRegion.clear();
    }
}