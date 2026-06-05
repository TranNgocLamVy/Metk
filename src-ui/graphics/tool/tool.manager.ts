import EventEmitter from "eventemitter3";

import { EditorFacade } from "@/application/editor.facade";
import { ITool } from "@/editor/interface/tool.interface";
import { EntityLayer } from "@/editor/model/tilemap/layer/entity-layer";
import { ImageLayer } from "@/editor/model/tilemap/layer/image-layer";
import { RuleLayer } from "@/editor/model/tilemap/layer/rule-layer";
import { TileLayer } from "@/editor/model/tilemap/layer/tile-layer";
import { BaseLayerRenderer } from "@/graphics/renderer/tilemap/base-layer.renderer";
import { GroupLayerRenderer } from "@/graphics/renderer/tilemap/group-layer.renderer";
import { BUILTIN_TOOL_GROUPS } from "@/graphics/tool/builtin-tools";
import { ResolvedToolDefinition, ToolAvailabilityContext, ToolFamilyDefinition, ToolGroupDefinition } from "@/graphics/tool/tool.definition";
import { ToolRegistry } from "@/graphics/tool/tool.registry";
import { TilemapView } from "@/graphics/view/tilemap.view";
import { LayerKind } from "@/shared/data-types/layer.data";

type ToolManagerEvent = {
    onToolChanged: (familyId: string | null, concreteToolId?: string | null) => void;
    onToolAvailabilityChanged: (availableFamilyIds: string[]) => void;
}

export class ToolManager extends EventEmitter<ToolManagerEvent> {
    private registry: ToolRegistry;
    private currentTool: ITool | null = null;
    private currentToolId: string | null = null;
    private currentFamilyId: string | null = null;
    private currentToolAttachedView: TilemapView | null = null;

    private editorFacade: EditorFacade;

    private activeTilemapView: TilemapView | null = null;
    private currentTargetLayerRenderer: BaseLayerRenderer | null = null;
    private currentLayerKind: LayerKind = "none";
    private availableFamilyIds: string[] = [];

    private bindOnSelectedLayersChanged: (layerIds: string[]) => void;

    constructor(groups: ToolGroupDefinition[] = BUILTIN_TOOL_GROUPS) {
        super();

        this.registry = new ToolRegistry(groups);

        this.bindOnSelectedLayersChanged = this.onSelectedLayersChanged.bind(this);
    }

    public setEditorContext(editorFacade: EditorFacade): void {
        this.editorFacade = editorFacade;
    }

    public setActiveView(view: TilemapView | null): void {
        if (this.activeTilemapView) {
            this.activeTilemapView.session.off("onSelectedLayersChanged", this.bindOnSelectedLayersChanged);
        }

        this.detachCurrentToolFromView();

        this.activeTilemapView = view;

        if (view) {
            view.session.on("onSelectedLayersChanged", this.bindOnSelectedLayersChanged);
        }

        this.refreshToolContext();
    }

    public getCurrentToolId(): string | null {
        return this.currentToolId;
    }

    public getCurrentFamilyId(): string | null {
        return this.currentFamilyId;
    }

    public getCurrentLayerKind(): LayerKind {
        return this.currentLayerKind;
    }

    public getToolGroups(): ToolGroupDefinition[] {
        return this.registry.getGroups();
    }

    public getToolFamilies(): ToolFamilyDefinition[] {
        return this.registry.getFamilies();
    }

    public getAvailableFamilyIds(): string[] {
        return [...this.availableFamilyIds];
    }

    public canUseToolFamily(familyId: string): boolean {
        return this.availableFamilyIds.includes(familyId);
    }

    public startToolFamily(familyId: string): boolean {
        const concreteTool = this.registry.resolveToolForFamily(familyId, this.getAvailabilityContext());
        if (!concreteTool) return false;

        return this.startConcreteTool(concreteTool, familyId);
    }

    public startTool(toolId: string): boolean {
        return this.startToolFamily(toolId);
    }

    public startConcreteTool(tool: ResolvedToolDefinition, familyId: string = tool.familyId): boolean {
        if (!this.editorFacade) return false;

        if (this.currentToolId === tool.id && this.currentTool) {
            this.currentFamilyId = familyId;
            this.attachCurrentToolToActiveView();
            this.updateCurrentToolTarget();
            this.emit("onToolChanged", this.currentFamilyId, this.currentToolId);
            return true;
        }

        this.disposeCurrentTool(false);

        this.currentTool = new tool.constructor(this.editorFacade);
        this.currentToolId = tool.id;
        this.currentFamilyId = familyId;

        this.currentTool.onEnable();

        this.attachCurrentToolToActiveView();

        this.updateCurrentToolTarget();
        this.emit("onToolChanged", this.currentFamilyId, this.currentToolId);
        return true;
    }

    public clearTool(): void {
        this.disposeCurrentTool(true);
    }

    public stopTool(): void {
        if (this.currentTool) {
            this.detachCurrentToolFromView();
            this.currentTool.onDisable();
        }
    }

    public resumeTool(): void {
        if (this.currentTool) {
            this.currentTool.onEnable();
            if (this.activeTilemapView) {
                this.attachCurrentToolToActiveView();
                this.updateCurrentToolTarget();
            }
        }
    }

    public refreshToolContext(): void {
        this.currentTargetLayerRenderer = this.resolveTargetLayerRenderer();
        this.currentLayerKind = this.resolveLayerKind(this.currentTargetLayerRenderer);
        this.availableFamilyIds = this.registry.getAvailableFamilyIds(this.getAvailabilityContext());

        this.emit("onToolAvailabilityChanged", this.getAvailableFamilyIds());
        this.ensureCurrentToolMatchesContext();
        this.updateCurrentToolTarget();
    }

    private onSelectedLayersChanged(): void {
        this.refreshToolContext();
    }

    private resolveTargetLayerRenderer(): BaseLayerRenderer | null {
        if (!this.activeTilemapView) return null;

        const layerIds = this.activeTilemapView.session.layerState.selectedLayers;
        for (const id of layerIds) {
            const layerRenderer = this.activeTilemapView.renderer.findLayerRenderer(id);
            if (!layerRenderer || layerRenderer instanceof GroupLayerRenderer) continue;
            return layerRenderer;
        }

        return null;
    }

    private resolveLayerKind(renderer: BaseLayerRenderer | null): LayerKind {
        if (!renderer) return "none";
        if (renderer instanceof GroupLayerRenderer) return "group";
        if (renderer.layer instanceof TileLayer) return "tile";
        if (renderer.layer instanceof RuleLayer) return "rule";
        if (renderer.layer instanceof EntityLayer) return "entity";
        if (renderer.layer instanceof ImageLayer) return "image";
        return "none";
    }

    private getAvailabilityContext(): ToolAvailabilityContext {
        return {
            activeView: this.activeTilemapView,
            targetLayerRenderer: this.currentTargetLayerRenderer,
            layerKind: this.currentLayerKind,
        };
    }

    private ensureCurrentToolMatchesContext(): void {
        const context = this.getAvailabilityContext();

        if (this.currentFamilyId) {
            const resolvedTool = this.registry.resolveToolForFamily(this.currentFamilyId, context);
            if (resolvedTool) {
                if (resolvedTool.id !== this.currentToolId || !this.currentTool) {
                    this.startConcreteTool(resolvedTool, this.currentFamilyId);
                }
                return;
            }
        }

        const rememberedFamilyId = this.getRememberedFamilyIdForCurrentContext();
        const fallbackFamilyId = rememberedFamilyId ?? this.getFallbackFamilyIdForCurrentContext();
        if (!fallbackFamilyId) {
            this.clearTool();
            return;
        }

        const fallbackTool = this.registry.resolveToolForFamily(fallbackFamilyId, context);
        if (!fallbackTool) {
            this.clearTool();
            return;
        }

        this.startConcreteTool(fallbackTool, fallbackFamilyId);
    }

    private getRememberedFamilyIdForCurrentContext(): string | null {
        const rememberedFamilyId = this.editorFacade.currentWorkspace?.toolSessionManager?.getRememberedToolFamilyForLayerKind(this.currentLayerKind);
        if (!rememberedFamilyId) return null;

        return this.registry.resolveToolForFamily(rememberedFamilyId, this.getAvailabilityContext())
            ? rememberedFamilyId
            : null;
    }

    private getFallbackFamilyIdForCurrentContext(): string | null {
        const moveFamilyId = "tool.move";
        if (this.availableFamilyIds.includes(moveFamilyId)) return moveFamilyId;

        if (this.currentLayerKind === "image" || this.currentLayerKind === "none" || this.currentLayerKind === "group") {
            return this.availableFamilyIds[0] ?? null;
        }

        return this.availableFamilyIds[0] ?? null;
    }

    private updateCurrentToolTarget(): void {
        if (!this.currentTool) return;

        this.currentTool.setTargetLayerRenderer(this.currentTargetLayerRenderer);
    }

    private attachCurrentToolToActiveView(): void {
        if (!this.currentTool || !this.activeTilemapView) return;
        if (this.currentToolAttachedView === this.activeTilemapView) return;

        this.currentTool.attachView(this.activeTilemapView);
        this.currentToolAttachedView = this.activeTilemapView;
    }

    private detachCurrentToolFromView(): void {
        if (!this.currentTool || !this.currentToolAttachedView) return;

        this.currentTool.detach();
        this.currentToolAttachedView = null;
    }

    private disposeCurrentTool(emitChange: boolean): void {
        if (!this.currentTool) return;

        this.detachCurrentToolFromView();
        this.currentTool.onDisable();
        this.currentTool = null;
        this.currentToolId = null;
        this.currentFamilyId = null;

        if (emitChange) {
            this.emit("onToolChanged", null, null);
        }
    }
}
