import { v4 as uuidv4 } from "uuid";

import { useLayerManagerStore } from "@/view/stores/application/layerManagerStore";

import { EditorContext } from "../../application/editorContext";
import { IBaseCommand } from "../../interface/IBaseCommand";

export class ToggleLayerVisibilityCommand implements IBaseCommand {
    public readonly id: string = uuidv4()
    private oldIsVisible: boolean
    constructor(
        private readonly targetLayerId: string,
        private readonly newIsVisible: boolean
    ) { }

    public execute(context: EditorContext): void {
        const currentSession = context.getCurrentTilemapSession()
        if (!currentSession) return;
        const root = currentSession.tilemap.rootLayer;

        const targetLayer = root.findLayer(this.targetLayerId);
        if (!targetLayer) return;

        this.oldIsVisible = targetLayer.visible;
        targetLayer.toggleVisibility(this.newIsVisible);

        useLayerManagerStore.getState().refresh()
    }

    public undo(context: EditorContext): void {
        const currentSession = context.getCurrentTilemapSession()
        if (!currentSession) return;
        const root = currentSession.tilemap.rootLayer;
        
        const targetLayer = root.findLayer(this.targetLayerId);
        if (!targetLayer) return;

        targetLayer.toggleVisibility(this.oldIsVisible);

        useLayerManagerStore.getState().refresh()
    }

    public delete(): void {
        
    }
}