import EventEmitter from "eventemitter3";

import { EditorContext } from "../application/editorContext";
import { TilemapSession } from "../application/session/tilemapSession";
import { ToolContext } from "../decorator/tool";
import { ITool, IToolContructor } from "../interface/ITool";

type ToolManagerEvent = {
    onToolChanged: () => void;
}

export class ToolManager extends EventEmitter<ToolManagerEvent> {
    public static TOOL_REGISTRY: Array<ToolContext> = [];

    private toolMap: Map<string, IToolContructor> = new Map<string, IToolContructor>();
    private currentTool: ITool | null;
    private currentToolId: string | null;

    private editorContext: EditorContext

    constructor() {
        super();
        this.initializeDecoratedTools();
    }

    public setEditorContext(editorContext: EditorContext) {
        this.editorContext = editorContext;

        this.editorContext.eventEmitter.on("onOpenTilemapSession", () => {
            this.onSessionChanged(this.editorContext.getCurrentTilemapSession());
        });
    }

    private initializeDecoratedTools() {
        ToolManager.TOOL_REGISTRY.forEach((toolContext: ToolContext) => {
            this.registerTool(toolContext.id, toolContext.constructor);
        });
        this.emit("onToolChanged");
    }

    public getToolContexts(): ToolContext[] {
        return ToolManager.TOOL_REGISTRY.map((toolContext) => {
            return {
                ...toolContext
            }
        })
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
            this.emit("onToolChanged");
        }
    }

    public stopTool() {
        if (this.currentTool) {
            this.currentTool.detach();
            this.currentTool.onDisable();
            this.currentTool = null;
            this.currentToolId = null;
            this.emit("onToolChanged");
        }
    }
}