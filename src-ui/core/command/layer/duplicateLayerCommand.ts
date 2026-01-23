import { v4 as uuidv4 } from "uuid";

import { useLayerManagerStore } from "@/view/stores/application/layerManagerStore";

import { EditorContext } from "../../application/editorContext";
import { IBaseCommand } from "../../interface/IBaseCommand";

export class DuplicateLayerCommand implements IBaseCommand {
    public readonly id: string = uuidv4()
    private newLayerId: string
    constructor(
        private readonly targetLayerId: string,
    ) { }

    public execute(context: EditorContext): void {
        const currentSession = context.getCurrentTilemapSession()
        if (!currentSession) return;
        const root = currentSession.tilemap.rootLayer;

        const targetLayer = root.findLayer(this.targetLayerId);
        if (!targetLayer) return;

        const duplicateLayer = targetLayer.duplicate();
        if (!duplicateLayer) return;
        this.newLayerId = duplicateLayer.id;
        const cloneLayerName = `${targetLayer.name} (copy)`
        duplicateLayer.rename(cloneLayerName);

        useLayerManagerStore.getState().refresh()
    }

    public undo(context: EditorContext): void {
        const currentSession = context.getCurrentTilemapSession()
        if (!currentSession) return;
        const root = currentSession.tilemap.rootLayer;

        const targetLayer = root.findLayer(this.newLayerId);
        if (!targetLayer) return;

        targetLayer.removeFromParent();

        useLayerManagerStore.getState().refresh()
    }

    public delete(): void {

    }
}