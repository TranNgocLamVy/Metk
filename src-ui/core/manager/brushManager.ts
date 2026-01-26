import { EditorContext } from "../application/editorContext";
import { StampBrush } from "../brush/stampBrush";
import { IBrush, IBrushContructor } from "../interface/IBrush";

export class BrushManager {
    private brushMap: Map<string, IBrushContructor> = new Map<string, IBrushContructor>();
    private currentBrush: IBrush | null;
    private currentBrushId: string | null;

    constructor(private readonly editorContext: EditorContext) {
        this.registerBrush("stamp", StampBrush);
        this.startBrush("stamp");
    }

    public registerBrush(brushId: string, brushConstructor: IBrushContructor) {
        this.brushMap.set(brushId, brushConstructor);
    }
    
    public startBrush(brushId: string) {
        this.stopBrush();

        const BrushConstructor = this.brushMap.get(brushId);
        if (BrushConstructor) {
            this.currentBrush = new BrushConstructor(this.editorContext);
            this.currentBrushId = brushId;
            this.currentBrush.startBrush();
        }
    }

    public stopBrush() {
        if (this.currentBrush) {
            this.currentBrush.stopBrush()
            this.currentBrush = null;
            this.currentBrushId = null;
        }
    }

    public restartBrush() {
        const currentBrushId = this.currentBrushId;
        this.stopBrush();
        if (currentBrushId) this.startBrush(currentBrushId);
    }
}