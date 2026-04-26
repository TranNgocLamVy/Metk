import { EditorContext } from "../application/editorContext";
import { TilemapSession } from "../application/session/tilemapSession";
import { TilemapSessionView } from "../application/session/tilemapSessionView";

export interface ITool {
    onEnable(): void;
    onDisable(): void;
    attach(session: TilemapSession, view: TilemapSessionView): void;
    detach(): void;
}

export type IToolContructor = new (editorContext: EditorContext) => ITool; 