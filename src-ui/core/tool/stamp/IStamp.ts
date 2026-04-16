import { EditorContext } from "@/core/application/editorContext";
import { TilemapSession } from "@/core/application/session/tilemapSession";
import { BaseLayer } from "@/core/application/tile/layer/baseLayer";
import { HistoryManager } from "@/core/manager/historyManager";
import { Container, Sprite } from "pixi.js";

// Generic payload that strategies can attach their own custom data to
export interface StampPreviewData {
    sprite: Sprite;
    [key: string]: any; 
}

export interface IStamp {
    canHandle(layer: BaseLayer<any>): boolean;

    drawHoverPreview(
        coord: Coordinate,
        editorContext: EditorContext,
        session: TilemapSession,
        overlayContainer: Container
    ): Sprite[];

    stampAt(
        coord: Coordinate,
        editorContext: EditorContext,
        session: TilemapSession,
        overlayContainer: Container,
        previewMap: Map<string, StampPreviewData>
    ): void;

    commit(
        layer: BaseLayer<any>,
        previewMap: Map<string, StampPreviewData>,
        editorContext: EditorContext,
        historyManager: HistoryManager,
    ): void;
}