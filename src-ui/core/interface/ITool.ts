import { EditorContext } from "../application/editorContext";
import { TilemapSession } from "../application/session/tilemapSession";

export interface ITool {
    onEnable(): void;
    onDisable(): void;
    attach(session: TilemapSession): void;
    detach(): void;
}

export type IToolContructor = new (editorContext: EditorContext) => ITool; 