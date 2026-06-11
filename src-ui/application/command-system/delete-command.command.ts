import { EditorFacade } from "@/application/editor.facade";
import { SystemCommand } from "@/application/commands/command.decorator";
import { DeleteLayerCommand } from "@/application/commands/layer/delete-layer.command";
import { BaseLayer } from "@/editor/model/tilemap/layer/base-layer";
import { ISystemCommand } from "@/editor/interface/base-command.interface";
import { Result } from "@/shared/types/result";

@SystemCommand({
    id: "workspace.delete",
    name: "global.action.delete",
    description: "command.delete.description",
    shortcuts: ["DELETE"],
    when: "tilmapSessionOpened && !isModalOpen",
})
export class DeleteCommand implements ISystemCommand {
    public execute(editorFacade: EditorFacade): Result {
        const activationContext = editorFacade.activationContext;

        if (activationContext.evaluateWhen("focusLayerManager")) {
            return this.deleteSelectedLayers(editorFacade);
        }

        return Result.Cancel();
    }

    private deleteSelectedLayers(editorFacade: EditorFacade): Result {
        const currentSession = editorFacade.getActiveTilemapSession();

        if (!currentSession) return Result.Cancel();
        const historyManager = currentSession.historyManager;

        const root = currentSession.tilemap.rootLayer;
        const selectedIds = [...currentSession.layerState.selectedLayers];

        if (selectedIds.length === 0) return Result.Cancel();

        const selectedLayers = selectedIds.map((id) => root.findLayer(id)).filter((layer): layer is BaseLayer => !!layer);

        const layersToDelete = selectedLayers.filter((layer) =>
            !selectedLayers.some(
                (candidate) =>
                    candidate.id !== layer.id && candidate.isAncestorOf(layer),
            ),
        );

        if (layersToDelete.length === 0) return Result.Cancel();

        historyManager.startTransaction();

        layersToDelete.forEach((layer) => {
            const command = new DeleteLayerCommand(currentSession.tilemap.objectId, layer.objectId);
            historyManager.execute(command, currentSession);
        });

        historyManager.commitTransaction();

        const existingLayerIds = Array.from(root.getAllIds());

        currentSession.updateLayerState({
            selectedLayers: existingLayerIds.filter((id) => selectedIds.includes(id)),
        });

        return Result.Success();
    }
}
