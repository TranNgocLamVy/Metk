import { EditorContext } from "@/core/application/editorContext";
import { TilemapSession } from "@/core/application/session/tilemapSession";
import { BaseLayer } from "@/core/application/tile/layer/baseLayer";
import { Container, Sprite } from "pixi.js";

export interface DrawPayload {
    sprite: Sprite;
    coordinate: Coordinate;
    [key: string]: any;
}

export interface IDrawStrategy {
    canHandle(layer: BaseLayer<any>): boolean;

    getBrushSize(editorContext: EditorContext): { width: number, height: number };

    getRefAt(coord: Coordinate, layer: BaseLayer<any>): any;

    getPayload(coord: Coordinate, editorContext: EditorContext, session: TilemapSession): DrawPayload[];

    commit(layer: BaseLayer<any>, previewData: DrawPayload[], editorContext: EditorContext): void;

    drawHoverPreview(coord: Coordinate, editorContext: EditorContext,session: TilemapSession, overlayContainer: Container): Sprite[];
}