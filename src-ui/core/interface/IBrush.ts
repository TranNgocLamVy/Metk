import { EditorContext } from "../application/editorContext";

export interface IBrush {
    startBrush(): void;
    stopBrush(): void;
}

export type IBrushContructor = new (editorContext: EditorContext) => IBrush; 