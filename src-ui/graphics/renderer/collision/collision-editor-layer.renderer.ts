import { Container, FederatedPointerEvent } from "pixi.js";

import { CollisionObjectRenderer } from "./collision-object-renderer";
import { CollisionRendererFactory } from "./collision-renderer.factory";

import { CollisionObject } from "@/editor/model/collision-object/collision-object";
import { Tile, Tileset } from "@/editor/model/tileset/tileset";

import {
    TileLayout,
    TileLayoutResolver,
} from "./tile-layout-resolver";

import { CollisionEditorController } from "./collision-editor.controller";

export type CollisionEditorLayerRendererMode =
    | "selected-tile"
    | "selected-tiles"
    | "all-tiles";

export type CollisionEditorLayerRendererContext = {
    /**
     * Dialog-local tileset being edited.
     * No TilesetSession required.
     */
    tileset: Tileset;

    layoutResolver: TileLayoutResolver;
    editorController: CollisionEditorController;

    parent?: Container;

    mode?: CollisionEditorLayerRendererMode;
    renderHidden?: boolean;

    /**
     * Used only when mode === "selected-tiles".
     * In EditTilesetDialog this should come from dialog state, not TilesetSession.
     */
    getSelectedTileIds?: () => number[];

    /**
     * If true, this layer forwards pointermove / pointerup to CollisionEditorController.
     */
    bindDragEvents?: boolean;

    /**
     * When provided, only this object is rendered as editable.
     * Other collision objects remain visible but use inactive styling.
     */
    getSelectedObjectId?: () => string | null;
};

export class CollisionEditorLayerRenderer {
    public readonly container = new Container();

    private readonly tileset: Tileset;
    private readonly layoutResolver: TileLayoutResolver;
    private readonly editorController: CollisionEditorController;
    private readonly getSelectedTileIds?: () => number[];
    private readonly getSelectedObjectId?: () => string | null;

    private readonly objectRenderers = new Map<
        string,
        CollisionObjectRenderer<CollisionObject>
    >();

    private mode: CollisionEditorLayerRendererMode;
    private renderHidden: boolean;
    private destroyed = false;
    private dragEventsBound = false;

    private readonly boundPointerMove: (event: FederatedPointerEvent) => void;
    private readonly boundPointerUp: (event: FederatedPointerEvent) => void;

    public constructor(context: CollisionEditorLayerRendererContext) {
        this.tileset = context.tileset;
        this.layoutResolver = context.layoutResolver;
        this.editorController = context.editorController;
        this.getSelectedTileIds = context.getSelectedTileIds;
        this.getSelectedObjectId = context.getSelectedObjectId;

        this.mode = context.mode ?? "selected-tile";
        this.renderHidden = context.renderHidden ?? false;

        this.container.label = "CollisionEditorLayer";
        this.container.eventMode = "static";
        this.container.sortableChildren = true;

        this.boundPointerMove = this.onPointerMove.bind(this);
        this.boundPointerUp = this.onPointerUp.bind(this);

        if (context.parent) {
            context.parent.addChild(this.container);
        }

        if (context.bindDragEvents ?? false) {
            this.bindDragEvents();
        }
    }

    public setMode(mode: CollisionEditorLayerRendererMode): void {
        if (this.mode === mode) return;

        this.mode = mode;
        this.render();
    }

    public getMode(): CollisionEditorLayerRendererMode {
        return this.mode;
    }

    public setRenderHidden(renderHidden: boolean): void {
        if (this.renderHidden === renderHidden) return;

        this.renderHidden = renderHidden;
        this.render();
    }

    public getRenderHidden(): boolean {
        return this.renderHidden;
    }

    public render(): void {
        if (this.destroyed) return;

        this.clear();

        for (const tile of this.getTilesToRender()) {
            this.renderTile(tile, {
                clearBeforeRender: false,
            });
        }
    }

    public renderTile(
        tile: Tile,
        options: {
            clearBeforeRender?: boolean;
        } = {},
    ): void {
        if (this.destroyed) return;

        if (options.clearBeforeRender ?? true) {
            this.clear();
        }

        const layout = this.layoutResolver.resolve(tile);

        if (!layout) return;

        for (const object of tile.collisionObjects) {
            if (!this.shouldRenderObject(object)) continue;

            this.renderObject(tile, object, layout);
        }
    }

    public renderSelectedTile(): void {
        this.clear();

        const tile = this.editorController.getSelectedTile();

        if (!tile) return;

        this.renderTile(tile, {
            clearBeforeRender: false,
        });
    }

    public renderSelectedTiles(): void {
        this.clear();

        for (const tileId of this.getDialogSelectedTileIds()) {
            const tile = this.tileset.getTileFromId(tileId);

            if (!tile) continue;

            this.renderTile(tile, {
                clearBeforeRender: false,
            });
        }
    }

    public renderAllTiles(): void {
        this.clear();

        for (const tile of this.tileset.tiles) {
            this.renderTile(tile, {
                clearBeforeRender: false,
            });
        }
    }

    public refreshObject(objectId: string): void {
        const renderer = this.objectRenderers.get(objectId);

        if (!renderer) {
            this.render();
            return;
        }

        renderer.render();
    }

    public getRenderer(
        objectId: string,
    ): CollisionObjectRenderer<CollisionObject> | null {
        return this.objectRenderers.get(objectId) ?? null;
    }

    public hasRenderer(objectId: string): boolean {
        return this.objectRenderers.has(objectId);
    }

    public clear(): void {
        for (const renderer of this.objectRenderers.values()) {
            renderer.destroy();
        }

        this.objectRenderers.clear();
        this.container.removeChildren();
    }

    public bindDragEvents(): void {
        if (this.dragEventsBound) return;

        this.dragEventsBound = true;

        this.container.on("pointermove", this.boundPointerMove);
        this.container.on("pointerup", this.boundPointerUp);
        this.container.on("pointerupoutside", this.boundPointerUp);
    }

    public unbindDragEvents(): void {
        if (!this.dragEventsBound) return;

        this.dragEventsBound = false;

        this.container.off("pointermove", this.boundPointerMove);
        this.container.off("pointerup", this.boundPointerUp);
        this.container.off("pointerupoutside", this.boundPointerUp);
    }

    public destroy(): void {
        if (this.destroyed) return;

        this.destroyed = true;

        this.unbindDragEvents();
        this.clear();

        this.container.removeFromParent();
        this.container.destroy({
            children: true,
        });
    }

    private renderObject(tile: Tile, object: CollisionObject, layout: TileLayout): void {
        const hasSelectedObjectFilter = this.getSelectedObjectId != null;
        const selectedObjectId = this.getSelectedObjectId?.() ?? null;
        const selected =
            hasSelectedObjectFilter ? selectedObjectId === object.id : true;

        const renderer = CollisionRendererFactory.create(object, {
            parent: this.container,
            tile,
            tileOrigin: {
                x: layout.x,
                y: layout.y,
            },
            scale: {
                x: layout.scaleX,
                y: layout.scaleY,
            },
            editor: this.editorController,
            layout,
            selected,
            editable: selected,
        });

        renderer.render();

        this.objectRenderers.set(object.id, renderer);
        this.container.addChild(renderer.container);
    }

    private getTilesToRender(): Tile[] {
        switch (this.mode) {
            case "selected-tile": {
                const tile = this.editorController.getSelectedTile();

                return tile ? [tile] : [];
            }

            case "selected-tiles": {
                return this.getDialogSelectedTileIds()
                    .map((tileId) => this.tileset.getTileFromId(tileId))
                    .filter((tile): tile is Tile => tile != null);
            }

            case "all-tiles":
                return [...this.tileset.tiles];

            default:
                return [];
        }
    }

    private getDialogSelectedTileIds(): number[] {
        if (!this.getSelectedTileIds) return [];

        return this.getSelectedTileIds();
    }

    private shouldRenderObject(object: CollisionObject): boolean {
        if (this.renderHidden) return true;

        return object.visible;
    }

    private onPointerMove(event: FederatedPointerEvent): void {
        this.editorController.updateDrag(event);
    }

    private onPointerUp(): void {
        this.editorController.endDrag();
    }
}
