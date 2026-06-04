import { SetRulesCommand } from "@/application/commands/tile/set-rules.command";
import { RuleLayer } from "@/editor/model/tilemap/layer/rule-layer";
import { RuleLayerRenderer } from "@/graphics/renderer/tilemap/rule-layer.renderer";
import { coordinateKey, getSelectedRule, isSameRuleRef } from "@/graphics/tool/base/grid-tool-utils";
import { PointerTool } from "@/graphics/tool/base/pointer.tool";
import { FederatedPointerEvent } from "pixi.js";

type RuleRefLike = { rulesetId: string | null } | null;

export class RuleBucketTool extends PointerTool {
    protected override onPointerDown(e: FederatedPointerEvent): void {
        if (e.button !== 0) return;
        if (!this.currentView || !this.isTargetLayerSupported(this.targetLayerRenderer)) return;
        if (this.targetLayerRenderer.layer.locked || !this.targetLayerRenderer.layer.visible) return;

        const selectedRule = getSelectedRule(this.editorFacade);
        if (!selectedRule) return;

        const start = this.targetLayerRenderer.posToCoord(this.getLocalPos(e));
        if (!this.currentView.session.tilemap.isInBoundary(start)) return;

        const original = this.targetLayerRenderer.layer.getRulesetRefAt(start);
        if (isSameRuleRef(original, selectedRule.id)) return;

        const coordinates = this.collectFloodFill(start, original);
        if (coordinates.length === 0) return;

        const session = this.editorFacade.getActiveTilemapSession();
        if (!session) return;
        const historyManager = session.historyManager;

        const updates = coordinates.map((coordinate) => ({
            coordinate,
            rulesetId: selectedRule.id,
        }));

        historyManager.startTransaction();
        historyManager.execute(
            new SetRulesCommand(this.targetLayerRenderer.tilemap.objectId, this.targetLayerRenderer.layer.objectId, updates),
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
            if (!isSameRuleRef(this.targetLayerRenderer.layer.getRulesetRefAt(current), original?.rulesetId ?? null)) continue;

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

    private isTargetLayerSupported(layerRenderer: any): layerRenderer is RuleLayerRenderer {
        return layerRenderer?.layer instanceof RuleLayer;
    }
}

