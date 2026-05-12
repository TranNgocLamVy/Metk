import { EditorContext } from "../application/editorContext";
import { BaseLayerRenderer } from "../application/renderer/baseLayerRenderer";
import { TilemapView } from "../application/view/tilemapView";
import { IDrawStrategy } from "../tool/drawStrategy/IDrawStrategy";

export interface ITool {
    onEnable(): void;
    onDisable(): void;
    attachView(view: TilemapView): void;
    detach(): void;
    setDrawStrategy(strategy: IDrawStrategy | null): void;
    setTargetLayerRenderer(layerRenderer: BaseLayerRenderer | null): void;
}

export type IToolContructor = new (editorContext: EditorContext) => ITool; 