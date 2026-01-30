import { ToolbarItemDisplayData, useToolbarStore } from "@/view/stores/application/toolbarStore";

import { EditorContext } from "../application/editorContext";
import { TilemapSession } from "../application/session/tilemapSession";
import { ToolContext } from "../decorator/tool";
import { ITool, IToolContructor } from "../interface/ITool";

export class ToolManager {
    public static TOOL_REGISTRY: Array<ToolContext> = [];

    private toolMap: Map<string, IToolContructor> = new Map<string, IToolContructor>();
    private currentTool: ITool | null;
    private currentToolId: string | null;

    constructor(private readonly editorContext: EditorContext) {
        this.initializeDecoratedTools();

        this.editorContext.eventEmitter.on("onOpenTilemapSession", () => {
            this.onSessionChanged(this.editorContext.getCurrentTilemapSession());
        });
    }

    private initializeDecoratedTools() {
        const displayData: ToolbarItemDisplayData[] = []
        ToolManager.TOOL_REGISTRY.forEach((toolContext: ToolContext) => {
            this.registerTool(toolContext.id, toolContext.constructor);
            if (toolContext.displayOnToolbar) {
                displayData.push({
                    id: toolContext.id,
                    icon: toolContext.displayOnToolbar.icon,
                    tooltip: toolContext.displayOnToolbar.tooltip,
                    shortcuts: toolContext.shortcuts,
                    index: toolContext.displayOnToolbar.index ?? 1000
                });
            }
        });
        useToolbarStore.getState().setTools(displayData.sort((a, b) => a.index - b.index));
    }

    public getToolsData(): ToolbarItemDisplayData[] {
        const displayData: ToolbarItemDisplayData[] = []
        ToolManager.TOOL_REGISTRY.forEach((toolContext: ToolContext) => {
            if (toolContext.displayOnToolbar) {
                displayData.push({
                    id: toolContext.id,
                    icon: toolContext.displayOnToolbar.icon,
                    tooltip: toolContext.displayOnToolbar.tooltip,
                    shortcuts: toolContext.shortcuts,
                    index: toolContext.displayOnToolbar.index ?? 1000
                });
            }
        });
        return displayData.sort((a, b) => a.index - b.index);
    }

    public getCurrentToolId(): string | null {
        return this.currentToolId;
    }

    public registerTool(toolId: string, brushConstructor: IToolContructor) {
        this.toolMap.set(toolId, brushConstructor);
    }

    private onSessionChanged(newSession: TilemapSession | null) {
        if (this.currentTool) {
            this.currentTool.detach();
        }

        if (newSession && this.currentTool) {
            this.currentTool.attach(newSession);
        }
    }

    public startTool(toolId: string) {
        this.stopTool();

        const ToolConstructor = this.toolMap.get(toolId);
        if (ToolConstructor) {
            this.currentTool = new ToolConstructor(this.editorContext);
            this.currentToolId = toolId;

            this.currentTool.onEnable();

            const activeTilemapSession = this.editorContext.getCurrentTilemapSession();
            if (activeTilemapSession) {
                this.currentTool.attach(activeTilemapSession);
            }
        }

        useToolbarStore.getState().refresh();
    }

    public stopTool() {
        if (this.currentTool) {
            this.currentTool.detach();
            this.currentTool.onDisable();
            this.currentTool = null;
            this.currentToolId = null;
        }

        useToolbarStore.getState().refresh();
    }
}