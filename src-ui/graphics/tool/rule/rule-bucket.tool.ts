import { SetRulesCommand } from "@/application/commands/tile/set-rules.command";
import { RuleLayer } from "@/editor/model/tilemap/layer/rule-layer";
import { RuleLayerRenderer } from "@/graphics/renderer/tilemap/rule-layer.renderer";
import type { SelectedRule } from "@/graphics/tool/base/grid-tool-utils";
import { coordinateKey, getSelectedRule, isSameRuleRef, sameCoordinate } from "@/graphics/tool/base/grid-tool-utils";
import { PointerTool } from "@/graphics/tool/base/pointer.tool";
import { Color, FederatedPointerEvent, Sprite, Texture } from "pixi.js";

type RuleRefLike = { rulesetId: string | null } | null;

type RuleBucketPreviewPayload = {
    key: string;
    coordinate: Coordinate;
    sprite: Sprite;
    rulesetId: string;
};

export class RuleBucketTool extends PointerTool {
    private static readonly spriteAlpha = 0.9;

    private currentCoordinate: Coordinate | null = null;
    private previewPayloads: Map<string, RuleBucketPreviewPayload> = new Map();

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

        if (!this.currentView || !this.isTargetLayerSupported(this.targetLayerRenderer)) {
            this.clearPreview();
            this.reset();
            return;
        }

        if (this.targetLayerRenderer.layer.locked || !this.targetLayerRenderer.layer.visible) {
            this.clearPreview();
            this.reset();
            return;
        }

        const coordinate = this.targetLayerRenderer.posToCoord(this.getLocalPos(e));
        this.currentCoordinate = coordinate;
        this.updatePreview(coordinate);

        this.commitPreview();
        this.clearPreview();
        this.reset();
    }

    protected override onPointerMove(e: FederatedPointerEvent): void {
        if (!this.currentView || !this.isTargetLayerSupported(this.targetLayerRenderer)) {
            this.clearPreview();
            this.reset();
            return;
        }

        const coordinate = this.targetLayerRenderer.posToCoord(this.getLocalPos(e));
        if (this.currentCoordinate && sameCoordinate(this.currentCoordinate, coordinate)) return;

        this.currentCoordinate = coordinate;
        this.updatePreview(coordinate);
    }

    protected override onPointerOutside(e: FederatedPointerEvent): void {
        this.clearPreview();
        this.reset();
    }

    private updatePreview(origin: Coordinate): void {
        this.clearPreview();

        if (!this.overlayContainer || !this.currentView || !this.isTargetLayerSupported(this.targetLayerRenderer)) return;
        if (this.targetLayerRenderer.layer.locked || !this.targetLayerRenderer.layer.visible) return;
        if (!this.currentView.session.tilemap.isInBoundary(origin)) return;

        const selectedRule = getSelectedRule(this.editorFacade);
        if (!selectedRule) return;

        const original = this.targetLayerRenderer.layer.getRulesetRefAt(origin);
        if (isSameRuleRef(original, selectedRule.id)) return;

        const coordinates = this.collectFloodFill(origin, original);
        coordinates.forEach((coordinate) => {
            const payload = this.createPreviewPayload(coordinate, selectedRule);
            if (!payload) return;

            this.previewPayloads.get(payload.key)?.sprite.destroy();
            this.overlayContainer!.addChild(payload.sprite);
            this.previewPayloads.set(payload.key, payload);
        });
    }

    private createPreviewPayload(
        coordinate: Coordinate,
        selectedRule: SelectedRule,
    ): RuleBucketPreviewPayload | null {
        if (!this.currentView || !this.isTargetLayerSupported(this.targetLayerRenderer)) return null;

        const sprite = new Sprite(Texture.WHITE);
        sprite.tint = new Color(selectedRule.color);
        sprite.alpha = RuleBucketTool.spriteAlpha;
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

        const session = this.editorFacade.getActiveTilemapSession();
        if (!session || this.previewPayloads.size === 0) return;

        const updates = Array.from(this.previewPayloads.values()).map((payload) => ({
            coordinate: payload.coordinate,
            rulesetId: payload.rulesetId,
        }));

        const historyManager = session.historyManager;
        historyManager.startTransaction();
        historyManager.execute(
            new SetRulesCommand(
                this.targetLayerRenderer.tilemap.objectId,
                this.targetLayerRenderer.layer.objectId,
                updates,
            ),
            session,
        );
        historyManager.commitTransaction();
    }

    private collectFloodFill(start: Coordinate, original: RuleRefLike): Coordinate[] {
        if (!this.currentView || !this.isTargetLayerSupported(this.targetLayerRenderer)) return [];

        const queue: Coordinate[] = [start];
        const visited = new Set<string>();
        const result: Coordinate[] = [];

        let head = 0;
        while (head < queue.length) {
            const current = queue[head++];
            const key = coordinateKey(current);

            if (visited.has(key)) continue;
            visited.add(key);

            if (!this.currentView.session.tilemap.isInBoundary(current)) continue;
            if (!isSameRuleRef(
                this.targetLayerRenderer.layer.getRulesetRefAt(current),
                original?.rulesetId ?? null,
            )) continue;

            result.push(current);
            queue.push(
                { col: current.col, row: current.row - 1 },
                { col: current.col, row: current.row + 1 },
                { col: current.col - 1, row: current.row },
                { col: current.col + 1, row: current.row },
            );
        }

        return result;
    }

    private clearPreview(): void {
        this.previewPayloads.forEach((payload) => payload.sprite.destroy());
        this.previewPayloads.clear();
    }

    private reset(): void {
        this.currentCoordinate = null;
    }

    private isTargetLayerSupported(layerRenderer: any): layerRenderer is RuleLayerRenderer {
        return layerRenderer?.layer instanceof RuleLayer;
    }
}