import { EditorContext } from "../application/editorContext";
import { IBrush } from "../interface/IBrush";

export class StampBrush implements IBrush {
    constructor(private readonly context: EditorContext) { }

    public startBrush(): void {

    }

    public stopBrush(): void {

    }
}