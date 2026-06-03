import { BaseLayerRenderer } from "@/graphics/renderer/tilemap/base-layer.renderer";
import { GeometryUtils } from "@/shared/utils/geometry-utils";
import { FederatedPointerEvent } from "pixi.js";
import { PointerTool } from "@/graphics/tool/base/pointer.tool";

export abstract class GridStrokeTool extends PointerTool {
    protected isDragging: boolean = false;
    protected previousCoordinate: Coordinate | null = null;
    protected currentCoordinate: Coordinate | null = null;

    protected override onPointerDown(e: FederatedPointerEvent): void {
        if (e.button !== 0) return;
        if (!this.currentView || !this.targetLayerRenderer) return;
        if (!this.isTargetLayerSupported(this.targetLayerRenderer)) return;

        const coordinate = this.targetLayerRenderer.posToCoord(this.getLocalPos(e));
        this.isDragging = true;
        this.previousCoordinate = coordinate;
        this.currentCoordinate = coordinate;
        this.collectStrokeAt(coordinate);
    }

    protected override onPointerMove(e: FederatedPointerEvent): void {
        if (!this.currentView || !this.targetLayerRenderer) return;
        if (!this.isTargetLayerSupported(this.targetLayerRenderer)) return;

        const coordinate = this.targetLayerRenderer.posToCoord(this.getLocalPos(e));
        if (this.currentCoordinate && this.sameCoordinate(this.currentCoordinate, coordinate)) return;

        this.currentCoordinate = coordinate;
        this.drawHoverPreview(coordinate);

        if (!this.isDragging) return;

        const previous = this.previousCoordinate ?? coordinate;
        const coordinates = GeometryUtils.calculateLine(previous, coordinate);
        if (coordinates.length === 0) coordinates.push(coordinate);
        coordinates.forEach((item) => this.collectStrokeAt(item));
        this.previousCoordinate = coordinate;
    }

    protected override onPointerUp(e: FederatedPointerEvent): void {
        if (!this.isDragging) return;

        this.isDragging = false;
        this.commitStroke();
        this.clearStrokePreview();
        this.resetStrokeState();
    }

    protected override onPointerOutside(e: FederatedPointerEvent): void {
        this.clearHoverPreview();
    }

    public override onDisable(): void {
        this.clearHoverPreview();
        this.clearStrokePreview();
        this.resetStrokeState();
    }

    public override detach(): void {
        super.detach();
        this.clearHoverPreview();
        this.clearStrokePreview();
        this.resetStrokeState();
    }

    protected resetStrokeState(): void {
        this.isDragging = false;
        this.previousCoordinate = null;
        this.currentCoordinate = null;
    }

    private sameCoordinate(first: Coordinate, second: Coordinate): boolean {
        return first.col === second.col && first.row === second.row;
    }

    protected abstract isTargetLayerSupported(layerRenderer: BaseLayerRenderer): boolean;
    protected abstract clearHoverPreview(): void;
    protected abstract clearStrokePreview(): void;
    protected abstract drawHoverPreview(coord: Coordinate): void;
    protected abstract collectStrokeAt(coord: Coordinate): void;
    protected abstract commitStroke(): void;
}

