
import { EditorFacade } from "@/application/editor.facade";
import { Tilemap } from "../model/tilemap/tilemap";

export interface ITilemapExporter {
    export(tilemap: Tilemap,  exportPath: string, editorFacade: EditorFacade): Uint8Array;
}