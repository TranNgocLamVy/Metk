import { FederatedPointerEvent } from "pixi.js";

import { Tile, Tileset } from "@/editor/model/tileset/tileset";
import { Result } from "@/shared/types/result";

import { PointLike, TileLayoutResolver } from "./tile-layout-resolver";

import { CollisionObject } from "@/editor/model/collision-object/collision-object";
import { CollisionObjectData } from "@/shared/data-types/collision-object.data";
import { BoxCollision } from "@/editor/model/collision-object/box-collision";
import { PolygonCollision } from "@/editor/model/collision-object/polygon-collision";
import { CollisionObjectFactory } from "@/editor/model/collision-object/collision-object.factory";

export type BoxResizeHandle =
    | "n"
    | "ne"
    | "e"
    | "se"
    | "s"
    | "sw"
    | "w"
    | "nw";

export type CollisionEditorControllerContext = {
    tileset: Tileset;
    layoutResolver: TileLayoutResolver;
    onChange?: () => void;
    onSelectionChange?: () => void;
    onCommit?: (payload: {
        tile: Tile;
        before: CollisionObjectData[];
        after: CollisionObjectData[];
    }) => void;
    minBoxSize?: number;
};

type BoxGeometry = {
    x: number;
    y: number;
    width: number;
    height: number;
};

type ObjectDragSession = {
    type: "object";
    tile: Tile;
    object: CollisionObject;
    before: CollisionObjectData[];
    startPointer: PointLike;
    startObject: {
        x: number;
        y: number;
    };
};

type BoxResizeDragSession = {
    type: "box-resize";
    tile: Tile;
    object: BoxCollision;
    before: CollisionObjectData[];
    handle: BoxResizeHandle;
    startPointer: PointLike;
    startBox: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
};

type PolygonVertexDragSession = {
    type: "polygon-vertex";
    tile: Tile;
    object: PolygonCollision;
    before: CollisionObjectData[];
    pointIndex: number;
    startPointer: PointLike;
    startPoint: PointLike;
};

type DragSession =
    | ObjectDragSession
    | BoxResizeDragSession
    | PolygonVertexDragSession;

export class CollisionEditorController {
    private readonly tileset: Tileset;
    private readonly layoutResolver: TileLayoutResolver;
    private readonly minBoxSize: number;

    private onChange?: () => void;
    private onSelectionChange?: () => void;
    private onCommit?: CollisionEditorControllerContext["onCommit"];

    private selectedTile: Tile | null = null;
    private selectedObjectId: string | null = null;
    private selectedPolygonPointIndex: number | null = null;

    private dragSession: DragSession | null = null;

    public constructor(context: CollisionEditorControllerContext) {
        this.tileset = context.tileset;
        this.layoutResolver = context.layoutResolver;

        this.onChange = context.onChange;
        this.onSelectionChange = context.onSelectionChange;
        this.onCommit = context.onCommit;

        this.minBoxSize = context.minBoxSize ?? 1;
    }

    public getSelectedTile(): Tile | null {
        return this.selectedTile;
    }

    public getSelectedObject(): CollisionObject | null {
        if (!this.selectedTile || !this.selectedObjectId) return null;

        return (
            this.selectedTile.collisionObjects.find(
                (object) => object.id === this.selectedObjectId,
            ) ?? null
        );
    }

    public getSelectedPolygonPointIndex(): number | null {
        return this.selectedPolygonPointIndex;
    }

    public hasActiveDrag(): boolean {
        return this.dragSession != null;
    }

    public setCallbacks(callbacks: {
        onChange?: () => void;
        onSelectionChange?: () => void;
        onCommit?: CollisionEditorControllerContext["onCommit"];
    }): void {
        this.onChange = callbacks.onChange;
        this.onSelectionChange = callbacks.onSelectionChange;
        this.onCommit = callbacks.onCommit;
    }

    public selectTile(tile: Tile | null): void {
        if (this.selectedTile === tile) return;

        this.selectedTile = tile;
        this.selectedObjectId = null;
        this.selectedPolygonPointIndex = null;

        this.emitSelectionChange();
        this.emitChange();
    }

    public selectTileById(tileId: number): void {
        const tile = this.tileset.getTileFromId(tileId);
        this.selectTile(tile);
    }

    public selectTileAtPointer(event: FederatedPointerEvent | PointLike): Tile | null {
        const layout = this.layoutResolver.resolveAtGlobalPosition(event);
        const tile = layout?.tile ?? null;

        this.selectTile(tile);

        return tile;
    }

    public selectObject(objectId: string | null): void {
        if (
            objectId &&
            !this.selectedTile?.collisionObjects.some(
                (object) => object.id === objectId,
            )
        ) {
            return;
        }

        this.selectedObjectId = objectId;
        this.selectedPolygonPointIndex = null;

        this.emitSelectionChange();
        this.emitChange();
    }

    public selectPolygonPoint(objectId: string, pointIndex: number): void {
        if (!this.selectedTile) return;

        const object = this.selectedTile.collisionObjects.find(
            (candidate) => candidate.id === objectId,
        );

        if (!(object instanceof PolygonCollision)) return;
        if (!object.points[pointIndex]) return;

        this.selectedObjectId = object.id;
        this.selectedPolygonPointIndex = pointIndex;

        this.emitSelectionChange();
        this.emitChange();
    }

    public addCollisionObject(tile: Tile, object: CollisionObject): Result {
        const before = this.snapshot(tile);
        const after = [...before, object.serialize()];

        const result = this.commit(tile, before, after);

        if (result.status === Result.Status.Success) {
            this.selectTile(tile);
            this.selectObject(object.id);
        }

        return result;
    }

    public replaceCollisionObject(tile: Tile, object: CollisionObject): Result {
        const before = this.snapshot(tile);

        const exists = before.some((item) => item.id === object.id);

        const after = exists
            ? before.map((item) =>
                item.id === object.id ? object.serialize() : item,
            )
            : [...before, object.serialize()];

        return this.commit(tile, before, after);
    }

    public removeCollisionObject(tile: Tile, objectId: string): Result {
        const before = this.snapshot(tile);
        const after = before.filter((item) => item.id !== objectId);

        const result = this.commit(tile, before, after);

        if (
            result.status === Result.Status.Success &&
            this.selectedObjectId === objectId
        ) {
            this.selectedObjectId = null;
            this.selectedPolygonPointIndex = null;
            this.emitSelectionChange();
        }

        return result;
    }

    public removeSelectedCollisionObject(): Result {
        if (!this.selectedTile || !this.selectedObjectId) {
            return Result.Cancel("No collision object selected");
        }

        return this.removeCollisionObject(
            this.selectedTile,
            this.selectedObjectId,
        );
    }

    public beginObjectDrag(
        object: CollisionObject,
        event: FederatedPointerEvent | PointLike,
    ): Result {
        const tile = this.findObjectTile(object);

        if (!tile) return Result.Error("Collision object tile not found");
        if (object.locked) return Result.Cancel("Collision object is locked");

        const pointer = this.layoutResolver.globalToTileLocal(tile, event);

        if (!pointer) return Result.Cancel("Pointer is outside tile");

        this.selectTile(tile);
        this.selectObject(object.id);

        this.dragSession = {
            type: "object",
            tile,
            object,
            before: this.snapshot(tile),
            startPointer: pointer,
            startObject: {
                x: object.x,
                y: object.y,
            },
        };

        return Result.Success();
    }

    public beginBoxResize(
        object: BoxCollision,
        handle: BoxResizeHandle,
        event: FederatedPointerEvent | PointLike,
    ): Result {
        const tile = this.findObjectTile(object);

        if (!tile) return Result.Error("Collision object tile not found");
        if (object.locked) return Result.Cancel("Collision object is locked");

        const pointer = this.layoutResolver.globalToTileLocal(tile, event);

        if (!pointer) return Result.Cancel("Pointer is outside tile");

        this.selectTile(tile);
        this.selectObject(object.id);

        this.dragSession = {
            type: "box-resize",
            tile,
            object,
            before: this.snapshot(tile),
            handle,
            startPointer: pointer,
            startBox: {
                x: object.x,
                y: object.y,
                width: object.width,
                height: object.height,
            },
        };

        return Result.Success();
    }

    public beginPolygonVertexDrag(
        object: PolygonCollision,
        pointIndex: number,
        event: FederatedPointerEvent | PointLike,
    ): Result {
        const tile = this.findObjectTile(object);

        if (!tile) return Result.Error("Collision object tile not found");
        if (object.locked) return Result.Cancel("Collision object is locked");
        if (!object.points[pointIndex]) {
            return Result.Error("Polygon point not found");
        }

        const pointer = this.layoutResolver.globalToTileLocal(tile, event);

        if (!pointer) return Result.Cancel("Pointer is outside tile");

        this.selectTile(tile);
        this.selectPolygonPoint(object.id, pointIndex);

        this.dragSession = {
            type: "polygon-vertex",
            tile,
            object,
            before: this.snapshot(tile),
            pointIndex,
            startPointer: pointer,
            startPoint: {
                ...object.points[pointIndex],
            },
        };

        return Result.Success();
    }

    public updateDrag(event: FederatedPointerEvent | PointLike): void {
        if (!this.dragSession) return;
    
        const pointer = this.layoutResolver.globalToTileLocal(
            this.dragSession.tile,
            event,
        );
    
        if (!pointer) return;
    
        const dx = pointer.x - this.dragSession.startPointer.x;
        const dy = pointer.y - this.dragSession.startPointer.y;
        const snapToPixel = this.shouldSnapToPixel(event);
    
        switch (this.dragSession.type) {
            case "object":
                this.updateObjectDrag(this.dragSession, dx, dy, snapToPixel);
                break;
    
            case "box-resize":
                this.updateBoxResizeDrag(this.dragSession, dx, dy, snapToPixel);
                break;
    
            case "polygon-vertex":
                this.updatePolygonVertexDrag(this.dragSession, dx, dy, snapToPixel);
                break;
        }
    
        this.emitTileCollisionPreview(this.dragSession.tile);
        this.emitChange();
    }

    public endDrag(): Result {
        if (!this.dragSession) {
            return Result.Cancel("No active drag");
        }

        const session = this.dragSession;
        this.dragSession = null;

        const after = this.snapshot(session.tile);

        if (this.isSameSnapshot(session.before, after)) {
            this.emitChange();
            return Result.Cancel("Collision object unchanged");
        }

        return this.commit(session.tile, session.before, after);
    }

    public cancelDrag(): void {
        if (!this.dragSession) return;

        const session = this.dragSession;
        this.dragSession = null;

        this.applySnapshot(session.tile, session.before);
        this.emitChange();
    }

    public moveSelectedObjectBy(dx: number, dy: number): Result {
        const tile = this.selectedTile;
        const object = this.getSelectedObject();

        if (!tile || !object) {
            return Result.Cancel("No collision object selected");
        }

        if (object.locked) {
            return Result.Cancel("Collision object is locked");
        }

        const before = this.snapshot(tile);

        object.moveBy(dx, dy);

        const after = this.snapshot(tile);

        return this.commit(tile, before, after);
    }

    public moveSelectedObjectTo(x: number, y: number): Result {
        const tile = this.selectedTile;
        const object = this.getSelectedObject();

        if (!tile || !object) {
            return Result.Cancel("No collision object selected");
        }

        if (object.locked) {
            return Result.Cancel("Collision object is locked");
        }

        const before = this.snapshot(tile);

        object.moveTo(x, y);

        const after = this.snapshot(tile);

        return this.commit(tile, before, after);
    }

    public insertPolygonPoint(
        object: PolygonCollision,
        pointIndex: number,
        point: PointLike,
    ): Result {
        const tile = this.findObjectTile(object);

        if (!tile) return Result.Error("Collision object tile not found");
        if (object.locked) return Result.Cancel("Collision object is locked");

        const before = this.snapshot(tile);

        object.insertPoint(pointIndex, point);

        const after = this.snapshot(tile);

        const result = this.commit(tile, before, after);

        if (result.status === Result.Status.Success) {
            this.selectTile(tile);
            this.selectPolygonPoint(object.id, pointIndex);
        }

        return result;
    }

    public removePolygonPoint(
        object: PolygonCollision,
        pointIndex: number,
    ): Result {
        const tile = this.findObjectTile(object);

        if (!tile) return Result.Error("Collision object tile not found");
        if (object.locked) return Result.Cancel("Collision object is locked");
        if (!object.points[pointIndex]) {
            return Result.Error("Polygon point not found");
        }

        if (object.points.length <= 3) {
            return Result.Cancel("Polygon must have at least 3 points");
        }

        const before = this.snapshot(tile);

        object.removePoint(pointIndex);

        const after = this.snapshot(tile);

        const result = this.commit(tile, before, after);

        if (result.status === Result.Status.Success) {
            this.selectedPolygonPointIndex = null;
            this.emitSelectionChange();
        }

        return result;
    }

    private updateObjectDrag(
        session: ObjectDragSession,
        dx: number,
        dy: number,
        snapToPixel: boolean,
    ): void {
        const x = session.startObject.x + dx;
        const y = session.startObject.y + dy;
    
        session.object.moveTo(
            snapToPixel ? this.snapPixel(x) : x,
            snapToPixel ? this.snapPixel(y) : y,
        );
    }

    private updateBoxResizeDrag(
        session: BoxResizeDragSession,
        dx: number,
        dy: number,
        snapToPixel: boolean,
    ): void {
        const next = this.calculateResizedBox(
            session.startBox,
            session.handle,
            dx,
            dy,
        );
    
        const box = snapToPixel
            ? this.snapBoxToPixel(next, session.handle)
            : next;
    
        session.object.moveTo(box.x, box.y);
        session.object.resize(box.width, box.height);
    }

    private updatePolygonVertexDrag(
        session: PolygonVertexDragSession,
        dx: number,
        dy: number,
        snapToPixel: boolean,
    ): void {
        const x = session.startPoint.x + dx;
        const y = session.startPoint.y + dy;
    
        session.object.movePoint(
            session.pointIndex,
            snapToPixel ? this.snapPixel(x) : x,
            snapToPixel ? this.snapPixel(y) : y,
        );
    }

    private calculateResizedBox(
        startBox: {
            x: number;
            y: number;
            width: number;
            height: number;
        },
        handle: BoxResizeHandle,
        dx: number,
        dy: number,
    ): {
        x: number;
        y: number;
        width: number;
        height: number;
    } {
        let x = startBox.x;
        let y = startBox.y;
        let width = startBox.width;
        let height = startBox.height;

        const affectsWest = handle.includes("w");
        const affectsEast = handle.includes("e");
        const affectsNorth = handle.includes("n");
        const affectsSouth = handle.includes("s");

        if (affectsWest) {
            x = startBox.x + dx;
            width = startBox.width - dx;

            if (width < this.minBoxSize) {
                width = this.minBoxSize;
                x = startBox.x + startBox.width - this.minBoxSize;
            }
        }

        if (affectsEast) {
            width = startBox.width + dx;

            if (width < this.minBoxSize) {
                width = this.minBoxSize;
            }
        }

        if (affectsNorth) {
            y = startBox.y + dy;
            height = startBox.height - dy;

            if (height < this.minBoxSize) {
                height = this.minBoxSize;
                y = startBox.y + startBox.height - this.minBoxSize;
            }
        }

        if (affectsSouth) {
            height = startBox.height + dy;

            if (height < this.minBoxSize) {
                height = this.minBoxSize;
            }
        }

        return {
            x,
            y,
            width,
            height,
        };
    }

    private shouldSnapToPixel(eventOrPoint: FederatedPointerEvent | PointLike): boolean {
        const event = eventOrPoint as FederatedPointerEvent & {
            ctrlKey?: boolean;
            nativeEvent?: MouseEvent;
            originalEvent?: MouseEvent;
        };
    
        return (
            event.ctrlKey === true ||
            event.nativeEvent?.ctrlKey === true ||
            event.originalEvent?.ctrlKey === true
        );
    }
    
    private snapPixel(value: number): number {
        return Math.round(value);
    }
    
    private snapBoxToPixel(
        box: BoxGeometry,
        handle: BoxResizeHandle,
    ): BoxGeometry {
        let left = this.snapPixel(box.x);
        let top = this.snapPixel(box.y);
        let right = this.snapPixel(box.x + box.width);
        let bottom = this.snapPixel(box.y + box.height);
    
        const minSize = Math.max(1, this.snapPixel(this.minBoxSize));
    
        if (right - left < minSize) {
            if (handle.includes("w")) {
                left = right - minSize;
            } else {
                right = left + minSize;
            }
        }
    
        if (bottom - top < minSize) {
            if (handle.includes("n")) {
                top = bottom - minSize;
            } else {
                bottom = top + minSize;
            }
        }
    
        return {
            x: left,
            y: top,
            width: right - left,
            height: bottom - top,
        };
    }

    private commit(tile: Tile, before: CollisionObjectData[], after: CollisionObjectData[]): Result {
        if (this.isSameSnapshot(before, after)) {
            return Result.Cancel("Collision object unchanged");
        }

        this.applySnapshot(tile, after);

        this.emitChange();

        this.onCommit?.({
            tile,
            before,
            after,
        });

        return Result.Success();
    }

    private snapshot(tile: Tile): CollisionObjectData[] {
        return tile.collisionObjects.map((object) => object.serialize());
    }

    private applySnapshot(tile: Tile, snapshot: CollisionObjectData[]): void {
        tile.setCollisionObjects(
            snapshot
                .map((item) => CollisionObjectFactory.fromData(item))
                .filter((item): item is CollisionObject => item != null),
        );
    }

    private isSameSnapshot(
        a: CollisionObjectData[],
        b: CollisionObjectData[],
    ): boolean {
        return JSON.stringify(a) === JSON.stringify(b);
    }

    private findObjectTile(object: CollisionObject): Tile | null {
        if (
            this.selectedTile &&
            this.selectedTile.collisionObjects.some(
                (candidate) => candidate.id === object.id,
            )
        ) {
            return this.selectedTile;
        }

        return (
            this.tileset.tiles.find((tile) => {
                return tile.collisionObjects.some(
                    (candidate) => candidate.id === object.id,
                );
            }) ?? null
        );
    }

    private emitTileCollisionPreview(tile: Tile): void {
        tile.eventEmitter.emit(
            "updateProperty",
            "collisionObjects",
            tile.collisionObjects,
            {
                origin: "preview",
                source: "CollisionEditorController",
            },
        );

        this.tileset.eventEmitter.emit("update");
    }

    private emitChange(): void {
        this.onChange?.();
    }

    private emitSelectionChange(): void {
        this.onSelectionChange?.();
    }
}