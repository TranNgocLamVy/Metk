import { EditorFacade } from "@/application/editor.facade";
import { LayerKind } from "@/shared/data-types/layer.data";
import { ToolStateData } from "@/shared/data-types/workspace.data";

const isPersistedToolLayerKind = (layerKind: LayerKind): layerKind is LayerKind => {
    return LayerKind.includes(layerKind);
};

export class ToolSessionManager {
    private bindOnToolChanged: (familyId: string | null) => void

    constructor(
        private toolSessionData: ToolStateData,
        private readonly editorFacade: EditorFacade
    ) {
        this.bindOnToolChanged = this.onToolChange.bind(this);
    }

    public async load() {
        const toolManager = this.editorFacade.toolManager;
        toolManager.on("onToolChanged", this.bindOnToolChanged);
    }

    public async destroy() {
        this.editorFacade.toolManager.off("onToolChanged", this.bindOnToolChanged);
    }

    public async onToolChange(familyId?: string | null) {
        const currentLayerKind = this.editorFacade.toolManager.getCurrentLayerKind();
        const currentFamilyId = familyId ?? this.editorFacade.toolManager.getCurrentFamilyId();

        if (!isPersistedToolLayerKind(currentLayerKind) || !currentFamilyId) return;

        this.updateToolState({ [currentLayerKind]: currentFamilyId });
        await this.editorFacade.workspaceManager.saveCurrentWorkspace();
    }

    public async updateToolState(toolStateData: Partial<ToolStateData>) {
        this.toolSessionData = { ...this.toolSessionData, ...toolStateData };
    }

    public getRememberedToolFamilyForLayerKind(layerKind: LayerKind): string | null {
        if (!isPersistedToolLayerKind(layerKind)) return null;
        return this.toolSessionData[layerKind] ?? null;
    }

    public serialize(): ToolStateData {
        return this.toolSessionData;
    }
}
