import { EditorFacade } from "@/application/editor.facade";
import { BaseLayerRenderer } from "@/graphics/renderer/base-layer.renderer";
import { TilemapSession } from "@/editor/session/tilemap.session";
import { ITool } from "@/editor/interface/tool.interface";
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

    getBrushSize(editorContext: EditorFacade): { width: number, height: number };

    comparePosition(pos1: Position, pos2: Position, layer: BaseLayerRenderer<any>): boolean;

    getRefAt(pos: Position, layer: BaseLayerRenderer<any>): any;

    drawHoverPreview(pos: Position, layer: BaseLayerRenderer<any>, editorContext: EditorFacade, session: TilemapSession, overlayContainer: Container): Sprite[];

    getPayload(pos: Position, layer: BaseLayerRenderer<any>, editorContext: EditorFacade, session: TilemapSession): DrawPayload[];

    commit(layer: BaseLayerRenderer<any>, previewData: DrawPayload[], editorContext: EditorFacade): void;
}