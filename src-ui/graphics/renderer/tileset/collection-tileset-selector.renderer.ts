import {
    Container,
    FederatedMouseEvent,
    FederatedPointerEvent,
    Graphics,
    Point,
} from "pixi.js";

import { TilesetSession } from "@/editor/session/tileset.session";
import * as WorkspaceActions from "@/application/actions/workspace.actions";

import {
    CollectionTileLayout,
    CollectionTilesetGridRenderer,
} from "./collection-tileset-grid.renderer";
import { usePropertyStore } from "@/ui/stores/property.store";
import { TILESET_SELECTION_ALPHA, TILESET_SELECTION_COLOR } from "./tileset-renderer.constants";

export type CreateCollectionTilesetSelectorContext = {
    tilesetSession: TilesetSession;
    parent: Container;
    grid: CollectionTilesetGridRenderer;
};

export class CollectionTilesetSelectorRenderer {
    public readonly graphics: Graphics;

    private tilesetSession: TilesetSession;
    private parent: Container;
    private grid: CollectionTilesetGridRenderer;

    private selectedTileIds: Set<number> = new Set();

    private selectedColor: number = TILESET_SELECTION_COLOR;
    private selectedTransparency: number = TILESET_SELECTION_ALPHA;

    private bindOnPointerDown: (event: FederatedPointerEvent) => void;
    private bindOnTilesetUpdate: () => void;

    constructor(context: CreateCollectionTilesetSelectorContext) {
        this.tilesetSession = context.tilesetSession;
        this.parent = context.parent;
        this.grid = context.grid;

        this.graphics = new Graphics();

        this.bindOnPointerDown = this.onPointerDown.bind(this);
        this.bindOnTilesetUpdate = this.drawSelection.bind(this);

        this.parent.on("pointerdown", this.bindOnPointerDown);

        this.tilesetSession.tileset.eventEmitter.on(
            "update",
            this.bindOnTilesetUpdate,
        );

        this.selectedTileIds = new Set(
            this.tilesetSession.selectionState?.selectedTilesSet ?? [],
        );

        this.drawSelection();
    }

    private onPointerDown(event: FederatedPointerEvent): void {
        const world = new Point(event.globalX, event.globalY);
        const local = this.parent.toLocal(world);

        const layout = this.grid.getLayoutAtPosition({
            x: local.x,
            y: local.y,
        });

        const original = (event as any).originalEvent as MouseEvent;
        const btn = (original.button ?? (event as any).button);
        if (btn != null && btn !== 0) return;

        if (!layout) {
            this.clearSelection();
            return;
        }

        const tile = layout.tile;
        if (tile) usePropertyStore.getState().setObjectId(tile.objectId); // TODO: Refactor using a Service or somthing;

        const isCtrl = !!(original.ctrlKey || original.metaKey);

        if (!isCtrl) {
            this.selectedTileIds.clear();
        }

        if (isCtrl && this.selectedTileIds.has(layout.tile.id)) {
            this.selectedTileIds.delete(layout.tile.id);
        } else {
            this.selectedTileIds.add(layout.tile.id);
        }

        this.saveSelection(layout);
        this.drawSelection();
    }

    private saveSelection(lastLayout: CollectionTileLayout): void {
        const selectedTilesSet = Array.from(this.selectedTileIds);

        this.tilesetSession.updateSelectionState({
            selectedTilesSet,
        });

        WorkspaceActions.saveCurrentWorkspace({
            waitForTimeout: false,
        });
    }

    public clearSelection(): void {
        this.selectedTileIds.clear();

        this.tilesetSession.updateSelectionState({
            selectedTilesSet: [],
        });

        this.graphics.clear();

        WorkspaceActions.saveCurrentWorkspace({
            waitForTimeout: false,
        });
    }

    public drawSelection(): void {
        this.graphics.clear();

        if (this.selectedTileIds.size === 0) return;

        this.graphics.fill({
            color: this.selectedColor,
            alpha: this.selectedTransparency,
        });

        for (const layout of this.grid.getLayouts()) {
            if (!this.selectedTileIds.has(layout.tile.id)) continue;

            this.graphics.rect(
                layout.cellX,
                layout.cellY,
                layout.cellSize,
                layout.cellSize,
            );
        }

        this.graphics.fill();
    }

    public destroy(): void {
        this.parent.off("pointerdown", this.bindOnPointerDown);

        this.tilesetSession.tileset.eventEmitter.off(
            "update",
            this.bindOnTilesetUpdate,
        );

        this.graphics.destroy();
    }
}
