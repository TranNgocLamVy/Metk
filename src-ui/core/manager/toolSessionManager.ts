import { ToolStateData } from "@/shared/schema/toolSession";

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
        const toolManager = this.editorContext.getToolManager();
        if (this.toolSessionData?.currentTool) {
            toolManager.startTool(this.toolSessionData.currentTool);
        }
        toolManager.on("onToolChanged", this.bindOnToolChanged);
    }

    public async unload() {
        const toolManager = this.editorContext.getToolManager();
        toolManager.off("onToolChanged", this.bindOnToolChanged);
    }

    public async onToolChange() {
        const currentTool = this.editorContext.getToolManager().getCurrentToolId() ?? undefined;
        this.updateToolState({ currentTool });
        const workspace = this.editorContext.getCurrentWorkspace();
        await workspace.save();
    }

    public async updateToolState(toolStateData: Partial<ToolStateData>) {
        this.toolSessionData = { ...this.toolSessionData, ...toolStateData };
    }

    public serialize(): ToolStateData {
        return this.toolSessionData;
    }
}