import { v4 as uuidv4 } from "uuid";

import { useLayerManagerStore } from "@/view/stores/application/layerManagerStore";

import { EditorContext } from "../../application/editorContext";
import { IBaseCommand } from "../../interface/IBaseCommand";

export class RenameLayerCommand implements IBaseCommand {
    public readonly id: string = uuidv4()
    private oldName: string;
    constructor(
        private readonly targetLayerId: string,
        private readonly newName: string,
    ) { }

    public execute(context: EditorContext): void {
        const currentSession = context.getCurrentTilemapSession()
        if (!currentSession) return;
        const root = currentSession.tilemap.rootLayer;

        const targetLayer = root.findLayer(this.targetLayerId);
        if (!targetLayer) return;

        this.oldName = targetLayer.name;
        targetLayer.rename(this.newName);

        useLayerManagerStore.getState().refresh()
    }

    public undo(context: EditorContext): void {
        const currentSession = context.getCurrentTilemapSession()
        if (!currentSession) return;
        const root = currentSession.tilemap.rootLayer;
        
        const targetLayer = root.findLayer(this.targetLayerId);
        if (!targetLayer) return;

        targetLayer.rename(this.oldName);

        useLayerManagerStore.getState().refresh()
    }

    public delete(): void {
        
    }
}