import { Point } from "pixi.js";
import { v4 as uuidv4 } from "uuid";

import { TilesetRefManager } from "@/application/resources/references/tileset-ref.manager";
import { RuleLayerData, RulesetRefData } from "@/shared/schema/layer.schema";
import { Result } from "@/shared/types/result";
import { MatrixUtils } from "@/shared/utils/maxtrix.utils";

import { BaseLayer, BaseLayerEvents, IGroupLayer } from "./base-layer";
import { RulesetRefManager } from "@/application/resources/references/ruleset-ref.manager";

interface RuleLayerEvents extends BaseLayerEvents {
    rulesetRefsOutputChanged: (coordinates: Coordinate[]) => void
}

export class RuleLayer extends BaseLayer<RuleLayerEvents> {
    public rulesetsRef: (RulesetRef | null)[][] = [];
    public coordinate: Coordinate = { col: 0, row: 0 };
    public offset: Point = new Point(0, 0);
    public size: { width: number, height: number } = { width: 0, height: 0 }


    constructor(
        ruleLayerData: RuleLayerData,
        parentLayer: IGroupLayer,
        tilesetRefManager: TilesetRefManager,
        rulesetRefManager: RulesetRefManager,
        objectIdScope: string = parentLayer.objectIdScope,
    ) {
        super(ruleLayerData.id, tilesetRefManager, rulesetRefManager, objectIdScope, "Rule Layer");

        this.parentLayer = parentLayer;
        this.name = ruleLayerData.name;

        this.coordinate.col = ruleLayerData.x;
        this.coordinate.row = ruleLayerData.y;
        this.offset.x = ruleLayerData.offsetx;
        this.offset.y = ruleLayerData.offsety;

        this.size.width = ruleLayerData.width;
        this.size.height = ruleLayerData.height;

        this.opacity = ruleLayerData.opacity;
        this.visible = ruleLayerData.visible;
        this.locked = ruleLayerData.locked;

        const rulesetRefs = ruleLayerData.layerData.split("\n").map((tileRow) => {
            return tileRow.split(",").map((tileRef) => {
                if (tileRef === "0") return null;
                const parts = tileRef.split(":");
                const rulesetIndex = parseInt(parts[0]);
                const tileId = parseInt(parts[1]);
                const tilesetIndex = parseInt(parts[2]);
                if (isNaN(rulesetIndex)) return null;
                return new RulesetRef(rulesetIndex, isNaN(tileId) ? -1 : tileId, isNaN(tilesetIndex) ? -1 : tilesetIndex);
            });
        })
        this.rulesetsRef = MatrixUtils.ensureSize(rulesetRefs, this.size.height, this.size.width, null);
    }

    public getRulesetRefAt(coordinate: Coordinate): RulesetRefData | null {
        if (coordinate.col < 0 || coordinate.col >= this.size.width) return null;
        if (coordinate.row < 0 || coordinate.row >= this.size.height) return null;

        const row = this.rulesetsRef[coordinate.row];
        if (!row) return null;

        const rulesetRef = row[coordinate.col];
        if (!rulesetRef) return null;

        const rulesetId = this.rulesetRefManager.getRulesetRefId(rulesetRef.rulesetIndex);
        if (!rulesetId) return null;

        const tilesetId = this.tilesetRefManager.getTilesetRefId(rulesetRef.tilesetIndex);
        if (!tilesetId || rulesetRef.tileId === -1) return { rulesetId };

        return { rulesetId, output: { tileId: rulesetRef.tileId, tilesetId } };
    }

    public setRuleRefsAt(updates: { coordinate: Coordinate, rulesetId: string | null }[]): Result<{ coordinate: Coordinate, oldRulesetId: string | null }[]> {
        if (this.locked || !this.visible) return Result.Cancel();
        
        const results: { coordinate: Coordinate, oldRulesetId: string | null }[] = [];
        const affectedCoordinates = new Set<string>();

        for (const update of updates) {
            const { coordinate, rulesetId } = update;
            if (coordinate.col < 0 || coordinate.col >= this.size.width) continue;
            if (coordinate.row < 0 || coordinate.row >= this.size.height) continue;

            if (!this.rulesetsRef[coordinate.row]) this.rulesetsRef[coordinate.row] = [];

            let tileRef = this.rulesetsRef[coordinate.row][coordinate.col];

            const oldRulesetId = tileRef ? this.rulesetRefManager.getRulesetRefId(tileRef.rulesetIndex) : null;
            results.push({ coordinate, oldRulesetId: oldRulesetId || null });

            if (rulesetId === null) {
                this.rulesetsRef[coordinate.row][coordinate.col] = null;
                this.markAffected(coordinate, affectedCoordinates);
            } else {
                const rulesetIndex = this.rulesetRefManager.getRulesetRefIndex(rulesetId);
                if (rulesetIndex === -1) continue;

                if (!tileRef) {
                    tileRef = new RulesetRef(-1, -1, -1);
                    this.rulesetsRef[coordinate.row][coordinate.col] = tileRef;
                }

                tileRef.setRulesetRef(rulesetIndex);
                this.markAffected(coordinate, affectedCoordinates);
            }
        }

        const updatedCoords: Coordinate[] = [];
        affectedCoordinates.forEach(key => {
            const [col, row] = key.split(',').map(Number);
            this.reCalculateOutputAtNoEmit({ col, row });
            updatedCoords.push({ col, row });
        });

        this.eventEmitter.emit("rulesetRefsOutputChanged", updatedCoords);
        
        return Result.Success(results);
    }

    private markAffected(coordinate: Coordinate, affectedCoordinates: Set<string>): void {
        const MAX_SEARCH_RADIUS = 9;

        const startX = Math.max(0, coordinate.col - MAX_SEARCH_RADIUS);
        const endX = Math.min(this.size.width - 1, coordinate.col + MAX_SEARCH_RADIUS);
        const startY = Math.max(0, coordinate.row - MAX_SEARCH_RADIUS);
        const endY = Math.min(this.size.height - 1, coordinate.row + MAX_SEARCH_RADIUS);

        for (let targetY = startY; targetY <= endY; targetY++) {
            for (let targetX = startX; targetX <= endX; targetX++) {
                if (targetX === coordinate.col && targetY === coordinate.row) {
                    affectedCoordinates.add(`${targetX},${targetY}`);
                    continue;
                }

                const targetRow = this.rulesetsRef[targetY];
                if (!targetRow) continue;

                const targetRef = targetRow[targetX];
                if (!targetRef) continue;

                const rulesetId = this.rulesetRefManager.getRulesetRefId(targetRef.rulesetIndex);
                if (!rulesetId) continue;

                const ruleset = this.rulesetRefManager.rulesetManager.getRulesetById(rulesetId);
                if (!ruleset) continue;

                const targetRadius = Math.floor(ruleset.size / 2);
                const distanceX = Math.abs(targetX - coordinate.col);
                const distanceY = Math.abs(targetY - coordinate.row);

                if (distanceX <= targetRadius && distanceY <= targetRadius) {
                    affectedCoordinates.add(`${targetX},${targetY}`);
                }
            }
        }
    }

    private calculateOutputAt(coordinate: Coordinate): { tileId: number, tilesetId: string } | null {
        if (coordinate.col < 0 || coordinate.col >= this.size.width) return null;
        if (coordinate.row < 0 || coordinate.row >= this.size.height) return null;

        const row = this.rulesetsRef[coordinate.row]!;
        const rulesetRef = row[coordinate.col]!;
        if (!rulesetRef) return null;

        const rulesetId = this.rulesetRefManager.getRulesetRefId(rulesetRef.rulesetIndex);
        if (!rulesetId) return null;

        const ruleset = this.rulesetRefManager.rulesetManager.getRulesetById(rulesetId);
        if (!ruleset) return null;

        return ruleset.calculateOutput(this.getNeighborsContext(coordinate));
    }

    private reCalculateOutputAtNoEmit(coordinate: Coordinate): void {
        const rulesetRef = this.rulesetsRef[coordinate.row]?.[coordinate.col];
        if (!rulesetRef) return;

        const calculateResult = this.calculateOutputAt(coordinate);
        
        if (calculateResult) {
            const tilesetIndex = this.tilesetRefManager.getTilesetRefIndex(calculateResult.tilesetId);
            rulesetRef.setOutput(calculateResult.tileId, tilesetIndex);
        } else {
            rulesetRef.setOutput(-1, -1);
        }
    }

    public reCalculateAllOutputs(): void {
        const updatedCoords: Coordinate[] = [];
        for (let y = 0; y < this.size.height; y++) {
            for (let x = 0; x < this.size.width; x++) {
                if (this.rulesetsRef[y]?.[x]) {
                    this.reCalculateOutputAtNoEmit({ col: x, row: y });
                    updatedCoords.push({ col: x, row: y });
                }
            }
        }
        this.eventEmitter.emit("rulesetRefsOutputChanged", updatedCoords);
    }

    private getNeighborsContext(coordinate: Coordinate): (RulesetRefData | null)[][] {
        if (coordinate.col < 0 || coordinate.col >= this.size.width) return [];
        if (coordinate.row < 0 || coordinate.row >= this.size.height) return [];

        const row = this.rulesetsRef[coordinate.row]!;
        const rulesetRef = row[coordinate.col]!;

        const rulesetId = this.rulesetRefManager.getRulesetRefId(rulesetRef.rulesetIndex);
        if (!rulesetId) return [];

        const ruleset = this.rulesetRefManager.rulesetManager.getRulesetById(rulesetId);
        if (!ruleset) return [];

        const size = ruleset.size;
        const rulesetRefs: (RulesetRefData | null)[][] = new Array(size).fill(null).map(() => new Array(size).fill(null));

        for (let x = 0; x < size; x++) {
            for (let y = 0; y < size; y++) {
                const targetX = coordinate.col - Math.floor(size / 2) + x;
                const targetY = coordinate.row - Math.floor(size / 2) + y;
                if (targetX < 0 || targetX >= this.size.width || targetY < 0 || targetY >= this.size.height) {
                    continue;
                }
                const tileRef = this.getRulesetRefAt({ col: targetX, row: targetY });
                if (tileRef) rulesetRefs[y][x] = tileRef;
            }
        }

        return rulesetRefs;
    }

    public override serialize(): RuleLayerData {
        const layerData = this.rulesetsRef.map(row => row.map(tileRef => {
            if (!tileRef) return "0";
            return tileRef.serialize();
        }).join(",")).join("\n");

        return {
            id: this.id,
            type: "auto_rule",
            name: this.name,
            x: this.coordinate.col,
            y: this.coordinate.row,
            width: this.size.width,
            height: this.size.height,
            opacity: this.opacity,
            visible: this._visible,
            locked: this._locked,
            offsetx: this.offset.x,
            offsety: this.offset.y,
            layerData: layerData,
        }
    }

    public override clone(): RuleLayer {
        const layerData = this.serialize();
        layerData.id = uuidv4();
        return new RuleLayer(layerData, this.parentLayer, this.tilesetRefManager, this.rulesetRefManager, this.objectIdScope);
    }

    public override traverse(cb: (layer: BaseLayer<any>) => void): void {
        cb(this);
    }

    public override removeTilesetRef(tilesetIndex: number): void {
        const changedCoords: Coordinate[] = [];

        this.rulesetsRef.forEach((row, rowIndex) => {
            if (!row) return;
            row.forEach((rulesetRef, colIndex) => {
                if (rulesetRef?.tilesetIndex === tilesetIndex) {
                    this.rulesetsRef[rowIndex][colIndex] = null;
                    changedCoords.push({ col: colIndex, row: rowIndex });
                }
            });
        });

        if (changedCoords.length > 0) this.eventEmitter.emit("rulesetRefsOutputChanged", changedCoords);
    }

    public override removeRulesetRef(rulesetIndex: number): void {
        const changedCoords: Coordinate[] = [];

        this.rulesetsRef.forEach((row, rowIndex) => {
            if (!row) return;
            row.forEach((rulesetRef, colIndex) => {
                if (rulesetRef?.rulesetIndex === rulesetIndex) {
                    this.rulesetsRef[rowIndex][colIndex] = null;
                    changedCoords.push({ col: colIndex, row: rowIndex });
                }
            });
        });

        if (changedCoords.length > 0) this.eventEmitter.emit("rulesetRefsOutputChanged", changedCoords);
    }
}

export class RulesetRef {
    public rulesetIndex: number;
    public tileId: number;
    public tilesetIndex: number;

    constructor(rulesetIndex: number, tileId: number, tilesetIndex: number) {
        this.rulesetIndex = rulesetIndex;
        this.tileId = tileId;
        this.tilesetIndex = tilesetIndex;
    }

    public serialize(): string {
        if (this.tileId === -1 || this.tilesetIndex === -1) return `${this.rulesetIndex}:-1:-1`;
        return `${this.rulesetIndex}:${this.tileId}:${this.tilesetIndex}`;
    }
    
    public setRulesetRef(rulesetIndex: number): number {
        const preRulesetRefData = this.rulesetIndex;
        this.rulesetIndex = rulesetIndex;
        return preRulesetRefData;
    }

    public setOutput(tileId: number, tilesetIndex: number): { tileId: number, tilesetIndex: number} {
        const preTileRefData = { tileId: this.tileId, tilesetIndex: this.tilesetIndex };
        this.tileId = tileId;
        this.tilesetIndex = tilesetIndex;
        return preTileRefData;
    }
}
