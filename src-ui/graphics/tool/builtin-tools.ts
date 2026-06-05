import { EntityDeleteTool } from "@/graphics/tool/entity/entity-delete.tool";
import { EntityPlaceTool } from "@/graphics/tool/entity/entity-place.tool";
import { ImageMoveTool } from "@/graphics/tool/image/image-move.tool";
import { RuleBucketTool } from "@/graphics/tool/rule/rule-bucket.tool";
import { RuleEraserTool } from "@/graphics/tool/rule/rule-eraser.tool";
import { RuleLineTool } from "@/graphics/tool/rule/rule-line.tool";
import { RuleRectangleTool } from "@/graphics/tool/rule/rule-rectangle.tool";
import { RuleStampTool } from "@/graphics/tool/rule/rule-stamp.tool";
import { TileBucketTool } from "@/graphics/tool/tile/tile-bucket.tool";
import { TileEraserTool } from "@/graphics/tool/tile/tile-eraser.tool";
import { TileLineTool } from "@/graphics/tool/tile/tile-line.tool";
import { TileRectangleTool } from "@/graphics/tool/tile/tile-rectangle.tool";
import { TileStampTool } from "@/graphics/tool/tile/tile-stamp.tool";
import { ToolAvailabilityContext, ToolGroupDefinition } from "@/graphics/tool/tool.definition";

import boxIcon from "@/assets/icons/box.svg?raw";
import bucketIcon from "@/assets/icons/bucket.svg?raw";
import eraserIcon from "@/assets/icons/eraser.svg?raw";
import moveIcon from "@/assets/icons/move.svg?raw";
import rectangleIcon from "@/assets/icons/rect.svg?raw";
import lineIcon from "@/assets/icons/ruler.svg?raw";
import stampIcon from "@/assets/icons/stamp.svg?raw";
import { LayerKind } from "@/shared/data-types/layer.data";

const canUseKinds = (...layerKinds: LayerKind[]) => {
    return (ctx: ToolAvailabilityContext) => !!ctx.activeView && layerKinds.includes(ctx.layerKind);
};

export const BUILTIN_TOOL_GROUPS: ToolGroupDefinition[] = [
    {
        id: "tile-editing",
        label: "workspace.tool.group.tileEditing.label",
        priority: 10,
        families: [
            {
                id: "tool.stamp",
                label: "workspace.tool.stamp.label",
                description: "workspace.tool.stamp.description",
                icon: stampIcon,
                shortcuts: ["S"],
                priority: 0,
                tools: [
                    {
                        id: "tool.tile.stamp",
                        constructor: TileStampTool,
                        canUse: canUseKinds("tile"),
                    },
                    {
                        id: "tool.rule.stamp",
                        constructor: RuleStampTool,
                        canUse: canUseKinds("rule"),
                    },
                ],
            },
            {
                id: "tool.line",
                label: "workspace.tool.line.label",
                description: "workspace.tool.line.description",
                icon: lineIcon,
                shortcuts: ["L"],
                priority: 1,
                tools: [
                    {
                        id: "tool.tile.line",
                        constructor: TileLineTool,
                        canUse: canUseKinds("tile"),
                    },
                    {
                        id: "tool.rule.line",
                        constructor: RuleLineTool,
                        canUse: canUseKinds("rule"),
                    },
                ],
            },
            {
                id: "tool.rectangle",
                label: "workspace.tool.rectangle.label",
                description: "workspace.tool.rectangle.description",
                icon: rectangleIcon,
                shortcuts: ["R"],
                priority: 2,
                tools: [
                    {
                        id: "tool.tile.rectangle",
                        constructor: TileRectangleTool,
                        canUse: canUseKinds("tile"),
                    },
                    {
                        id: "tool.rule.rectangle",
                        constructor: RuleRectangleTool,
                        canUse: canUseKinds("rule"),
                    },
                ],
            },
            {
                id: "tool.bucket",
                label: "workspace.tool.bucket.label",
                description: "workspace.tool.bucket.description",
                icon: bucketIcon,
                shortcuts: ["F"],
                priority: 3,
                tools: [
                    {
                        id: "tool.tile.bucket",
                        constructor: TileBucketTool,
                        canUse: canUseKinds("tile"),
                    },
                    {
                        id: "tool.rule.bucket",
                        constructor: RuleBucketTool,
                        canUse: canUseKinds("rule"),
                    },
                ],
            },
            {
                id: "tool.eraser",
                label: "workspace.tool.eraser.label",
                description: "workspace.tool.eraser.description",
                icon: eraserIcon,
                shortcuts: ["E"],
                priority: 10,
                tools: [
                    {
                        id: "tool.tile.eraser",
                        constructor: TileEraserTool,
                        canUse: canUseKinds("tile"),
                    },
                    {
                        id: "tool.rule.eraser",
                        constructor: RuleEraserTool,
                        canUse: canUseKinds("rule"),
                    },
                ],
            },
        ],
    },
    {
        id: "entity-editing",
        label: "workspace.tool.group.entityEditing.label",
        priority: 20,
        families: [
            {
                id: "tool.entity.place",
                label: "workspace.tool.entityPlace.label",
                description: "workspace.tool.entityPlace.description",
                icon: boxIcon,
                priority: 0,
                tools: [
                    {
                        id: "tool.entity.place.default",
                        constructor: EntityPlaceTool,
                        canUse: canUseKinds("entity"),
                    },
                ],
            },
            {
                id: "tool.entity.delete",
                label: "workspace.tool.entityDelete.label",
                description: "workspace.tool.entityDelete.description",
                icon: eraserIcon,
                priority: 10,
                tools: [
                    {
                        id: "tool.entity.delete.default",
                        constructor: EntityDeleteTool,
                        canUse: canUseKinds("entity"),
                    },
                ],
            },
        ],
    },
    {
        id: "image-editing",
        label: "workspace.tool.group.imageEditing.label",
        priority: 30,
        families: [
            {
                id: "tool.image.move",
                label: "workspace.tool.imageMove.label",
                description: "workspace.tool.imageMove.description",
                icon: moveIcon,
                priority: 0,
                tools: [
                    {
                        id: "tool.image.move.default",
                        constructor: ImageMoveTool,
                        canUse: canUseKinds("image"),
                    },
                ],
            },
        ],
    },
];

export const createBuiltinToolFamilyIdSetForLayerKinds = (layerKinds: readonly LayerKind[]): Set<string> => {
    const result = new Set<string>();

    for (const group of BUILTIN_TOOL_GROUPS) {
        for (const family of group.families) {
            const supportsAllLayerKinds = layerKinds.every((layerKind) => {
                const context: ToolAvailabilityContext = {
                    activeView: {} as ToolAvailabilityContext["activeView"],
                    targetLayerRenderer: null,
                    layerKind,
                };

                return family.tools.some((tool) => {
                    try {
                        return tool.canUse(context);
                    } catch {
                        return false;
                    }
                });
            });

            if (supportsAllLayerKinds) {
                result.add(family.id);
            }
        }
    }

    return result;
};