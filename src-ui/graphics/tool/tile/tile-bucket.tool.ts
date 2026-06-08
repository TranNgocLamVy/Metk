import { SetTilesCommand } from "@/application/commands/tile/set-tiles.command";
import { TileLayer } from "@/editor/model/tilemap/layer/tile-layer";
import { TileLayerRenderer } from "@/graphics/renderer/tilemap/tile-layer.renderer";
import { coordinateKey, getPrimarySelectedTile, isSameTileRef, sameCoordinate } from "@/graphics/tool/base/grid-tool-utils";
import { PointerTool } from "@/graphics/tool/base/pointer.tool";
import { FederatedPointerEvent, Sprite } from "pixi.js";

type TileRefLike = { tileId: number | null; tilesetId: string | null } | null;

type SelectedTileRef = {
    tileId: number;
    tilesetId: string;
};

type TileBucketPreviewPayload = {
    key: string;
    coordinate: Coordinate;
    sprite: Sprite;
    tileId: number;
    tilesetId: string;
};

export class TileBucketTool extends PointerTool {
    private static readonly spriteAlpha = 0.9;

    private currentCoordinate: Coordinate | null = null;
    private previewPayloads: Map<string, TileBucketPreviewPayload> = new Map();

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

        if (!this.currentView || !this.isTargetLayerSupported(this.targetLayerRenderer)) {
            this.clearPreview();
            this.reset();
            return;
        }

        if (this.targetLayerRenderer.layer.locked || !this.targetLayerRenderer.layer.visible) {
            this.clearPreview();
            this.reset();
            return;
        }

        const coordinate = this.targetLayerRenderer.posToCoord(this.getLocalPos(e));
        this.currentCoordinate = coordinate;
        this.updatePreview(coordinate);

        this.commitPreview();
        this.clearPreview();
        this.reset();
    }

    protected override onPointerMove(e: FederatedPointerEvent): void {
        if (!this.currentView || !this.isTargetLayerSupported(this.targetLayerRenderer)) {
            this.clearPreview();
            this.reset();
            return;
        }

        const coordinate = this.targetLayerRenderer.posToCoord(this.getLocalPos(e));
        if (this.currentCoordinate && sameCoordinate(this.currentCoordinate, coordinate)) return;

        this.currentCoordinate = coordinate;
        this.updatePreview(coordinate);
    }

    protected override onPointerOutside(e: FederatedPointerEvent): void {
        this.clearPreview();
        this.reset();
    }

    private updatePreview(origin: Coordinate): void {
        this.clearPreview();

        if (!this.overlayContainer || !this.currentView || !this.isTargetLayerSupported(this.targetLayerRenderer)) return;
        if (this.targetLayerRenderer.layer.locked || !this.targetLayerRenderer.layer.visible) return;
        if (!this.currentView.session.tilemap.isInBoundary(origin)) return;

        const replacement = getPrimarySelectedTile(this.editorFacade);
        if (!replacement) return;

        const original = this.targetLayerRenderer.layer.getTileRefAt(origin);
        if (isSameTileRef(original, replacement)) return;

        const coordinates = this.collectFloodFill(origin, original);
        coordinates.forEach((coordinate) => {
            const payload = this.createPreviewPayload(coordinate, replacement);
            if (!payload) return;

            this.previewPayloads.get(payload.key)?.sprite.destroy();
            this.overlayContainer!.addChild(payload.sprite);
            this.previewPayloads.set(payload.key, payload);
        });
    }

    private createPreviewPayload(
        coordinate: Coordinate,
        replacement: SelectedTileRef,
    ): TileBucketPreviewPayload | null {
        if (!this.isTargetLayerSupported(this.targetLayerRenderer)) return null;

        const texture = this.editorFacade.textureManager.getTileTexture(
            replacement.tilesetId,
            replacement.tileId,
        );
        if (!texture) return null;

        const sprite = new Sprite(texture);
        sprite.alpha = TileBucketTool.spriteAlpha;

        const position = this.targetLayerRenderer.coordToPos(coordinate);
        sprite.position.set(
            position.x,
            position.y + (this.targetLayerRenderer.tilemap.tileHeight - texture.height),
        );

        return {
            key: coordinateKey(coordinate),
            coordinate,
            sprite,
            tileId: replacement.tileId,
            tilesetId: replacement.tilesetId,
        };
    }

    private commitPreview(): void {
        if (!this.isTargetLayerSupported(this.targetLayerRenderer)) return;
        if (this.targetLayerRenderer.layer.locked || !this.targetLayerRenderer.layer.visible) return;

        const session = this.editorFacade.getActiveTilemapSession();
        if (!session || this.previewPayloads.size === 0) return;

        const updates = Array.from(this.previewPayloads.values()).map((payload) => ({
            coordinate: payload.coordinate,
            tileId: payload.tileId,
            tilesetId: payload.tilesetId,
        }));

        const historyManager = session.historyManager;
        historyManager.startTransaction();
        historyManager.execute(
            new SetTilesCommand(
                this.targetLayerRenderer.tilemap.objectId,
                this.targetLayerRenderer.layer.objectId,
                updates,
            ),
            session,
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

    private clearPreview(): void {
        this.previewPayloads.forEach((payload) => payload.sprite.destroy());
        this.previewPayloads.clear();
    }

    private reset(): void {
        this.currentCoordinate = null;
    }

    private isTargetLayerSupported(layerRenderer: any): layerRenderer is TileLayerRenderer {
        return layerRenderer?.layer instanceof TileLayer;
    }
}