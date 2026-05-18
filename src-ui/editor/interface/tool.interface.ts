import { IDrawStrategy } from "@/graphics/strategies/draw-strategy.interface";
import { EditorFacade } from "@/application/editor.facade";
import { BaseLayerRenderer } from "@/graphics/renderer/base-layer.renderer";
import { TilemapView } from "@/graphics/view/tilemap.view";

export interface ITool {
    onEnable(): void;
    onDisable(): void;
    attachView(view: TilemapView): void;
    detach(): void;
    setDrawStrategy(strategy: IDrawStrategy | null): void;
    setTargetLayerRenderer(layerRenderer: BaseLayerRenderer | null): void;
}

export type IToolContructor = new (editorFacade: EditorFacade) => ITool; 