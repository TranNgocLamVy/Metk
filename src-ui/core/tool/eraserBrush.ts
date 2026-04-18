import { Container, FederatedPointerEvent, FederatedWheelEvent, Graphics, Point } from "pixi.js";

import eraser from "@/assets/icons/eraser.svg?raw";

import { EditorContext } from "../application/editorContext";
import { TilemapSession } from "../application/session/tilemapSession";
import { TileLayer } from "../application/tile/layer/tileLayer";
import { RuleLayer } from "../application/tile/layer/ruleLayer";
import { BatchCommand } from "../command/batchCommand";
import { Tool } from "../decorator/tool";
import { ITool } from "../interface/ITool";
import { IBaseCommand } from "../interface/IBaseCommand";
import { SetTilesCommand } from "../command/tile/setTilesCommand";
import { SetRuleRefsCommand } from "../command/tile/setRulesCommand";

@Tool({
    id: "eraser",
    name: "Eraser",
    displayOnToolbar: {
        icon: eraser,
        tooltip: "Eraser",
        index: 1,
    },
    shortcuts: ["E"],
})
export class EraserBrush implements ITool {
    private currentSession: TilemapSession | null = null;
    private overlayContainer: Container | null = null;

    private previousPreviewCoordinate: Coordinate = null!;
    private currentPreviewCoordinate: Coordinate = null!;
    private eraseCoordinateSet: Set<string> = new Set();

    private isDragging: boolean = false;
    private previewGraphics: Graphics | null = null;
    private static eraserSize: number = 1;

    private bindPointerOnDown: (event: FederatedPointerEvent) => void;
    private bindPointerOnMove: (event: FederatedPointerEvent) => void;
    private bindPointerOnUp: (event: FederatedPointerEvent) => void;
    private bindPointerOutside: (event: FederatedPointerEvent) => void;

    private originalWheelEvent: (e: FederatedWheelEvent) => boolean;

    private eraseCommandStack: IBaseCommand[] = [];

    constructor(private readonly editorContext: EditorContext) {
        this.bindPointerOnDown = this.onPointerDown.bind(this);
        this.bindPointerOnMove = this.onPointerMove.bind(this);
        this.bindPointerOnUp = this.onPointerUp.bind(this);
        this.bindPointerOutside = this.onPointerOutside.bind(this);
    }

    public onEnable(): void {

    }

    public onDisable(): void {
        if (this.previewGraphics) {
            this.previewGraphics.removeFromParent();
            this.previewGraphics.destroy()
        }
        this.previewGraphics = null;
    }

    public attach(session: TilemapSession): void {
        this.currentSession = session;
        const viewport = session.sessionView.viewport;

        this.overlayContainer = session.sessionView.overlayerContainer;

        this.previewGraphics = new Graphics();
        this.overlayContainer?.addChild(this.previewGraphics);

        viewport.on("pointerdown", this.bindPointerOnDown);
        viewport.on("pointermove", this.bindPointerOnMove);
        viewport.on("pointerup", this.bindPointerOnUp);
        viewport.on("pointerupoutside", this.bindPointerOnUp);
        viewport.addEventListener("mouseleave", this.bindPointerOutside);

        const wheelPlugin = viewport.plugins.get('wheel');
        const originalWheelEvent = wheelPlugin!.wheel;
        this.originalWheelEvent = originalWheelEvent;
        const self = this;
        wheelPlugin!.wheel = function (e: FederatedWheelEvent) {
            if (e.ctrlKey) return self.onWheel(e);
            return originalWheelEvent.call(this, e);
        };
    }

    public detach(): void {
        if (!this.currentSession) return;
        const viewport = this.currentSession.sessionView.viewport;

        viewport.off("pointerdown", this.bindPointerOnDown);
        viewport.off("pointermove", this.bindPointerOnMove);
        viewport.off("pointerup", this.bindPointerOnUp);
        viewport.off("pointerupoutside", this.bindPointerOnUp);
        viewport.removeEventListener("mouseleave", this.bindPointerOutside);

        const wheelPlugin = viewport.plugins.get('wheel')!;
        wheelPlugin.wheel = this.originalWheelEvent;

        this.currentSession = null;

        if (this.overlayContainer) this.overlayContainer.removeChildren();
        this.overlayContainer = null;
    }

    private onPointerDown(e: FederatedPointerEvent) {
        if (!this.currentSession) return;
        if (e.button !== 0) return;
        if (!this.getActiveLayer()) return;
        this.isDragging = true;
        this.previousPreviewCoordinate = this.getGridCoordinates(e.global.x, e.global.y);
        this.eraseMove(e);
    }

    private onPointerMove(e: FederatedPointerEvent) {
        if (!this.currentSession) return;

        const newCoordinate = this.getGridCoordinates(e.global.x, e.global.y);
        this.currentPreviewCoordinate = newCoordinate;
        this.drawPreviewErase();

        if (!this.isDragging) return;
        this.eraseMove(e);
    }

    private onPointerUp(e: FederatedPointerEvent) {
        if (!this.currentSession) return;
        if (!this.isDragging) return;
        this.isDragging = false;
        this.eraseEnd(e);
    }

    private onPointerOutside(e: FederatedPointerEvent) {
        if (this.overlayContainer) {
            this.previewGraphics?.clear();
        }
    }

    private onWheel(e: FederatedWheelEvent): boolean {
        const deltaY = e.deltaY > 0 ? 1 : -1;
        EraserBrush.eraserSize = Math.max(1, EraserBrush.eraserSize - deltaY);
        this.drawPreviewErase();
        return false;
    }

    private drawPreviewErase() {
        if (!this.currentSession) return;
        if (!this.previewGraphics) return;

        this.previewGraphics.clear();

        const startPoint = {
            x: this.currentPreviewCoordinate.col * this.currentSession.tilemap.tilewidth,
            y: this.currentPreviewCoordinate.row * this.currentSession.tilemap.tileheight
        }

        const endPoint = {
            x: (this.currentPreviewCoordinate.col + EraserBrush.eraserSize) * this.currentSession.tilemap.tilewidth,
            y: (this.currentPreviewCoordinate.row + EraserBrush.eraserSize) * this.currentSession.tilemap.tileheight
        }

        this.previewGraphics.moveTo(startPoint.x, startPoint.y)
                            .lineTo(endPoint.x, startPoint.y)
                            .lineTo(endPoint.x, endPoint.y)
                            .lineTo(startPoint.x, endPoint.y)
                            .lineTo(startPoint.x, startPoint.y)
                            .stroke({ color: 0xff0000, pixelLine: true });

        this.previewGraphics.rect(startPoint.x, startPoint.y, endPoint.x - startPoint.x, endPoint.y - startPoint.y).fill({ color: 0xff0000, alpha: 0.25 });
    }

    private getGridCoordinates(globalX: number, globalY: number): Coordinate {
        const worldPos = this.currentSession!.sessionView.viewport.toLocal(new Point(globalX, globalY));
        const gridX = Math.floor(worldPos.x / this.currentSession!.tilemap.tilewidth);
        const gridY = Math.floor(worldPos.y / this.currentSession!.tilemap.tileheight);
        return { col: gridX, row: gridY };
    }

    private getDrawCoordinates(): Coordinate[] {
        const coordinates: Coordinate[] = [];
        if (!this.previousPreviewCoordinate || !this.currentPreviewCoordinate) return coordinates;

        let x0 = this.previousPreviewCoordinate.col;
        let y0 = this.previousPreviewCoordinate.row;
        const x1 = this.currentPreviewCoordinate.col;
        const y1 = this.currentPreviewCoordinate.row;

        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;

        while (true) {
            coordinates.push({ col: x0, row: y0 });

            if (x0 === x1 && y0 === y1) break;

            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x0 += sx;
            }
            if (e2 < dx) {
                err += dx;
                y0 += sy;
            }
        }

        return coordinates;
    }

    private getActiveLayer(): TileLayer | RuleLayer | null {
        const selectedIds = this.currentSession!.layerState.selectedLayers;
        if (selectedIds.length == 0) return null;

        const activeId = selectedIds.values().next().value;
        if (!activeId) return null;

        const root = this.currentSession!.tilemap.rootLayer;
        const layer = root.findLayer(activeId);

        if (layer && (layer instanceof TileLayer || layer instanceof RuleLayer)) return layer;
        return null;
    }

    private eraseMove(e: FederatedPointerEvent) {
        if (!this.isDragging) return;

        const activeLayer = this.getActiveLayer();
        if (!activeLayer) return;

        const drawCoordinates = this.getDrawCoordinates();
        if (drawCoordinates.length == 0) drawCoordinates.push(this.currentPreviewCoordinate);
        
        const eraseCoordinates = new Array<Coordinate>();

        drawCoordinates.forEach(drawCoordinate => {
            for (let r = 0; r < EraserBrush.eraserSize; r++) {
                for (let c = 0; c < EraserBrush.eraserSize; c++) {
                    const targetX = drawCoordinate.col + c;
                    const targetY = drawCoordinate.row + r;
                    if (targetX < 0 || targetX >= this.currentSession!.tilemap.width ||
                        targetY < 0 || targetY >= this.currentSession!.tilemap.height) {
                        continue;
                    }
                    const coord = { col: targetX, row: targetY };
                    if (this.eraseCoordinateSet.has(`${coord.col},${coord.row}`)) continue;
                    if (activeLayer instanceof TileLayer) {
                        if (!activeLayer.getTileRefAt(coord)) continue;
                    } else if (activeLayer instanceof RuleLayer) {
                        if (!activeLayer.getRulesetRefAt(coord)) continue;
                    } // Expand to other layer types
                    this.eraseCoordinateSet.add(`${coord.col},${coord.row}`);
                    eraseCoordinates.push(coord);
                }
            }
        })

        if (eraseCoordinates.length != 0) {
            let eraseCommand: IBaseCommand;
            
            if (activeLayer instanceof TileLayer) {
                eraseCommand = new SetTilesCommand(activeLayer.id, eraseCoordinates.map(c => ({ coordinate: c, tileId: null, tilesetId: null })));
            } else {
                eraseCommand = new SetRuleRefsCommand(activeLayer.id, eraseCoordinates.map(c => ({ coordinate: c, rulesetId: null })));
            } // Expand to other layer types
            
            if (!eraseCommand) return;
            eraseCommand.execute(this.editorContext);
            this.eraseCommandStack.push(eraseCommand);
        }

        this.previousPreviewCoordinate = this.currentPreviewCoordinate;
    }

    private eraseEnd(e: FederatedPointerEvent) {
        this.eraseCoordinateSet.clear();

        const historyManager = this.editorContext.getCurrentHistoryManager();
        if (!historyManager) {
            this.eraseCommandStack.reverse().forEach(cmd => cmd.undo(this.editorContext));
            this.eraseCommandStack = [];
            return;
        }

        if (this.eraseCommandStack.length == 0) return;
        
        const batchCommand = new BatchCommand(this.eraseCommandStack);
        historyManager.pushToUndoStack(batchCommand);
        this.eraseCommandStack = [];
    }
}