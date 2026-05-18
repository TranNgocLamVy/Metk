import { IDrawStrategy } from "@/graphics/drawStrategy/IDrawStrategy";
import { EditorContext } from "../application/editorContext";
import { BaseLayerRenderer } from "../../graphics/renderer/baseLayerRenderer";
import { TilemapView } from "../../graphics/view/tilemapView";

export interface ITool {
    onEnable(): void;
    onDisable(): void;
    attachView(view: TilemapView): void;
    detach(): void;
    setDrawStrategy(strategy: IDrawStrategy | null): void;
    setTargetLayerRenderer(layerRenderer: BaseLayerRenderer | null): void;
}

export type IToolContructor = new (editorContext: EditorContext) => ITool; 