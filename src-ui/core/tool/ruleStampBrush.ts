import { Color, Container, FederatedPointerEvent, Point, Sprite, Texture } from "pixi.js";

import stamp from "@/assets/icons/stamp.svg?raw";

import { EditorContext } from "../application/editorContext";
import { TilemapSession } from "../application/session/tilemapSession";
import { Tool } from "../decorator/tool";
import { ITool } from "../interface/ITool";
import { RuleLayer } from "../application/tile/layer/ruleLayer";
import { Ruleset } from "../application/rule/ruleset";
import { SetRuleRefCommand } from "../command/tile/setRuleCommand";

type PreviewSpriteData = {
    sprite: Sprite;
    rulesetId: string;
}

@Tool({
    id: "rule_stamp",
    name: "Rule Stamp Brush",
    displayOnToolbar: {
        icon: stamp,
        tooltip: "Stamp Brush",
        index: 1,
    },
    shortcuts: ["A"],
})
export class RuleStampBrush implements ITool {
    private currentSession: TilemapSession | null = null;
    private overlayContainer: Container | null = null;


    private previousPreviewCoordinate: Coordinate = null!;
    private currentPreviewCoordinate: Coordinate = null!;
    private previewSprites: Sprite[] = [];

    private isDragging: boolean = false;
    private previewSpriteMap: Map<string, PreviewSpriteData>;

    private bindPointerOnDown: (event: FederatedPointerEvent) => void;
    private bindPointerOnMove: (event: FederatedPointerEvent) => void;
    private bindPointerOnUp: (event: FederatedPointerEvent) => void;
    private bindPointerOutside: (event: FederatedPointerEvent) => void;

    constructor(private readonly editorContext: EditorContext) {
        this.bindPointerOnDown = this.onPointerDown.bind(this);
        this.bindPointerOnMove = this.onPointerMove.bind(this);
        this.bindPointerOnUp = this.onPointerUp.bind(this);
        this.bindPointerOutside = this.onPointerOutside.bind(this);
    }

    public onEnable(): void {
        this.previewSpriteMap = new Map<string, PreviewSpriteData>();
    }


    public onDisable(): void {
        this.previewSpriteMap.forEach((spriteData) => this.overlayContainer!.removeChild(spriteData.sprite));
        this.previewSpriteMap = new Map<string, PreviewSpriteData>();
    }

    public attach(session: TilemapSession): void {
        this.currentSession = session;
        const viewport = session.sessionView.viewport;

        this.overlayContainer = session.sessionView.overlayerContainer;

        viewport.on("pointerdown", this.bindPointerOnDown);
        viewport.on("pointermove", this.bindPointerOnMove);
        viewport.on("pointerup", this.bindPointerOnUp);
        viewport.on("pointerupoutside", this.bindPointerOnUp);
        viewport.addEventListener("mouseleave", this.bindPointerOutside);
    }

    public detach(): void {
        if (!this.currentSession) return;
        const viewport = this.currentSession.sessionView.viewport;

        viewport.off("pointerdown", this.bindPointerOnDown);
        viewport.off("pointermove", this.bindPointerOnMove);
        viewport.off("pointerup", this.bindPointerOnUp);
        viewport.off("pointerupoutside", this.bindPointerOnUp);
        viewport.removeEventListener("mouseleave", this.bindPointerOutside);

        this.currentSession = null;

        if (this.overlayContainer) this.overlayContainer.removeChildren();
        this.overlayContainer = null;
    }

    private onPointerDown(e: FederatedPointerEvent) {
        if (!this.currentSession) return;
        if (e.button !== 0) return;
        if (!this.getActiveRuleLayer()) return;
        this.isDragging = true;
        this.previousPreviewCoordinate = this.getGridCoordinates(e.global.x, e.global.y);
        this.stampMove(e);
    }

    private onPointerMove(e: FederatedPointerEvent) {
        if (!this.currentSession) return;

        const newCoordinate = this.getGridCoordinates(e.global.x, e.global.y);
        if (!this.currentPreviewCoordinate || this.currentPreviewCoordinate.col != newCoordinate.col || this.currentPreviewCoordinate.row != newCoordinate.row) {
            this.currentPreviewCoordinate = newCoordinate;
            this.drawPreviewTiles();
        }

        if (!this.isDragging) return;
        this.stampMove(e);
    }

    private onPointerUp(e: FederatedPointerEvent) {
        if (!this.currentSession) return;
        if (!this.isDragging) return;
        this.isDragging = false;
        this.stampEnd(e);
    }

    private onPointerOutside(e: FederatedPointerEvent) {
        if (this.overlayContainer) {
            this.previewSprites.forEach(sprite => this.overlayContainer!.removeChild(sprite));
        }
    }

    private drawPreviewTiles() {
        const selectedRuleset = this.getSelectedRuleset();
        const activeLayer = this.getActiveRuleLayer();

        if (!selectedRuleset || !activeLayer) return;

        if (this.overlayContainer) {
            this.previewSprites.forEach(sprite => this.overlayContainer!.removeChild(sprite));
        }

        this.previewSprites = []

        const col = this.currentPreviewCoordinate!.col;
        const row = this.currentPreviewCoordinate!.row;
        if (col < 0 || col >= this.currentSession!.tilemap.width ||
            row < 0 || row >= this.currentSession!.tilemap.height) return;


        const sprite = new Sprite(Texture.WHITE);
        
        const color = new Color(selectedRuleset.color);
        sprite.tint = color;

        sprite.width = this.currentSession!.tilemap.tilewidth;
        sprite.height = this.currentSession!.tilemap.tileheight;

        sprite.position.set(col * this.currentSession!.tilemap.tilewidth, row * this.currentSession!.tilemap.tileheight);
        this.overlayContainer!.addChild(sprite);
        this.previewSprites.push(sprite);
    }

    private getGridCoordinates(globalX: number, globalY: number): Coordinate {
        const worldPos = this.currentSession!.sessionView.viewport.toLocal(new Point(globalX, globalY));
        const gridX = Math.floor(worldPos.x / this.currentSession!.tilemap.tilewidth);
        const gridY = Math.floor(worldPos.y / this.currentSession!.tilemap.tileheight);
        return { col: gridX, row: gridY };
    }

    private getDrawCoordinates(): Coordinate[] {
        const coordinates: Coordinate[] = [];
        if (!this.previousPreviewCoordinate || !this.currentPreviewCoordinate) return coordinates;

        let x0 = this.previousPreviewCoordinate.col;
        let y0 = this.previousPreviewCoordinate.row;
        const x1 = this.currentPreviewCoordinate.col;
        const y1 = this.currentPreviewCoordinate.row;

        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;

        while (true) {
            coordinates.push({ col: x0, row: y0 });

            if (x0 === x1 && y0 === y1) break;

            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x0 += sx;
            }
            if (e2 < dx) {
                err += dx;
                y0 += sy;
            }
        }

        return coordinates;
    }

    private getActiveRuleLayer(): RuleLayer | null {
        const selectedIds = this.currentSession!.layerState.selectedLayers;
        if (selectedIds.length == 0) return null;

        const activeId = selectedIds.values().next().value;
        if (!activeId) return null;

        const root = this.currentSession!.tilemap.rootLayer;
        const layer = root.findLayer(activeId);

        if (layer && layer instanceof RuleLayer) return layer;
        return null;
    }

    private getSelectedRuleset(): Ruleset | null {
        return this.editorContext.getSelectedRuleset();
    }

    private stampMove(e: FederatedPointerEvent) {
        if (!this.isDragging) return;

        const drawCoordinates = this.getDrawCoordinates();

        if (drawCoordinates.length == 0) drawCoordinates.push(this.currentPreviewCoordinate);

        drawCoordinates.forEach(drawCoordinate => {
            const ruleset = this.getSelectedRuleset();
            if (!ruleset) return;

            const targetX = drawCoordinate.col;
            const targetY = drawCoordinate.row;

            if (targetX < 0 || targetX >= this.currentSession!.tilemap.width ||
                targetY < 0 || targetY >= this.currentSession!.tilemap.height) {
                return;
            }

            const key = `${targetX},${targetY}`;
            let tileSpriteData: PreviewSpriteData;

            if (!this.previewSpriteMap.has(key)) {
                const sprite = new Sprite(Texture.WHITE);
                const color = new Color(ruleset.color);
                sprite.tint = color;
                sprite.width = this.currentSession!.tilemap.tilewidth;
                sprite.height = this.currentSession!.tilemap.tileheight;
                sprite.position.set(targetX * this.currentSession!.tilemap.tilewidth, targetY * this.currentSession!.tilemap.tileheight);
                tileSpriteData = {
                    sprite: sprite,
                    rulesetId: ruleset.id
                }
                this.previewSpriteMap.set(key, tileSpriteData);
                this.overlayContainer!.addChild(sprite);
            }
        })

        this.previousPreviewCoordinate = this.currentPreviewCoordinate;
    }

    private stampEnd(e: FederatedPointerEvent) {
        const historyManager = this.editorContext.getCurrentHistoryManager();
        if (!historyManager) {
            this.previewSpriteMap.forEach((spriteData) => {
                this.overlayContainer!.removeChild(spriteData.sprite);
            });
            this.previewSpriteMap.clear();
            return;
        }

        const targetLayer = this.getActiveRuleLayer();
        if (!targetLayer || targetLayer.locked || !targetLayer.visible) return;

        historyManager.startTransaction();
        this.previewSpriteMap.forEach((spriteData, key) => {
            const col = parseInt(key.split(',')[0]);
            const row = parseInt(key.split(',')[1]);
            const setTileCommand = new SetRuleRefCommand(targetLayer.id, { col, row }, spriteData.rulesetId);
            historyManager.execute(setTileCommand, this.editorContext);
        })
        historyManager.commitTransaction();

        this.previewSpriteMap.forEach((spriteData) => {
            this.overlayContainer!.removeChild(spriteData.sprite);
        });
        this.previewSpriteMap.clear();
    }
}