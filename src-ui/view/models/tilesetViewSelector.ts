import { Container, FederatedPointerEvent, Graphics, Point } from "pixi.js";

import { TilesetSession } from "@/core/application/session/tilesetSession";
import { Tile, Tileset } from "@/core/application/tile/tileset";
import { WorkspaceService } from "@/shared/services/workspaceService";

export type CreateTilesetViewSelectorContext = {
    tileset: Tileset;
    tilesetSession: TilesetSession;
    parent: Container;
}

export class TilesetViewSelector {
    private tileset: Tileset;
    private tilesetSession: TilesetSession;
    private parent: Container;

    private selectedTiles: (Tile | null)[][] = [];
    private selectedSet: Set<number> = new Set();
    private pivot?: { row: number, col: number };
    private baseRow: number | null = null;
    private baseCol: number | null = null;

    private selectedColor: number = 0x0090f1;
    private selectedTransparency: number = 0.4;


    private bindOnPointerDown = this.onPointerDown.bind(this);
    private bindOnPointerMove = this.onPointerMove.bind(this);
    private bindOnPointerUp = this.onPointerUp.bind(this);

    private dragging: boolean = false;
    private dragStartIdx: number | null = null;
    private startSelectedSnapshot: Set<number> | null = null;

    private graphics: Graphics;
    private gap: number = 1;

    constructor(context: CreateTilesetViewSelectorContext) {
        this.tileset = context.tileset;
        this.tilesetSession = context.tilesetSession;
        this.parent = context.parent;

        this.graphics = new Graphics();
        this.graphics.zIndex = 10000;

        if (this.parent.sortableChildren === undefined) this.parent.sortableChildren = true;
        this.parent.addChild(this.graphics);

        this.parent.eventMode = "static";
        this.parent.on("pointerdown", this.bindOnPointerDown);

        const { selectedTiles, pivot } = this.tilesetSession.selectionState || { selectedTiles: [] };
        if (selectedTiles && selectedTiles.length > 0) {
            this.selectedSet = new Set<number>();
            for (let r = 0; r < selectedTiles.length; r++) {
                const row = selectedTiles[r];
                for (let c = 0; c < row.length; c++) {
                    const id = row[c];
                    if (id !== null && id !== undefined) this.selectedSet.add(id);
                }
            }
            if (pivot) this.pivot = pivot;
            let minR = Infinity, minC = Infinity;
            const columns = this.tileset.columns;
            this.selectedSet.forEach(i => {
                const ar = Math.floor(i / columns);
                const ac = i % columns;
                minR = Math.min(minR, ar);
                minC = Math.min(minC, ac);
            });
            if (minR !== Infinity && minC !== Infinity) {
                this.baseRow = minR;
                this.baseCol = minC;
            }
            this.updateRectFromSet();
        }
    }

    private onPointerDown(event: FederatedPointerEvent) {
        const world = new Point(event.globalX, event.globalY);
        const local = this.parent.toLocal(world);
        const idx = this.posToIndex(local.x, local.y);
        if (idx < 0) {
            this.clearSelection();
            return;
        }

        const original = (event as any).originalEvent as MouseEvent;
        const btn = (original.button ?? (event as any).button);
        if (btn != null && btn !== 0) return;

        const isCtrl = !!(original.ctrlKey || original.metaKey);

        if (!isCtrl) this.selectedSet.clear();

        this.startSelectedSnapshot = new Set(this.selectedSet);

        this.dragging = true;
        this.dragStartIdx = idx;

        this.selectedSet.add(idx);
        this.updateRectFromSet();

        this.parent.on("pointermove", this.bindOnPointerMove);
        this.parent.on("pointerup", this.bindOnPointerUp);
        this.parent.on("pointerupoutside", this.bindOnPointerUp);
    }

    private onPointerMove(event: FederatedPointerEvent) {
        if (!this.dragging || this.dragStartIdx == null) return;
        const world = new Point(event.globalX, event.globalY);
        const local = this.parent.toLocal(world);
        const idx = this.posToIndex(local.x, local.y);
        if (idx < 0) return;

        const columns = this.tileset.columns;
        const r1 = Math.min(Math.floor(this.dragStartIdx / columns), Math.floor(idx / columns));
        const r2 = Math.max(Math.floor(this.dragStartIdx / columns), Math.floor(idx / columns));
        const c1 = Math.min(this.dragStartIdx % columns, idx % columns);
        const c2 = Math.max(this.dragStartIdx % columns, idx % columns);

        const newSet = new Set<number>(this.startSelectedSnapshot ?? []);
        for (let r = r1; r <= r2; r++) {
            for (let c = c1; c <= c2; c++) {
                newSet.add(r * columns + c);
            }
        }

        this.selectedSet = newSet;
        this.updateRectFromSet();
    }

    private onPointerUp(event: FederatedPointerEvent) {
        if (!this.dragging) return;
        this.dragging = false;
        this.dragStartIdx = null;
        this.startSelectedSnapshot = null;

        this.parent.off("pointermove", this.bindOnPointerMove);
        this.parent.off("pointerup", this.bindOnPointerUp);
        this.parent.off("pointerupoutside", this.bindOnPointerUp);

        const columns = this.tileset.columns;
        if (this.selectedSet.size === 0) {
            this.selectedTiles = [];
            this.pivot = undefined;
            this.baseRow = null;
            this.baseCol = null;
            this.graphics.clear();
            return;
        }

        let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
        this.selectedSet.forEach(i => {
            const ar = Math.floor(i / columns);
            const ac = i % columns;
            minR = Math.min(minR, ar);
            maxR = Math.max(maxR, ar);
            minC = Math.min(minC, ac);
            maxC = Math.max(maxC, ac);
        });

        const rows: (Tile | null)[][] = [];
        for (let r = minR; r <= maxR; r++) {
            const colsArr: (Tile | null)[] = [];
            for (let c = minC; c <= maxC; c++) {
                const i = r * columns + c;
                colsArr.push(this.selectedSet.has(i) ? this.tileset.tiles[i] : null);
            }
            rows.push(colsArr);
        }

        this.selectedTiles = rows;
        this.baseRow = minR;
        this.baseCol = minC;
        this.pivot = { row: Math.floor((minR + maxR) / 2), col: Math.floor((minC + maxC) / 2) };
        this.drawSelection();
    }

    public getSelectedTiles(): { tiles: (Tile | null)[][], pivot: { row: number, col: number } } {
        return { tiles: this.selectedTiles, pivot: this.pivot ? this.pivot : { row: 0, col: 0 } };
    }

    public clearSelection() {
        this.selectedTiles = [];
        this.selectedSet.clear();
        this.pivot = undefined;
        this.baseRow = null;
        this.baseCol = null;
        this.graphics.clear();
    }

    private drawSelection() {
        this.graphics.clear();
        if (!this.selectedTiles || this.selectedTiles.length === 0) return;

        const tilewidth = this.tileset.tilewidth;
        const tileheight = this.tileset.tileheight;
        if (this.baseRow == null || this.baseCol == null) return;

        const rowsCount = this.selectedTiles.length;
        const colsCount = this.selectedTiles[0].length;

        const grid: boolean[][] = [];
        for (let r = 0; r < rowsCount; r++) {
            grid[r] = [];
            for (let c = 0; c < colsCount; c++) {
                grid[r][c] = !!this.selectedTiles[r][c];
            }
        }

        const processed: boolean[][] = Array.from({ length: rowsCount }, () => Array(colsCount).fill(false));

        const useV8 = typeof (this.graphics as any).fillStyle === "function" && typeof (this.graphics as any).fillRect === "function";

        if (useV8) {
            (this.graphics as any).fillStyle(this.selectedColor, this.selectedTransparency);
            for (let r = 0; r < rowsCount; r++) {
                for (let c = 0; c < colsCount; c++) {
                    if (!grid[r][c] || processed[r][c]) continue;

                    let run = 1;
                    while (c + run < colsCount && grid[r][c + run] && !processed[r][c + run]) run++;

                    let height = 1;
                    outer2: while (r + height < rowsCount) {
                        for (let cc = c; cc < c + run; cc++) {
                            if (!grid[r + height][cc] || processed[r + height][cc]) break outer2;
                        }
                        height++;
                    }

                    for (let rr = r; rr < r + height; rr++) {
                        for (let cc = c; cc < c + run; cc++) processed[rr][cc] = true;
                    }

                    const minR = this.baseRow! + r;
                    const minC = this.baseCol! + c;
                    const x = minC * (tilewidth + this.gap);
                    const y = minR * (tileheight + this.gap);
                    const w = run * (tilewidth + this.gap) - this.gap;
                    const h = height * (tileheight + this.gap) - this.gap;

                    (this.graphics as any).fillRect(x, y, w, h);
                }
            }
        } else {
            this.graphics.beginFill(this.selectedColor, this.selectedTransparency);
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

                    const minR = this.baseRow! + r;
                    const minC = this.baseCol! + c;
                    const x = minC * (tilewidth + this.gap);
                    const y = minR * (tileheight + this.gap);
                    const w = run * (tilewidth + this.gap) - this.gap;
                    const h = height * (tileheight + this.gap) - this.gap;

                    this.graphics.drawRect(x, y, w, h);
                }
            }
            this.graphics.endFill();
        }
        try { (this.parent as any).sortChildren(); } catch (e) { }
    }

    private updateRectFromSet() {
        const columns = this.tileset.columns;   
        if (this.selectedSet.size === 0) {
            this.selectedTiles = [];
            this.baseRow = null;
            this.baseCol = null;
            this.pivot = undefined;
            this.graphics.clear();

            this.tilesetSession.updateSelectionState({ selectedTiles: [], pivot: undefined });
            WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
            return;
        }

        let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
        this.selectedSet.forEach(i => {
            const ar = Math.floor(i / columns);
            const ac = i % columns;
            minR = Math.min(minR, ar);
            maxR = Math.max(maxR, ar);
            minC = Math.min(minC, ac);
            maxC = Math.max(maxC, ac);
        });

        const rows: (Tile | null)[][] = [];
        for (let r = minR; r <= maxR; r++) {
            const colsArr: (Tile | null)[] = [];
            for (let c = minC; c <= maxC; c++) {
                const i = r * columns + c;
                colsArr.push(this.selectedSet.has(i) ? this.tileset.tiles[i] : null);
            }
            rows.push(colsArr);
        }

        this.selectedTiles = rows;
        this.baseRow = minR;
        this.baseCol = minC;
        this.pivot = { row: Math.floor((minR + maxR) / 2), col: Math.floor((minC + maxC) / 2) };
        this.drawSelection();

        const mappedSelectedTiles = this.selectedTiles.map(row =>
            row.map(tile => (tile ? tile.id : null))
        );

        this.tilesetSession.updateSelectionState({
            selectedTiles: mappedSelectedTiles,
            pivot: this.pivot
        });
        WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
    }

    private posToIndex(x: number, y: number): number {
        const tilewidth = this.tileset.tilewidth;
        const tileheight = this.tileset.tileheight;
        const columns = this.tileset.columns;

        if (tilewidth <= 0 || tileheight <= 0 || columns <= 0) return -1;

        if (x < 0 || y < 0) return -1;

        const col = Math.floor(x / (tilewidth + this.gap));
        const row = Math.floor(y / (tileheight + this.gap));
        const idx = row * columns + col;
        if (col < 0 || row < 0) return -1;
        if (idx >= this.tileset.tiles.length) return -1;
        return idx;
    }
}