import { Container, FederatedPointerEvent, Graphics, Point } from "pixi.js";

import { TilesetSession } from "@/editor/session/tileset.session";
import { Tile, Tileset } from "@/editor/model/tileset/tileset";
import { WorkspaceService } from "@/shared/services/workspace.service";

export type CreateTilesetViewSelectorContext = {
    tileset: Tileset;
    tilesetSession: TilesetSession;
    parent: Container;
    gap: number;
}

export class TilesetSelectorRenderer {
    private tileset: Tileset;
    private tilesetSession: TilesetSession;
    private parent: Container;
    public readonly graphics: Graphics;
    private gap: number = 0;

    private selectedTilesShape: (Tile | null)[][] = [];
    private selectedTilesSet: Set<number> = new Set();
    private pivot: Coordinate | null;
    private topLeft: Coordinate | null;

    private dragging: boolean = false;
    private selectionType: "select" | "deselect" = "select";
    private previewTilesShape: (Tile | null)[][] = [];
    private previewTilesSet: Set<number> = new Set();
    private previewStartCoords: Coordinate | null = null;
    private previewEndCoords: Coordinate | null = null;
    private previewTopLeft: Coordinate | null = null;

    private selectedColor: number = 0x0090f1;
    private selectedTransparency: number = 0.4;


    private bindOnPointerDown: (event: FederatedPointerEvent) => void;
    private bindOnPointerMove: (event: FederatedPointerEvent) => void;
    private bindOnPointerUp: (event: FederatedPointerEvent) => void;

    constructor(editorFacade: CreateTilesetViewSelectorContext) {
        this.tileset = editorFacade.tileset;
        this.tilesetSession = editorFacade.tilesetSession;
        this.parent = editorFacade.parent;
        this.gap = editorFacade.gap;

        this.graphics = new Graphics();
        this.parent.addChild(this.graphics);

        this.bindOnPointerDown = this.onPointerDown.bind(this);
        this.bindOnPointerMove = this.onPointerMove.bind(this);
        this.bindOnPointerUp = this.onPointerUp.bind(this);

        this.parent.on("pointerdown", this.bindOnPointerDown);

        const { selectedTilesSet, pivot } = this.tilesetSession.selectionState || { selectedTilesSet: [] };
        if (selectedTilesSet && selectedTilesSet.length > 0) {
            this.selectedTilesSet = new Set<number>();
            selectedTilesSet.forEach((id) => {
                this.selectedTilesSet.add(id);
            })
            if (pivot) this.pivot = pivot;
            this.topLeft = this.getTopLeftOfRect(this.selectedTilesSet);
            if (!this.topLeft) {
                this.selectedTilesSet = new Set();
                this.pivot = null;
                this.topLeft = null;
            }
            this.updateSelectedRect();
            this.drawRectShape();
        }
    }

    private onPointerDown(event: FederatedPointerEvent) {
        const world = new Point(event.globalX, event.globalY);
        const local = this.parent.toLocal(world);

        if (local.x < 0 || local.y < 0 || local.x > this.tileset.image.width || local.y > this.tileset.image.height) return;
        const id = this.posToId(local.x, local.y);
        const coords = this.posToCoordinates(local.x, local.y);
        if (id < 0 || !coords) {
            this.clearSelection();
            return;
        }

        const original = (event as any).originalEvent as MouseEvent;
        const btn = (original.button ?? (event as any).button);
        if (btn != null && btn !== 0) return;

        this.dragging = true;
        this.selectionType = this.selectedTilesSet.has(id) ? "deselect" : "select";

        const isCtrl = !!(original.ctrlKey || original.metaKey);
        if (!isCtrl) this.selectedTilesSet.clear();

        this.previewTilesSet = new Set();
        this.previewTilesSet.add(id);
        this.previewStartCoords = { ...coords };
        this.previewEndCoords = { ...coords };
        this.previewTopLeft = { ...coords };

        this.updatePreviewRect();
        this.updateSelectedRect();
        this.drawRectShape();

        this.parent.on("pointermove", this.bindOnPointerMove);
        this.parent.on("pointerup", this.bindOnPointerUp);
        this.parent.on("pointerupoutside", this.bindOnPointerUp);
    }

    private onPointerMove(event: FederatedPointerEvent) {
        if (!this.dragging) return;
        const world = new Point(event.globalX, event.globalY);
        const local = this.parent.toLocal(world);
        const id = this.posToId(local.x, local.y);
        const coords = this.posToCoordinates(local.x, local.y);

        if (id < 0) return;
        if (!coords) return;

        this.previewEndCoords = { ...coords };

        const startRow = Math.min(this.previewStartCoords!.row, this.previewEndCoords.row);
        const endRow = Math.max(this.previewStartCoords!.row, this.previewEndCoords.row);
        const startCol = Math.min(this.previewStartCoords!.col, this.previewEndCoords.col);
        const endCol = Math.max(this.previewStartCoords!.col, this.previewEndCoords.col);


        this.previewTilesSet = new Set<number>();
        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                const id = this.tileset.getTileFromCoordinates(r, c)?.id ?? -1;
                if (id >= 0) this.previewTilesSet.add(id);
            }
        }

        this.previewTopLeft = { row: startRow, col: startCol };
        this.updatePreviewRect();
        this.drawRectShape();
    }

    private onPointerUp(event: FederatedPointerEvent) {
        if (!this.dragging) return;
        this.dragging = false;

        const mergeRect = this.mergeRects();
        if (!mergeRect) return;

        const { rect: rows, topLeft, set: mergeSet } = mergeRect;

        const startRow = topLeft.row;
        const startCol = topLeft.col;
        const endRow = topLeft.row + rows.length - 1;
        const endCol = topLeft.col + rows[0].length - 1;

        this.previewTilesSet = new Set();
        this.previewStartCoords = null;
        this.previewEndCoords = null;
        this.previewTopLeft = null;

        this.parent.off("pointermove", this.bindOnPointerMove);
        this.parent.off("pointerup", this.bindOnPointerUp);
        this.parent.off("pointerupoutside", this.bindOnPointerUp);

        this.selectedTilesSet = mergeSet;
        this.selectedTilesShape = rows;
        this.topLeft = { ...topLeft };
        this.pivot = { row: Math.floor((endRow + startRow) / 2), col: Math.floor((endCol + startCol) / 2) };

        if (this.selectedTilesSet.size === 0) {
            this.selectedTilesShape = [];
            this.pivot = null;
            this.topLeft = null;
            this.graphics.clear();
            return;
        }

        this.drawRectShape();

        this.tilesetSession.updateSelectionState({ selectedTilesSet: Array.from(this.selectedTilesSet), pivot: this.pivot });
        this.tilesetSession.updatePivot(this.pivot);
        WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
    }

    public clearSelection() {
        this.selectedTilesShape = [];
        this.selectedTilesSet.clear();
        this.pivot = null;
        this.topLeft = null;

        this.previewTilesSet.clear();
        this.previewStartCoords = null;
        this.previewEndCoords = null;
        this.previewTopLeft = null;

        this.dragging = false;

        this.graphics.clear();
    }

    private drawRectShape() {
        this.graphics.clear();
        const merged = this.mergeRects();

        if (!merged) return;
        const { rect: shape, topLeft } = merged;

        const tilewidth = this.tileset.tilewidth;
        const tileheight = this.tileset.tileheight;
        const rowsCount = shape.length;
        const colsCount = shape[0].length;

        const grid: boolean[][] = [];
        for (let r = 0; r < rowsCount; r++) {
            grid[r] = [];
            for (let c = 0; c < colsCount; c++) {
                grid[r][c] = !!shape[r][c];
            }
        }

        const processed: boolean[][] = Array.from({ length: rowsCount }, () => Array(colsCount).fill(false));

        this.graphics.fill({ color: this.selectedColor, alpha: this.selectedTransparency });
        for (let r = 0; r < rowsCount; r++) {
            for (let c = 0; c < colsCount; c++) {
                if (!grid[r][c] || processed[r][c]) continue;
                let run = 1;
                while (c + run < colsCount && grid[r][c + run] && !processed[r][c + run]) run++;
                let height = 1;
                outer3: while (r + height < rowsCount) {
                    for (let cc = c; cc < c + run; cc++) {
                        if (!grid[r + height][cc] || processed[r + height][cc]) break outer3;
                    }
                    height++;
                }
                for (let rr = r; rr < r + height; rr++) {
                    for (let cc = c; cc < c + run; cc++) processed[rr][cc] = true;
                }
                const minR = topLeft.row + r;
                const minC = topLeft.col + c;
                const x = minC * (tilewidth + this.gap);
                const y = minR * (tileheight + this.gap);
                const w = run * (tilewidth + this.gap) - this.gap;
                const h = height * (tileheight + this.gap) - this.gap;
                this.graphics.rect(x, y, w, h);
            }
        }
        this.graphics.fill();
    }

    private updateSelectedRect() {
        if (this.selectedTilesSet.size === 0) {
            this.selectedTilesShape = [];
            this.pivot = null;
            this.topLeft = null;

            this.tilesetSession.updateSelectionState({ selectedTilesSet: [], pivot: undefined });
            this.tilesetSession.updatePivot(this.pivot);
            WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
        }

        if (this.selectedTilesSet.size === 0 && this.previewTilesSet.size === 0) {
            this.graphics.clear();
            return;
        }

        let minRow = Infinity, maxRow = -Infinity, minCol = Infinity, maxCol = -Infinity;
        this.selectedTilesSet.forEach(i => {
            const { row, col } = this.tileset.getCoordinatesFromTile(i)!;
            minRow = Math.min(minRow, row);
            maxRow = Math.max(maxRow, row);
            minCol = Math.min(minCol, col);
            maxCol = Math.max(maxCol, col);
        });
        this.topLeft = { row: minRow, col: minCol };

        const rows: (Tile | null)[][] = [];
        for (let curRow = minRow; curRow <= maxRow; curRow++) {
            const colsArr: (Tile | null)[] = [];
            for (let curCol = minCol; curCol <= maxCol; curCol++) {
                const absRow = curRow;
                const absCol = curCol;
                const tile = this.tileset.getTileFromCoordinates(absRow, absCol);
                if (!this.selectedTilesSet.has(tile?.id ?? -1)) {
                    colsArr.push(null);
                } else {
                    colsArr.push(tile);
                }
            }
            rows.push(colsArr);
        }

        this.selectedTilesShape = rows;

        // TODO: Custom pivot selection
        this.pivot = { row: Math.floor((minRow + maxRow) / 2), col: Math.floor((minCol + maxCol) / 2) };

        const mappedSelectedTiles = Array.from(this.selectedTilesSet);
        this.tilesetSession.updateSelectionState({ selectedTilesSet: mappedSelectedTiles, pivot: this.pivot });
        this.tilesetSession.updatePivot(this.pivot);
        WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
    }

    private updatePreviewRect() {
        if (this.previewTilesSet.size === 0 || !this.previewStartCoords || !this.previewEndCoords || !this.previewTopLeft) {
            this.previewTilesShape = [];
            this.previewStartCoords = null;
            this.previewEndCoords = null;
            this.previewTopLeft = null;
            if (this.selectedTilesSet.size === 0 && this.previewTilesSet.size === 0) {
                this.graphics.clear();
            }
            return;
        }

        const startRow = Math.min(this.previewStartCoords.row, this.previewEndCoords.row);
        const endRow = Math.max(this.previewStartCoords.row, this.previewEndCoords.row);
        const startCol = Math.min(this.previewStartCoords.col, this.previewEndCoords.col);
        const endCol = Math.max(this.previewStartCoords.col, this.previewEndCoords.col);

        this.previewTopLeft = { row: startRow, col: startCol };

        const rows: (Tile | null)[][] = [];
        for (let curRow = startRow; curRow <= endRow; curRow++) {
            const colsArr: (Tile | null)[] = [];
            for (let curCol = startCol; curCol <= endCol; curCol++) {
                const absRow = curRow;
                const absCol = curCol;
                const tile = this.tileset.getTileFromCoordinates(absRow, absCol);
                if (!this.previewTilesSet.has(tile?.id ?? -1)) {
                    colsArr.push(null);
                } else {
                    colsArr.push(tile);
                }
            }
            rows.push(colsArr);
        }
        this.previewTilesShape = rows;
    }

    private mergeRects(): {
        set: Set<number>,
        rect: (Tile | null)[][]
        topLeft: Coordinate
    } | null {
        // Merge selectedTilesShape and previewTilesShape into one shape using xor operation
        if (this.selectedTilesSet.size === 0 && this.previewTilesSet.size === 0) {
            return null;
        }
        if (this.selectedTilesSet.size === 0) {
            if (!this.previewTopLeft) return null;
            return { rect: this.previewTilesShape, topLeft: this.previewTopLeft, set: new Set(this.previewTilesSet) };
        }
        if (this.previewTilesSet.size === 0) {
            if (!this.topLeft) return null;
            return { rect: this.selectedTilesShape, topLeft: this.topLeft, set: new Set(this.selectedTilesSet) };
        }

        if (!this.topLeft || !this.previewTopLeft) {
            console.warn("Cannot merge rects: missing topLeft or previewTopLeft");
            return null;
        }

        const startRow = Math.min(this.topLeft.row, this.previewTopLeft.row);
        const startCol = Math.min(this.topLeft.col, this.previewTopLeft.col);
        const endRow = Math.max(this.topLeft.row + this.selectedTilesShape.length - 1, this.previewTopLeft.row + this.previewTilesShape.length - 1);
        const endCol = Math.max(this.topLeft.col + this.selectedTilesShape[0].length - 1, this.previewTopLeft.col + this.previewTilesShape[0].length - 1);

        const mergeSet = new Set<number>(this.selectedTilesSet);
        this.previewTilesSet.forEach(id => {
            if (this.selectionType === "select") {
                mergeSet.add(id);
            } else {
                mergeSet.delete(id);
            }
        });

        const rows: (Tile | null)[][] = [];
        for (let r = startRow; r <= endRow; r++) {
            const colsArr: (Tile | null)[] = [];
            for (let c = startCol; c <= endCol; c++) {
                const absRow = r;
                const absCol = c;
                const tile = this.tileset.getTileFromCoordinates(absRow, absCol);
                if (mergeSet.has(tile?.id ?? -1)) {
                    colsArr.push(tile);
                } else {
                    colsArr.push(null);
                }
            }
            rows.push(colsArr);
        }
        return { rect: rows, topLeft: { row: startRow, col: startCol }, set: mergeSet };
    }

    private getTopLeftOfRect(set: Set<number>): Coordinate | null {
        if (set.size === 0) return null;
        let minRow = Infinity, minCol = Infinity;
        set.forEach(id => {
            const { row, col } = this.tileset.getCoordinatesFromTile(id)!;
            minRow = Math.min(minRow, row);
            minCol = Math.min(minCol, col);
        });
        if (minRow === Infinity || minCol === Infinity) return null;
        return { row: minRow, col: minCol };
    }

    private posToCoordinates(x: number, y: number): Coordinate | null {
        const tilewidth = this.tileset.tilewidth;
        const tileheight = this.tileset.tileheight;
        const columns = this.tileset.columns;

        if (tilewidth <= 0 || tileheight <= 0 || columns <= 0) return null;
        if (x < 0 || y < 0) return null;


        const col = Math.floor(x / (tilewidth + this.gap));
        const row = Math.floor(y / (tileheight + this.gap));
        if (col < 0 || row < 0) return null;
        return { row: Math.min(row, this.tileset.rows - 1), col: Math.min(col, this.tileset.columns - 1) };
    }

    private posToId(x: number, y: number): number {
        const coords = this.posToCoordinates(x, y);
        if (!coords) return -1;
        const { row, col } = coords;
        const id = this.tileset.getTileFromCoordinates(row, col)?.id ?? -1;
        if (col < 0 || row < 0) return -1;
        if (id >= this.tileset.tiles.length) return -1;
        return id;
    }

    public setGap(gap: number): void {
        this.gap = gap;
        this.drawRectShape();
    }

    public getSelectedTiles(): (Tile | null)[][] | null  {
        return this.selectedTilesShape;
    }

    public destroy() {
        this.parent.off("pointerdown", this.bindOnPointerDown);
        this.parent.off("pointermove", this.bindOnPointerMove);
        this.parent.off("pointerup", this.bindOnPointerUp);
        this.parent.off("pointerupoutside", this.bindOnPointerUp);
        this.graphics.destroy();
    }
}