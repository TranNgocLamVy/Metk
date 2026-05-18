// import { EditorContext } from "@/core/application/editorContext";
// import { DrawPayload, IDrawStrategy } from "./IDrawStrategy";
// import { TilemapSession } from "@/core/application/session/tilemapSession";
// import { Container, Sprite } from "pixi.js";


// // Template for object drawing strategy
// export class DrawObjectStrategy implements IDrawStrategy {
//     public canHandle(layer: any, tool: any): boolean {
//         return false;
//     }

//     public getRefAt(pos: Position, layer: any): any {
//         throw new Error("Method not implemented.");
//     }

//     public comparePosition(pos1: Position, pos2: Position, layer: any): boolean {
//         return false
//     }

//     public getBrushSize(editorContext: EditorContext): { width: number, height: number } {
//         throw new Error("Method not implemented.");
//     }

//     public getStampAt(coord: Coordinate, editorContext: EditorContext, session: TilemapSession): DrawPayload[] {
//         throw new Error("Method not implemented.");
//     }

//     public drawHoverPreview(pos: Position, layer: any, editorContext: EditorContext, session: TilemapSession, overlayContainer: Container): Sprite[] {
//         throw new Error("Method not implemented.");
//     }

//     public getPayload(pos: Position, layer: any, editorContext: EditorContext, session: TilemapSession): DrawPayload[] {
//         throw new Error("Method not implemented.");
//     }

//     public commit(layer: any, previewData: DrawPayload[], editorContext: EditorContext): void {
//         throw new Error("Method not implemented.");
//     }
// }