import EventEmitter from "eventemitter3";

import { EditorContext } from "../application/editorContext";
import { TilemapSession } from "../application/session/tilemapSession";
import { ToolContext } from "../decorator/tool";
import { ITool, IToolContructor } from "../interface/ITool";
import { TilemapSessionView } from "../application/session/tilemapSessionView";

type ToolManagerEvent = {
    onToolChanged: () => void;
}

export class ToolManager extends EventEmitter<ToolManagerEvent> {
    public static TOOL_REGISTRY: Array<ToolContext> = [];

    private toolMap: Map<string, IToolContructor> = new Map<string, IToolContructor>();
    private currentTool: ITool | null;
    private currentToolId: string | null;

    private editorContext: EditorContext;

    private activeTilemapSession: TilemapSession | null = null;
    private activeTilemapSessionView: TilemapSessionView | null = null;

    constructor() {
        super();
        this.initializeDecoratedTools();
    }

    public setEditorContext(editorContext: EditorContext) {
        this.editorContext = editorContext;
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

    public setActiveSession(session: TilemapSession | null, view: TilemapSessionView | null) {
        this.activeTilemapSession = session;
        this.activeTilemapSessionView = view;

        if (this.currentTool) this.currentTool.detach();

        if (session && view && this.currentTool) {
            this.currentTool.attach(session, view);
        }
    }

    public startTool(toolId: string) {
        this.clearTool();

        const ToolConstructor = this.toolMap.get(toolId);
        if (ToolConstructor) {
            this.currentTool = new ToolConstructor(this.editorContext);
            this.currentToolId = toolId;

            this.currentTool.onEnable();

            if (this.activeTilemapSession && this.activeTilemapSessionView) {
                this.currentTool.attach(this.activeTilemapSession, this.activeTilemapSessionView);
            }
            this.emit("onToolChanged");
        }
    }

    private clearTool() {
        if (this.currentTool) {
            this.currentTool.detach();
            this.currentTool.onDisable();
            this.currentTool = null;
            this.currentToolId = null;
            this.emit("onToolChanged");
        }
    }

    public stopTool() {
        if (this.currentTool) {
            this.currentTool.detach();
            this.currentTool.onDisable();
        }
    }

    public resumeTool() {
        if (this.currentTool) {
            this.currentTool.onEnable();
            if (this.activeTilemapSession && this.activeTilemapSessionView) {
                this.currentTool.attach(this.activeTilemapSession, this.activeTilemapSessionView);
            }
        }
    }
}