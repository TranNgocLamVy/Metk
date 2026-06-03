import { EditorFacade } from "@/application/editor.facade";
import { ToolStateData } from "@/shared/data-types/workspace.data";


export class ToolSessionManager {
    private bindOnToolChanged: () => void

    constructor(
        private toolSessionData: ToolStateData,
        private readonly editorFacade: EditorFacade
    ) {
        this.bindOnToolChanged = this.onToolChange.bind(this);
    }

    public async load() {
        const toolManager = this.editorFacade.toolManager;
        if (this.toolSessionData?.currentToolFamily) {
            toolManager.startToolFamily(this.toolSessionData.currentToolFamily);
        }
        toolManager.on("onToolChanged", this.bindOnToolChanged);
    }

    public async destroy() {
        this.editorFacade.toolManager.off("onToolChanged", this.bindOnToolChanged);
    }

    public async onToolChange() {
        const currentToolFamilyId = this.editorFacade.toolManager.getCurrentFamilyId() ?? undefined;
        this.updateToolState({ currentToolFamily: currentToolFamilyId });
        await this.editorFacade.workspaceManager.saveCurrentWorkspace();
    }

    public async updateToolState(toolStateData: Partial<ToolStateData>) {
        this.toolSessionData = { ...this.toolSessionData, ...toolStateData };
    }

    public serialize(): ToolStateData {
        return this.toolSessionData;
    }
}