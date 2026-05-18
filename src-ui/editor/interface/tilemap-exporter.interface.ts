
import { EditorFacade } from "@/application/editor.facade";
import { Tilemap } from "../model/tilemap/tilemap";

export interface ITilemapExporter {
    export(tilemap: Tilemap,  exportPath: string, editorContext: EditorFacade): Uint8Array;
}