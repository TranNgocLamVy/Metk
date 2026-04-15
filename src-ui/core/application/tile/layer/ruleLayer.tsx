import { Point } from "pixi.js";
import { v4 as uuidv4 } from "uuid";

import { TilesetRefManager } from "@/core/manager/tilesetRefManager";
import { RuleLayerData, RulesetRefData } from "@/shared/schema/layerSchema";
import { Result } from "@/shared/types/result";
import { MatrixUtils } from "@/shared/utils/maxtrixUtils";

import { BaseLayer, BaseLayerEvents, IGroupLayer } from "./baseLayer";
import { RulesetRefManager } from "@/core/manager/rulesetRefManager";

interface RuleLayerEvents extends BaseLayerEvents {
    rulesetRefOutputChanged: (x: number, y: number) => void
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
        public readonly rulesetRefManager: RulesetRefManager
    ) {
        super(ruleLayerData.id, tilesetRefManager);

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

        const rulesetId = this.rulesetRefManager.getRulesetIdByIndex(rulesetRef.rulesetIndex);
        if (!rulesetId) return null;

        const tilesetId = this.tilesetRefManager.getTilesetIdByIndex(rulesetRef.tilesetIndex);
        if (!tilesetId || rulesetRef.tileId === -1) return { rulesetId };

        return { rulesetId, output: { tileId: rulesetRef.tileId, tilesetId } };
    }

    public setRuleRefAt(coordinate: Coordinate, rulesetId: string): Result<string | null> {
        if (coordinate.col < 0 || coordinate.col >= this.size.width) return Result.Error("Tile not found, col is out of range");
        if (coordinate.row < 0 || coordinate.row >= this.size.height) return Result.Error("Tile not found, row is out of range");

        if (!this.rulesetsRef[coordinate.row]) this.rulesetsRef[coordinate.row] = [];

        let tileRef = this.rulesetsRef[coordinate.row][coordinate.col];

        const rulesetIndex = this.rulesetRefManager.getRulesetIndexById(rulesetId);
        if (rulesetIndex === -1) return Result.Error("Ruleset not found");

        if (!tileRef) {
            tileRef = new RulesetRef(-1, -1, -1);
            this.rulesetsRef[coordinate.row][coordinate.col] = tileRef;
        }

        const oldRulesetIndex = tileRef.setRulesetRef(rulesetIndex);
        
        this.reCalculateOutputAt(coordinate);
        this.reCalculateOutputAround(coordinate);
        
        if (oldRulesetIndex === -1) return Result.Success(null);
        
        const oldRulesetId = this.rulesetRefManager.getRulesetIdByIndex(oldRulesetIndex);
        return Result.Success(oldRulesetId || null);
    }

    public removeTileAt(coordinate: Coordinate): Result<RulesetRefData | null> {
        if (coordinate.col < 0 || coordinate.col >= this.size.width) return Result.Error("Tile not found, col is out of range");
        if (coordinate.row < 0 || coordinate.row >= this.size.height) return Result.Error("Tile not found, row is out of range");

        if (!this.rulesetsRef[coordinate.row]) this.rulesetsRef[coordinate.row] = [];

        const rulesetRef = this.rulesetsRef[coordinate.row][coordinate.col];
        if (!rulesetRef) return Result.Success(null);

        this.rulesetsRef[coordinate.row][coordinate.col] = null;

        this.eventEmitter.emit("rulesetRefOutputChanged", coordinate.col, coordinate.row);
        
        this.reCalculateOutputAround(coordinate);
        
        const rulesetId = this.rulesetRefManager.getRulesetIdByIndex(rulesetRef.rulesetIndex);
        if (!rulesetId) return Result.Error("Ruleset not found");

        const tilesetId = this.tilesetRefManager.getTilesetIdByIndex(rulesetRef.tilesetIndex);
        if (!tilesetId) return Result.Success({ rulesetId: rulesetId });
        
        return Result.Success({ rulesetId: rulesetId, output: { tileId: rulesetRef.tileId, tilesetId: tilesetId } });
    }

    private calculateOutputAt(coordinate: Coordinate): { tileId: number, tilesetId: string } | null {
        if (coordinate.col < 0 || coordinate.col >= this.size.width) return null;
        if (coordinate.row < 0 || coordinate.row >= this.size.height) return null;

        const row = this.rulesetsRef[coordinate.row]!;
        const rulesetRef = row[coordinate.col]!;
        if (!rulesetRef) return null;

        const rulesetId = this.rulesetRefManager.getRulesetIdByIndex(rulesetRef.rulesetIndex);
        if (!rulesetId) return null;

        const ruleset = this.rulesetRefManager.rulesetManager.getRulesetById(rulesetId);
        if (!ruleset) return null;

        return ruleset.calculateOutput(this.getContext(coordinate));
    }

    private reCalculateOutputAt(coordinate: Coordinate): void {
        const rulesetRef = this.rulesetsRef[coordinate.row]?.[coordinate.col];
        if (!rulesetRef) return;

        const calculateResult = this.calculateOutputAt(coordinate);
        
        if (calculateResult) {
            const tilesetIndex = this.tilesetRefManager.getTilesetIndexById(calculateResult.tilesetId);
            rulesetRef.setOutput(calculateResult.tileId, tilesetIndex);
        } else {
            rulesetRef.setOutput(-1, -1);
        }

        this.eventEmitter.emit("rulesetRefOutputChanged", coordinate.col, coordinate.row);
    }

    public reCalculateAllOutputs(): void {
        for (let y = 0; y < this.size.height; y++) {
            for (let x = 0; x < this.size.width; x++) {
                if (this.rulesetsRef[y]?.[x]) {
                    this.reCalculateOutputAt({ col: x, row: y });
                }
            }
        }
    }

    private reCalculateOutputAround(coordinate: Coordinate): void {
        if (coordinate.col < 0 || coordinate.col >= this.size.width) return;
        if (coordinate.row < 0 || coordinate.row >= this.size.height) return;

        const MAX_SEARCH_RADIUS = 9;

        const startX = Math.max(0, coordinate.col - MAX_SEARCH_RADIUS);
        const endX = Math.min(this.size.width - 1, coordinate.col + MAX_SEARCH_RADIUS);
        const startY = Math.max(0, coordinate.row - MAX_SEARCH_RADIUS);
        const endY = Math.min(this.size.height - 1, coordinate.row + MAX_SEARCH_RADIUS);

        for (let targetY = startY; targetY <= endY; targetY++) {
            for (let targetX = startX; targetX <= endX; targetX++) {
                if (targetX === coordinate.col && targetY === coordinate.row) continue;

                const targetRow = this.rulesetsRef[targetY];
                if (!targetRow) continue;

                const targetRef = targetRow[targetX];
                if (!targetRef) continue;

                const rulesetId = this.rulesetRefManager.getRulesetIdByIndex(targetRef.rulesetIndex);
                if (!rulesetId) continue;

                const ruleset = this.rulesetRefManager.rulesetManager.getRulesetById(rulesetId);
                if (!ruleset) continue;

                const targetRadius = Math.floor(ruleset.size / 2);
                const distanceX = Math.abs(targetX - coordinate.col);
                const distanceY = Math.abs(targetY - coordinate.row);

                if (distanceX <= targetRadius && distanceY <= targetRadius) {
                    this.reCalculateOutputAt({ col: targetX, row: targetY });
                }
            }
        }
    }

    private getContext(coordinate: Coordinate): (RulesetRefData | null)[][] {
        if (coordinate.col < 0 || coordinate.col >= this.size.width) return [];
        if (coordinate.row < 0 || coordinate.row >= this.size.height) return [];

        const row = this.rulesetsRef[coordinate.row]!;
        const rulesetRef = row[coordinate.col]!;

        const rulesetId = this.rulesetRefManager.getRulesetIdByIndex(rulesetRef.rulesetIndex);
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
            parentId: this.parentLayer.id,
            type: "auto_rule",
            name: this.name,
            x: this.coordinate.col,
            y: this.coordinate.row,
            width: this.size.width,
            height: this.size.height,
            opacity: this.opacity,
            visible: this.visible,
            locked: this.locked,
            offsetx: this.offset.x,
            offsety: this.offset.y,
            layerData: layerData,
        }
    }

    public override clone(): RuleLayer {
        const layerData = this.serialize();
        layerData.id = uuidv4();
        return new RuleLayer(layerData, this.parentLayer, this.tilesetRefManager, this.rulesetRefManager);
    }

    public override traverse(cb: (layer: BaseLayer<any>) => void): void {
        cb(this);
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