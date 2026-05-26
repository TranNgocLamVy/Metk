import { EditorFacade } from "@/application/editor.facade";
import { ITool } from "@/editor/interface/tool.interface";
import { Container, FederatedPointerEvent, Point } from "pixi.js";
import { DrawPayload, IDrawStrategy } from "../strategies/draw-strategy.interface";

import icon from "@/assets/icons/bucket.svg?raw";
import { BaseLayerRenderer } from "../renderer/tilemap/base-layer.renderer";
import { TilemapView } from "../view/tilemap.view";
import { Tool } from "./tool.decorator";

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
    private activeDrawStrategy: IDrawStrategy | null = null;

    private currentView: TilemapView | null = null;

    private overlayContainer: Container | null = null;

    private currentFloodRegion: Set<string> = new Set();
    private stampsDataMap: Map<string, DrawPayload> = new Map();

    private startRegionCoordinate: Coordinate | null = null;
    private endRegionCoordinate: Coordinate | null = null;

    private targetLayerRenderer: BaseLayerRenderer | null = null;

    private bindPointerOnDown: (event: FederatedPointerEvent) => void;
    private bindPointerOnMove: (event: FederatedPointerEvent) => void;
    private bindPointerOnUp: (event: FederatedPointerEvent) => void;
    private bindPointerOutside: (event: FederatedPointerEvent) => void;

    constructor(private readonly editorFacade: EditorFacade) {
        this.bindPointerOnDown = this.onPointerDown.bind(this);
        this.bindPointerOnMove = this.onPointerMove.bind(this);
        this.bindPointerOnUp = this.onPointerUp.bind(this);
        this.bindPointerOutside = this.onPointerOutside.bind(this);
    }

    public onEnable(): void {
        this.stampsDataMap = new Map<string, DrawPayload>();
        this.currentFloodRegion = new Set<string>();
    }

    public onDisable(): void {
        this.clearDrawPreview();
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
        if (!this.currentView) return;
        const viewport = this.currentView.viewport;

        viewport.off("pointerdown", this.bindPointerOnDown);
        viewport.off("pointermove", this.bindPointerOnMove);
        viewport.off("pointerup", this.bindPointerOnUp);
        viewport.off("pointerupoutside", this.bindPointerOnUp);
        viewport.removeEventListener("mouseleave", this.bindPointerOutside);

        this.currentView = null;

        this.overlayContainer = null;

        this.clearDrawPreview();

        this.startRegionCoordinate = null;
        this.endRegionCoordinate = null;
        this.targetLayerRenderer = null;
    }

    public setDrawStrategy(strategy: IDrawStrategy | null): void {
        this.activeDrawStrategy = strategy;
    }

    public setTargetLayerRenderer(layerRenderer: BaseLayerRenderer | null): void {
        this.targetLayerRenderer = layerRenderer;
    }

    private onPointerDown(e: FederatedPointerEvent): void {
        if (e.button !== 0) return;
        if (!this.currentView || !this.targetLayerRenderer || !this.activeDrawStrategy) return;

        const pos = this.getLocalPos(e);
        const coord = this.targetLayerRenderer.posToCoord(pos);
        const key = `${coord.col},${coord.row}`;

        if (!this.currentFloodRegion.has(key)) {
            this.updateDrawPayload(coord);
        }

        const historyManager = this.editorFacade.getCurrentHistoryManager();

        if (historyManager && this.activeDrawStrategy && this.targetLayerRenderer && this.stampsDataMap.size > 0) {
            this.activeDrawStrategy.commit(this.targetLayerRenderer, Array.from(this.stampsDataMap.values()), this.editorFacade);
        }
        this.clearDrawPreview();
    }

    private onPointerMove(e: FederatedPointerEvent): void {
        if (!this.currentView || !this.targetLayerRenderer || !this.activeDrawStrategy) return;

        const coord = this.targetLayerRenderer.posToCoord(this.getLocalPos(e));
        const key = `${coord.col},${coord.row}`;

        if (this.currentFloodRegion.has(key)) return;

        this.updateDrawPayload(coord);
    }

    private onPointerUp(e: FederatedPointerEvent): void { }

    private onPointerOutside(e: FederatedPointerEvent): void {
        this.clearDrawPreview();
    }

    private calculateFloodRegion(start: Coordinate): void {
        this.currentFloodRegion.clear();

        const layerRenderer = this.targetLayerRenderer;
        if (!layerRenderer) return;

        const layerWidth = (layerRenderer as any).width ?? this.currentView!.session.tilemap.width;
        const layerHeight = (layerRenderer as any).height ?? this.currentView!.session.tilemap.height;

        this.startRegionCoordinate = { ...start };
        this.endRegionCoordinate = { ...start };

        if (start.col < 0 || start.col >= layerWidth || start.row < 0 || start.row >= layerHeight) return;

        const targetRef = this.activeDrawStrategy!.getRefAt(layerRenderer.coordToPos(start), layerRenderer);
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

                const ref = this.activeDrawStrategy!.getRefAt(layerRenderer.coordToPos(n), layerRenderer);
                if (ref === targetRef) {
                    this.currentFloodRegion.add(nKey);
                    queue.push(n);
                }
            }
        }
    }

    private updateDrawPayload(start: Coordinate): void {
        if (!this.activeDrawStrategy || !this.currentView || !this.overlayContainer || !this.targetLayerRenderer) return;

        this.clearDrawPreview();
        this.calculateFloodRegion(start);

        const bounds = this.getBounds(this.startRegionCoordinate!, this.endRegionCoordinate!);
        const drawCoordinates = this.getDrawCoordinates(bounds);

        drawCoordinates.forEach((drawCoordinate) => {
            const drawPayloads = this.activeDrawStrategy!.getPayload(this.targetLayerRenderer!.coordToPos(drawCoordinate), this.targetLayerRenderer!, this.editorFacade, this.currentView!.session);
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

        let size = this.activeDrawStrategy!.getBrushSize(this.editorFacade);

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

    private getLocalPos(e: FederatedPointerEvent): Position {
        const localPosition = this.currentView!.viewport.toLocal(new Point(e.global.x, e.global.y));
        return { x: localPosition.x, y: localPosition.y };
    }

    private clearDrawPreview(): void {
        this.stampsDataMap.forEach((data) => data.sprite.destroy());
        this.stampsDataMap.clear();

        this.currentFloodRegion.clear();
    }
}