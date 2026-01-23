import { EditorContext } from "../application/editorContext";

export interface IBaseCommand {
    readonly id: string;
    execute(context: EditorContext): void;
    undo(context: EditorContext): void;
    delete(): void
}