import { EditorContext } from "@/core/application/editorContext";
import { TilemapSession } from "@/core/application/session/tilemapSession";
import { BaseLayer } from "@/core/application/tile/layer/baseLayer";
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
    canHandle(layer: BaseLayer<any>, tool: ITool): boolean;

    getBrushSize(editorContext: EditorContext): { width: number, height: number };

    comparePosition(pos1: Position, pos2: Position, layer: BaseLayer<any>): boolean;

    getRefAt(pos: Position, layer: BaseLayer<any>): any;

    drawHoverPreview(pos: Position, layer: BaseLayer<any>, editorContext: EditorContext, session: TilemapSession, overlayContainer: Container): Sprite[];

    getPayload(pos: Position, layer: BaseLayer<any>, editorContext: EditorContext, session: TilemapSession): DrawPayload[];

    commit(layer: BaseLayer<any>, previewData: DrawPayload[], editorContext: EditorContext): void;
}