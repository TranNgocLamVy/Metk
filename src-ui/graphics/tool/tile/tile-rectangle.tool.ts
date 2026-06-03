import { SetTilesCommand } from "@/application/commands/tile/set-tiles.command";
import { TileLayer } from "@/editor/model/tilemap/layer/tile-layer";
import { Tile } from "@/editor/model/tileset/tileset";
import { TileLayerRenderer } from "@/graphics/renderer/tilemap/tile-layer.renderer";
import { coordinateKey, getRectangleCoordinates, getSelectedTiles, sameCoordinate } from "@/graphics/tool/base/grid-tool-utils";
import { PointerTool } from "@/graphics/tool/base/pointer.tool";
import { FederatedPointerEvent, Sprite } from "pixi.js";

type TileRectanglePayload = {
    key: string;
    coordinate: Coordinate;
    sprite: Sprite;
    tileId: number;
    tilesetId: string;
};

export class TileRectangleTool extends PointerTool {
    private static readonly spriteAlpha = 0.9;

    private isDragging = false;
    private startCoordinate: Coordinate | null = null;
    private currentCoordinate: Coordinate | null = null;
    private squareMode = false;
    private previewPayloads: Map<string, TileRectanglePayload> = new Map();

    public override onDisable(): void {
        this.clearPreview();
        this.reset();
    }

    public override detach(): void {
        super.detach();
        this.clearPreview();
        this.reset();
    }

    protected override onPointerDown(e: FederatedPointerEvent): void {
        if (e.button !== 0) return;
        if (!this.currentView || !this.isTargetLayerSupported(this.targetLayerRenderer)) return;
        if (this.targetLayerRenderer.layer.locked || !this.targetLayerRenderer.layer.visible) return;

        const coordinate = this.targetLayerRenderer.posToCoord(this.getLocalPos(e));
        this.isDragging = true;
        this.squareMode = !!e.shiftKey;
        this.startCoordinate = coordinate;
        this.currentCoordinate = coordinate;
        this.updatePreview();
    }

    protected override onPointerMove(e: FederatedPointerEvent): void {
        if (!this.currentView || !this.isTargetLayerSupported(this.targetLayerRenderer)) return;
        const coordinate = this.targetLayerRenderer.posToCoord(this.getLocalPos(e));
        this.squareMode = !!e.shiftKey;

        if (!this.isDragging) return;
        if (this.currentCoordinate && sameCoordinate(this.currentCoordinate, coordinate)) return;

        this.currentCoordinate = coordinate;
        this.updatePreview();
    }

    protected override onPointerUp(e: FederatedPointerEvent): void {
        if (!this.isDragging) return;

        this.squareMode = !!e.shiftKey;
        this.commitPreview();
        this.clearPreview();
        this.reset();
    }

    private updatePreview(): void {
        this.clearPreview();
        if (!this.overlayContainer || !this.currentView || !this.isTargetLayerSupported(this.targetLayerRenderer)) return;
        if (this.targetLayerRenderer.layer.locked || !this.targetLayerRenderer.layer.visible) return;
        if (!this.startCoordinate || !this.currentCoordinate) return;

        getRectangleCoordinates(this.startCoordinate, this.currentCoordinate, this.squareMode).forEach((coordinate) => {
            this.createPayloads(coordinate).forEach((payload) => {
                this.previewPayloads.get(payload.key)?.sprite.destroy();
                this.overlayContainer!.addChild(payload.sprite);
                this.previewPayloads.set(payload.key, payload);
            });
        });
    }

    private createPayloads(origin: Coordinate): TileRectanglePayload[] {
        if (!this.currentView || !this.isTargetLayerSupported(this.targetLayerRenderer)) return [];

        const selectedTiles = getSelectedTiles(this.editorFacade);
        if (!selectedTiles) return [];

        const payloads: TileRectanglePayload[] = [];
        for (let rowOffset = 0; rowOffset < selectedTiles.length; rowOffset++) {
            for (let colOffset = 0; colOffset < selectedTiles[rowOffset].length; colOffset++) {
                const tile = selectedTiles[rowOffset][colOffset];
                if (!tile) continue;

                const coordinate = { col: origin.col + colOffset, row: origin.row + rowOffset };
                if (!this.currentView.session.tilemap.isInBoundary(coordinate)) continue;

                const payload = this.createPayload(coordinate, tile);
                if (payload) payloads.push(payload);
            }
        }

        return payloads;
    }

    private createPayload(coordinate: Coordinate, tile: Tile): TileRectanglePayload | null {
        if (!this.isTargetLayerSupported(this.targetLayerRenderer)) return null;

        const texture = this.editorFacade.textureManager.getTileTexture(tile.tileset.id, tile.id);
        if (!texture) return null;

        const sprite = new Sprite(texture);
        sprite.alpha = TileRectangleTool.spriteAlpha;

        const position = this.targetLayerRenderer.coordToPos(coordinate);
        sprite.position.set(position.x, position.y + (this.targetLayerRenderer.tilemap.tileHeight - texture.height));

        return {
            key: coordinateKey(coordinate),
            coordinate,
            sprite,
            tileId: tile.id,
            tilesetId: tile.tileset.id,
        };
    }

    private commitPreview(): void {
        if (!this.isTargetLayerSupported(this.targetLayerRenderer)) return;
        if (this.targetLayerRenderer.layer.locked || !this.targetLayerRenderer.layer.visible) return;

        const historyManager = this.editorFacade.getCurrentHistoryManager();
        if (!historyManager || this.previewPayloads.size === 0) return;

        const updates = Array.from(this.previewPayloads.values()).map((payload) => ({
            coordinate: payload.coordinate,
            tileId: payload.tileId,
            tilesetId: payload.tilesetId,
        }));

        historyManager.startTransaction();
        historyManager.execute(
            new SetTilesCommand(this.targetLayerRenderer.tilemap.objectId, this.targetLayerRenderer.layer.objectId, updates),
            this.editorFacade,
        );
        historyManager.commitTransaction();
    }

    private clearPreview(): void {
        this.previewPayloads.forEach((payload) => payload.sprite.destroy());
        this.previewPayloads.clear();
    }

    private reset(): void {
        this.isDragging = false;
        this.startCoordinate = null;
        this.currentCoordinate = null;
        this.squareMode = false;
    }

    private isTargetLayerSupported(layerRenderer: any): layerRenderer is TileLayerRenderer {
        return layerRenderer?.layer instanceof TileLayer;
    }
}