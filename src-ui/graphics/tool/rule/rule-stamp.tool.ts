import { SetRulesCommand } from "@/application/commands/tile/set-rules.command";
import { RuleLayer } from "@/editor/model/tilemap/layer/rule-layer";
import { RuleLayerRenderer } from "@/graphics/renderer/tilemap/rule-layer.renderer";
import { GridStrokeTool } from "@/graphics/tool/base/grid-stroke.tool";
import { Color, Sprite, Texture } from "pixi.js";

type RulePreviewData = {
    key: string;
    coordinate: Coordinate;
    sprite: Sprite;
    rulesetId: string;
};

export class RuleStampTool extends GridStrokeTool {
    private static readonly spriteAlpha = 0.9;

    private hoverSprites: Sprite[] = [];
    private strokePayloads: Map<string, RulePreviewData> = new Map();

    protected isTargetLayerSupported(layerRenderer: any): layerRenderer is RuleLayerRenderer {
        return layerRenderer?.layer instanceof RuleLayer;
    }

    protected clearHoverPreview(): void {
        this.hoverSprites.forEach((sprite) => sprite.destroy());
        this.hoverSprites = [];
    }

    protected clearStrokePreview(): void {
        this.strokePayloads.forEach((data) => data.sprite.destroy());
        this.strokePayloads.clear();
    }

    protected drawHoverPreview(coord: Coordinate): void {
        this.clearHoverPreview();
        if (!this.overlayContainer) return;

        this.createPreviewPayload(coord).forEach((data) => {
            this.overlayContainer!.addChild(data.sprite);
            this.hoverSprites.push(data.sprite);
        });
    }

    protected collectStrokeAt(coord: Coordinate): void {
        if (!this.overlayContainer) return;

        this.createPreviewPayload(coord).forEach((data) => {
            this.strokePayloads.get(data.key)?.sprite.destroy();
            this.overlayContainer!.addChild(data.sprite);
            this.strokePayloads.set(data.key, data);
        });
    }

    protected commitStroke(): void {
        if (!this.isTargetLayerSupported(this.targetLayerRenderer)) return;
        if (this.targetLayerRenderer.layer.locked || !this.targetLayerRenderer.layer.visible) return;

        const historyManager = this.editorFacade.getCurrentHistoryManager();
        if (!historyManager || this.strokePayloads.size === 0) return;

        const updates = Array.from(this.strokePayloads.values()).map((data) => ({
            coordinate: data.coordinate,
            rulesetId: data.rulesetId,
        }));

        historyManager.startTransaction();
        historyManager.execute(
            new SetRulesCommand(this.targetLayerRenderer.tilemap.objectId, this.targetLayerRenderer.layer.objectId, updates),
            this.editorFacade,
        );
        historyManager.commitTransaction();
    }

    private createPreviewPayload(coord: Coordinate): RulePreviewData[] {
        if (!this.currentView || !this.isTargetLayerSupported(this.targetLayerRenderer)) return [];
        if (this.targetLayerRenderer.layer.locked || !this.targetLayerRenderer.layer.visible) return [];
        if (!this.currentView.session.tilemap.isInBoundary(coord)) return [];

        const selectedRuleset = this.getSelectedRuleset();
        if (!selectedRuleset) return [];

        const sprite = new Sprite(Texture.WHITE);
        sprite.tint = new Color(selectedRuleset.color);
        sprite.alpha = RuleStampTool.spriteAlpha;
        sprite.width = this.currentView.session.tilemap.tileWidth;
        sprite.height = this.currentView.session.tilemap.tileHeight;

        const position = this.targetLayerRenderer.coordToPos(coord);
        sprite.position.set(position.x, position.y);

        return [{
            key: `${coord.col},${coord.row}`,
            coordinate: coord,
            sprite,
            rulesetId: selectedRuleset.id,
        }];
    }

    private getSelectedRuleset() {
        const selectedRuleId = this.editorFacade.currentWorkspace?.rulesetSessionManager.getSelectedRuleId();
        if (!selectedRuleId) return null;
        return this.editorFacade.currentProject?.rulesetManager.getRulesetById(selectedRuleId) ?? null;
    }
}
