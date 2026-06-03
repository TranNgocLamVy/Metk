import { RemoveEntityCommand } from "@/application/commands/layer/remove-entity.command";
import { EntityLayer } from "@/editor/model/tilemap/layer/entity-layer";
import { EntityLayerRenderer } from "@/graphics/renderer/tilemap/entity-layer.renderer";
import { PointerTool } from "@/graphics/tool/base/pointer.tool";
import { FederatedPointerEvent } from "pixi.js";

export class EntityDeleteTool extends PointerTool {
    protected override onPointerDown(e: FederatedPointerEvent): void {
        if (e.button !== 0) return;
        if (!this.isTargetLayerSupported(this.targetLayerRenderer)) return;
        if (this.targetLayerRenderer.layer.locked || !this.targetLayerRenderer.layer.visible) return;

        const entity = this.targetLayerRenderer.layer.getEntityAt(this.getLocalPos(e));
        if (!entity) return;

        const historyManager = this.editorFacade.getCurrentHistoryManager();
        if (!historyManager) return;

        historyManager.startTransaction();
        historyManager.execute(
            new RemoveEntityCommand(
                this.targetLayerRenderer.tilemap.objectId,
                this.targetLayerRenderer.layer.objectId,
                [entity.id],
            ),
            this.editorFacade,
        );
        historyManager.commitTransaction();
    }

    private isTargetLayerSupported(layerRenderer: any): layerRenderer is EntityLayerRenderer {
        return layerRenderer?.layer instanceof EntityLayer;
    }
}
