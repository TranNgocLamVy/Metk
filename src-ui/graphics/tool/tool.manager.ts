import EventEmitter from "eventemitter3";

import { BaseLayerRenderer } from "../renderer/base-layer.renderer";
import { GroupLayerRenderer } from "../renderer/group-layer.renderer";
import { IDrawStrategy } from "@/graphics/strategies/draw-strategy.interface";
import { DrawTileStrategy } from "@/graphics/strategies/draw-tile.strategy";
import { DrawRuleStrategy } from "@/graphics/strategies/draw-rule.strategy";
import { ToolContext } from "@/graphics/tool/tool.decorator";
import { ITool, IToolContructor } from "@/editor/interface/tool.interface";
import { EditorFacade } from "@/application/editor.facade";
import { TilemapView } from "../view/tilemap.view";

type ToolManagerEvent = {
    onToolChanged: (toolId: string | null) => void;
}

export class ToolManager extends EventEmitter<ToolManagerEvent> {
    public static TOOL_REGISTRY: Array<ToolContext> = [];

    private toolMap: Map<string, IToolContructor> = new Map<string, IToolContructor>();
    private currentTool: ITool | null;
    private currentToolId: string | null;

    private editorFacade: EditorFacade;

    private activeTilemapView: TilemapView | null = null;

    private drawStrategys: IDrawStrategy[];

    private bindOnSelectedLayersChanged: (layerIds: string[]) => void;

    constructor() {
        super();

        this.initializeDecoratedTools();

        this.drawStrategys = [
            new DrawTileStrategy(),
            new DrawRuleStrategy()
        ];

        this.bindOnSelectedLayersChanged = this.onSelectedLayersChanged.bind(this);
    }

    public setEditorContext(editorFacade: EditorFacade) {
        this.editorFacade = editorFacade;
    }

    private initializeDecoratedTools() {
        ToolManager.TOOL_REGISTRY.forEach((toolContext: ToolContext) => {
            this.registerTool(toolContext.id, toolContext.constructor);
        });
    }

    public getToolContexts(): ToolContext[] {
        return ToolManager.TOOL_REGISTRY.map((toolContext) => {
            return {
                ...toolContext
            }
        })
    }

    public getCurrentToolId(): string | null {
        return this.currentToolId;
    }

    public registerTool(toolId: string, brushConstructor: IToolContructor) {
        this.toolMap.set(toolId, brushConstructor);
    }

    public setActiveView(view: TilemapView | null) {
        if (this.activeTilemapView) this.activeTilemapView.session.off("onSelectedLayersChanged", this.bindOnSelectedLayersChanged);

        this.activeTilemapView = view;

        if (this.currentTool) this.currentTool.detach();

        if (view && this.currentTool) {
            this.currentTool.attachView(view);
            view.session.on("onSelectedLayersChanged", this.bindOnSelectedLayersChanged);
            this.onSelectedLayersChanged();
        }
    }

    private onSelectedLayersChanged() {
        if (!this.activeTilemapView || !this.currentTool) return;

        let targetLayerRenderer: BaseLayerRenderer | null = null;
        const layerIds = this.activeTilemapView.session.layerState.selectedLayers;
        for (const id of layerIds) {
            const layerRenderer = this.activeTilemapView.renderer.findLayerRenderer(id);
            if (!layerRenderer || layerRenderer instanceof GroupLayerRenderer) continue;
            targetLayerRenderer = layerRenderer;
            break;
        }
        this.currentTool.setTargetLayerRenderer(targetLayerRenderer);
        if (!targetLayerRenderer) {
            this.currentTool.setDrawStrategy(null);
        } else {   
            const activeDrawStrategy = this.drawStrategys.find(s => s.canHandle(targetLayerRenderer, this.currentTool!)) || null;
            this.currentTool.setDrawStrategy(activeDrawStrategy);
        }

    }

    public startTool(toolId: string) {
        this.clearTool();

        const ToolConstructor = this.toolMap.get(toolId);
        if (ToolConstructor) {
            this.currentTool = new ToolConstructor(this.editorFacade);
            this.currentToolId = toolId;

            this.currentTool.onEnable();

            if (this.activeTilemapView) {
                this.currentTool.attachView(this.activeTilemapView);
                this.activeTilemapView.session.off("onSelectedLayersChanged", this.bindOnSelectedLayersChanged);
                this.activeTilemapView.session.on("onSelectedLayersChanged", this.bindOnSelectedLayersChanged);
                this.onSelectedLayersChanged();
            }
            this.emit("onToolChanged", toolId);
        }
    }

    private clearTool() {
        if (this.currentTool) {
            if (this.activeTilemapView) this.activeTilemapView.session.off("onSelectedLayersChanged", this.bindOnSelectedLayersChanged);
            this.currentTool.detach();
            this.currentTool.onDisable();
            this.currentTool = null;
            this.currentToolId = null;
            this.emit("onToolChanged", null);
        }
    }

    public stopTool() {
        if (this.currentTool) {
            this.currentTool.detach();
            this.currentTool.onDisable();
        }
    }

    public resumeTool() {
        if (this.currentTool) {
            this.currentTool.onEnable();
            if (this.activeTilemapView) {
                this.currentTool.attachView(this.activeTilemapView);
            }
        }
    }
}
