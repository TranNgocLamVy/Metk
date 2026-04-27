import { EditorContext } from "../application/editorContext";
import { TilemapSession } from "../application/session/tilemapSession";
import { TilemapView } from "../application/view/tilemapView";

export interface ITool {
    onEnable(): void;
    onDisable(): void;
    attach(session: TilemapSession, view: TilemapView): void;
    detach(): void;
}

export type IToolContructor = new (editorContext: EditorContext) => ITool; 