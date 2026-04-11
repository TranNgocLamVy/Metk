import { Grid3x3, Pen, Plus, Trash2 } from "lucide-react";

import { AppCore } from "@/core/appcore";
import { TilesetService } from "@/shared/services/tilesetService";
import { useDialogStore } from "@/view/stores/dialogStore";
import { DialogZLevel } from "@/shared/types/dialog";

const ActionGroup: MenuDropDownGroupType = [
    {
        type: "option",
        name: "Create new Tileset",
        startIcon: <Plus className="stroke-1" />,
        onClick() {
            // TODO: Implement
        }
    },
    {
        type: "option",
        name: "Delete Tileset",
        startIcon: <Trash2/>,
        variant: "destructive",
        onClick() {
            // TODO: Implement
        }
    },
];

export const ATRuleListContextMenu: MenuItemType = {
    name: "Edit",
    className: "w-60",
    groups: [ActionGroup],
};
