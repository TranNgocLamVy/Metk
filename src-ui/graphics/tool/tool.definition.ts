import { IToolContructor } from "@/editor/interface/tool.interface";
import { BaseLayerRenderer } from "@/graphics/renderer/tilemap/base-layer.renderer";
import { TilemapView } from "@/graphics/view/tilemap.view";
import { LayerKind } from "@/shared/data-types/layer.data";

export type ToolGroupId =
    | "navigation"
    | "tile-editing"
    | "rule-editing"
    | "entity-editing"
    | "image-editing";

export type ToolAvailabilityContext = {
    activeView: TilemapView | null;
    targetLayerRenderer: BaseLayerRenderer | null;
    layerKind: LayerKind;
};

export type ToolDefinition = {
    id: string;
    constructor: IToolContructor;
    canUse: (ctx: ToolAvailabilityContext) => boolean;
    priority?: number;
};

export type ToolFamilyDefinition = {
    id: string;
    label: string;
    description?: string;
    icon?: string;
    shortcuts?: string[];
    priority?: number;
    tools: ToolDefinition[];
};

export type ToolGroupDefinition = {
    id: ToolGroupId;
    label: string;
    description?: string;
    priority?: number;
    families: ToolFamilyDefinition[];
};

export type ResolvedToolDefinition = ToolDefinition & {
    familyId: string;
    groupId: ToolGroupId;
};

