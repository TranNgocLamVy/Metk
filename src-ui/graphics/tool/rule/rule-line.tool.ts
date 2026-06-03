import { SetRulesCommand } from "@/application/commands/tile/set-rules.command";
import { RuleLayer } from "@/editor/model/tilemap/layer/rule-layer";
import { RuleLayerRenderer } from "@/graphics/renderer/tilemap/rule-layer.renderer";
import { coordinateKey, getSelectedRule, sameCoordinate, SelectedRule } from "@/graphics/tool/base/grid-tool-utils";
import { PointerTool } from "@/graphics/tool/base/pointer.tool";
import { GeometryUtils } from "@/shared/utils/geometry-utils";
import { Color, FederatedPointerEvent, Sprite, Texture } from "pixi.js";

type RuleLinePayload = {
    key: string;
    coordinate: Coordinate;
    sprite: Sprite;
    rulesetId: string;
};

export class RuleLineTool extends PointerTool {
    private static readonly spriteAlpha = 0.9;

    private isDragging = false;
    private startCoordinate: Coordinate | null = null;
    private currentCoordinate: Coordinate | null = null;
    private previewPayloads: Map<string, RuleLinePayload> = new Map();

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
        if (!this.currentView || !this.isTargetLayerSupported(this.targetLayerRenderer)) return;
        if (this.targetLayerRenderer.layer.locked || !this.targetLayerRenderer.layer.visible) return;

        const coordinate = this.targetLayerRenderer.posToCoord(this.getLocalPos(e));
        this.isDragging = true;
        this.startCoordinate = coordinate;
        this.currentCoordinate = coordinate;
        this.updatePreview();
    }

    protected override onPointerMove(e: FederatedPointerEvent): void {
        if (!this.currentView || !this.isTargetLayerSupported(this.targetLayerRenderer)) return;
        const coordinate = this.targetLayerRenderer.posToCoord(this.getLocalPos(e));

        if (!this.isDragging) {
            this.currentCoordinate = coordinate;
            this.updatePreview();
            return;
        }

        if (this.currentCoordinate && sameCoordinate(this.currentCoordinate, coordinate)) return;
        this.currentCoordinate = coordinate;
        this.updatePreview();
    }

    protected override onPointerUp(e: FederatedPointerEvent): void {
        if (!this.isDragging) return;

        this.commitPreview();
        this.clearPreview();
        this.reset();
    }

    protected override onPointerOutside(e: FederatedPointerEvent): void {
        if (!this.isDragging) this.clearPreview();
    }

    private updatePreview(): void {
        this.clearPreview();
        if (!this.overlayContainer || !this.currentView || !this.isTargetLayerSupported(this.targetLayerRenderer)) return;
        if (this.targetLayerRenderer.layer.locked || !this.targetLayerRenderer.layer.visible) return;

        const selectedRule = getSelectedRule(this.editorFacade);
        const start = this.startCoordinate ?? this.currentCoordinate;
        const end = this.currentCoordinate;
        if (!selectedRule || !start || !end) return;

        GeometryUtils.calculateLine(start, end).forEach((coordinate) => {
            const payload = this.createPayload(coordinate, selectedRule);
            if (!payload) return;
            this.previewPayloads.get(payload.key)?.sprite.destroy();
            this.overlayContainer!.addChild(payload.sprite);
            this.previewPayloads.set(payload.key, payload);
        });
    }

    private createPayload(coordinate: Coordinate, selectedRule: SelectedRule): RuleLinePayload | null {
        if (!this.currentView || !this.isTargetLayerSupported(this.targetLayerRenderer)) return null;
        if (!this.currentView.session.tilemap.isInBoundary(coordinate)) return null;

        const sprite = new Sprite(Texture.WHITE);
        sprite.tint = new Color(selectedRule.color);
        sprite.alpha = RuleLineTool.spriteAlpha;
        sprite.width = this.currentView.session.tilemap.tileWidth;
        sprite.height = this.currentView.session.tilemap.tileHeight;

        const position = this.targetLayerRenderer.coordToPos(coordinate);
        sprite.position.set(position.x, position.y);

        return {
            key: coordinateKey(coordinate),
            coordinate,
            sprite,
            rulesetId: selectedRule.id,
        };
    }

    private commitPreview(): void {
        if (!this.isTargetLayerSupported(this.targetLayerRenderer)) return;
        if (this.targetLayerRenderer.layer.locked || !this.targetLayerRenderer.layer.visible) return;

        const historyManager = this.editorFacade.getCurrentHistoryManager();
        if (!historyManager || this.previewPayloads.size === 0) return;

        const updates = Array.from(this.previewPayloads.values()).map((payload) => ({
            coordinate: payload.coordinate,
            rulesetId: payload.rulesetId,
        }));

        historyManager.startTransaction();
        historyManager.execute(
            new SetRulesCommand(this.targetLayerRenderer.tilemap.objectId, this.targetLayerRenderer.layer.objectId, updates),
            this.editorFacade,
        );
        historyManager.commitTransaction();
    }

    private clearPreview(): void {
        this.previewPayloads.forEach((payload) => payload.sprite.destroy());
        this.previewPayloads.clear();
    }

    private reset(): void {
        this.isDragging = false;
        this.startCoordinate = null;
        this.currentCoordinate = null;
    }

    private isTargetLayerSupported(layerRenderer: any): layerRenderer is RuleLayerRenderer {
        return layerRenderer?.layer instanceof RuleLayer;
    }
}

