import { Grid3x3, Pen, Plus, Trash2 } from "lucide-react";

import { AppCore } from "@/core/appcore";
import { TilesetService } from "@/shared/services/tilesetService";
import { useDialogStore } from "@/view/stores/dialogStore";
import { DialogZLevel } from "@/shared/types/dialog";

const Group1: MenuDropDownGroupType = [
    {
        type: "option",
        label: "workspace.tilesetSelector.contextMenu.new",
        startIcon: <Plus className="stroke-1" />,
        onClick() {
            TilesetService.createTileset();
        }
    },
    {
        type: "option",
        label: "workspace.tilesetSelector.contextMenu.edit",
        startIcon: <Pen className="stroke-1" />,
        disabled() {
            return true;
        },
        onClick() {
            useDialogStore.getState().openDialog("EDIT_TILESET_MODAL", { zLevel: DialogZLevel.Modal });
        }
    },
];

const Group2: MenuDropDownGroupType = [
    {
        type: "check",
        label: "workspace.tilesetSelector.contextMenu.showGrid",
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
        label: "workspace.tilesetSelector.contextMenu.delete",
        startIcon: <Trash2/>,
        variant: "destructive",
        disabled() {
            return true;
        },
        onClick() {
            // TODO: Implement
        }
    },
];

export const TilesetViewContextMenu: MenuItemType = {
    label: "Edit",
    className: "w-60",
    groups: [Group1, Group2, Group3],
};
