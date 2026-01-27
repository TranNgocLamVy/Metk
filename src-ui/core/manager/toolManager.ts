import { EditorContext } from "../application/editorContext";
import { TilemapSession } from "../application/session/tilemapSession";
import { StampBrush } from "../brush/stampBrush";
import { ITool, IToolContructor } from "../interface/ITool";

export class ToolManager {
    private toolMap: Map<string, IToolContructor> = new Map<string, IToolContructor>();
    private currentTool: ITool | null;

    constructor(private readonly editorContext: EditorContext) {
        this.registerTool("stamp", StampBrush);

        this.editorContext.eventEmitter.on("onOpenTilemapSession", () => {
            this.onSessionChanged(this.editorContext.getCurrentTilemapSession());
        });
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
            
            this.currentTool.onEnable();

            const activeTilemapSession = this.editorContext.getCurrentTilemapSession();
            if (activeTilemapSession) {
                this.currentTool.attach(activeTilemapSession);
            }
        }
    }

    public stopTool() {
        if (this.currentTool) {
            this.currentTool.detach();
            this.currentTool.onDisable();
            this.currentTool = null;
        }
    }
}