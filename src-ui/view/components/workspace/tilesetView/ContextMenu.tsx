import { Grid3x3, Pen, Plus, Trash2 } from "lucide-react";

import { AppCore } from "@/core/appcore";
import { TilesetService } from "@/shared/services/tilesetService";
import { useDialogStore } from "@/view/stores/dialogStore";
import { DialogZLevel } from "@/shared/types/dialog";

const Group1: MenuDropDownGroupType = [
    {
        type: "option",
        name: "Create new Tileset",
        startIcon: <Plus className="stroke-1" />,
        onClick() {
            TilesetService.createTileset();
        }
    },
    {
        type: "option",
        name: "Edit Tileset",
        startIcon: <Pen className="stroke-1" />,
        onClick() {
            useDialogStore.getState().openDialog("EDIT_TILESET_MODAL", { zLevel: DialogZLevel.Modal });
        }
    },
];

const Group2: MenuDropDownGroupType = [
    {
        type: "check",
        name: "Show Grid",
        startIcon: <Grid3x3 className="stroke-1" />,
        checked() {
            const session = AppCore.getIns().editorContext.getCurrentTilesetSession();
            if (!session) return false;
            return session.sessionView.gridEnabled;
        },
        toggle() {
            const session = AppCore.getIns().editorContext.getCurrentTilesetSession();
            if (!session) return;
            session.sessionView.toggleGrid();
        },
    }
];

const Group3: MenuDropDownGroupType = [
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

export const TilesetViewContextMenu: MenuItemType = {
    name: "Edit",
    className: "w-60",
    groups: [Group1, Group2, Group3],
};
