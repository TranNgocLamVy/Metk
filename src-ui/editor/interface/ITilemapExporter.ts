
import { EditorContext } from "../application/editorContext";
import { Tilemap } from "../application/tile/tilemap";

export interface ITilemapExporter {
    export(tilemap: Tilemap,  exportPath: string, editorContext: EditorContext): Uint8Array;
}