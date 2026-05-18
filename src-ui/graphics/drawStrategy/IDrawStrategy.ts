import { EditorContext } from "@/core/application/editorContext";
import { BaseLayerRenderer } from "@/graphics/renderer/baseLayerRenderer";
import { TilemapSession } from "@/core/application/session/tilemapSession";
import { ITool } from "@/core/interface/ITool";
import { Container, Sprite } from "pixi.js";

export interface DrawPayload {
    key: string;
    coordinate: Coordinate;
    position: Position;
    sprite: Sprite;
    [key: string]: any;
}

export interface IDrawStrategy {
    canHandle(layerRenderer: BaseLayerRenderer<any>, tool: ITool): boolean;

    getBrushSize(editorContext: EditorContext): { width: number, height: number };

    comparePosition(pos1: Position, pos2: Position, layer: BaseLayerRenderer<any>): boolean;

    getRefAt(pos: Position, layer: BaseLayerRenderer<any>): any;

    drawHoverPreview(pos: Position, layer: BaseLayerRenderer<any>, editorContext: EditorContext, session: TilemapSession, overlayContainer: Container): Sprite[];

    getPayload(pos: Position, layer: BaseLayerRenderer<any>, editorContext: EditorContext, session: TilemapSession): DrawPayload[];

    commit(layer: BaseLayerRenderer<any>, previewData: DrawPayload[], editorContext: EditorContext): void;
}