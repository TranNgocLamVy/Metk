import { SetTilesCommand } from "@/application/commands/tile/set-tiles.command";
import { TileLayer } from "@/editor/model/tilemap/layer/tile-layer";
import { TileLayerRenderer } from "@/graphics/renderer/tilemap/tile-layer.renderer";
import { coordinateKey, getPrimarySelectedTile, isSameTileRef } from "@/graphics/tool/base/grid-tool-utils";
import { PointerTool } from "@/graphics/tool/base/pointer.tool";
import { FederatedPointerEvent } from "pixi.js";

type TileRefLike = { tileId: number | null; tilesetId: string | null } | null;

export class TileBucketTool extends PointerTool {
    protected override onPointerDown(e: FederatedPointerEvent): void {
        if (e.button !== 0) return;
        if (!this.currentView || !this.isTargetLayerSupported(this.targetLayerRenderer)) return;
        if (this.targetLayerRenderer.layer.locked || !this.targetLayerRenderer.layer.visible) return;

        const replacement = getPrimarySelectedTile(this.editorFacade);
        if (!replacement) return;

        const start = this.targetLayerRenderer.posToCoord(this.getLocalPos(e));
        if (!this.currentView.session.tilemap.isInBoundary(start)) return;

        const original = this.targetLayerRenderer.layer.getTileRefAt(start);
        if (isSameTileRef(original, replacement)) return;

        const coordinates = this.collectFloodFill(start, original);
        if (coordinates.length === 0) return;

        const historyManager = this.editorFacade.getCurrentHistoryManager();
        if (!historyManager) return;

        const updates = coordinates.map((coordinate) => ({
            coordinate,
            tileId: replacement.tileId,
            tilesetId: replacement.tilesetId,
        }));

        historyManager.startTransaction();
        historyManager.execute(
            new SetTilesCommand(this.targetLayerRenderer.tilemap.objectId, this.targetLayerRenderer.layer.objectId, updates),
            this.editorFacade,
        );
        historyManager.commitTransaction();
    }

    private collectFloodFill(start: Coordinate, original: TileRefLike): Coordinate[] {
        if (!this.currentView || !this.isTargetLayerSupported(this.targetLayerRenderer)) return [];

        const queue: Coordinate[] = [start];
        const visited = new Set<string>();
        const result: Coordinate[] = [];

        let head = 0;
        while (head < queue.length) {
            const current = queue[head++];
            const key = coordinateKey(current);
            if (visited.has(key)) continue;
            visited.add(key);

            if (!this.currentView.session.tilemap.isInBoundary(current)) continue;
            if (!isSameTileRef(this.targetLayerRenderer.layer.getTileRefAt(current), original)) continue;

            result.push(current);
            queue.push(
                { col: current.col, row: current.row - 1 },
                { col: current.col, row: current.row + 1 },
                { col: current.col - 1, row: current.row },
                { col: current.col + 1, row: current.row },
            );
        }

        return result;
    }

    private isTargetLayerSupported(layerRenderer: any): layerRenderer is TileLayerRenderer {
        return layerRenderer?.layer instanceof TileLayer;
    }
}