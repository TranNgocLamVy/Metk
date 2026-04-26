import { ToolStateData } from "@/shared/schema/toolSessionSchema";

import { EditorContext } from "../application/editorContext";

export class ToolSessionManager {
    private bindOnToolChanged: () => void

    constructor(
        private toolSessionData: ToolStateData,
        private readonly editorContext: EditorContext
    ) {
        this.bindOnToolChanged = this.onToolChange.bind(this);
    }

    public async load() {
        const toolManager = this.editorContext.toolManager;
        if (this.toolSessionData?.currentTool) {
            toolManager.startTool(this.toolSessionData.currentTool);
        }
        toolManager.on("onToolChanged", this.bindOnToolChanged);
    }

    public async destroy() {
        this.editorContext.toolManager.off("onToolChanged", this.bindOnToolChanged);
    }

    public async onToolChange() {
        const currentTool = this.editorContext.toolManager.getCurrentToolId() ?? undefined;
        this.updateToolState({ currentTool });
        await this.editorContext.workspaceManager.saveCurrentWorkspace();
    }

    public async updateToolState(toolStateData: Partial<ToolStateData>) {
        this.toolSessionData = { ...this.toolSessionData, ...toolStateData };
    }

    public serialize(): ToolStateData {
        return this.toolSessionData;
    }
}