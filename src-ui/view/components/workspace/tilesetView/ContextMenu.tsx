import { Grid3x3, Pen, Plus, Trash2 } from "lucide-react";

import { appCore } from "@/core/appcore";
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
            const activeTilesetView = appCore.editorContext.getActiveTilesetView();
            if (!activeTilesetView) return false;
            return activeTilesetView.gridEnabled;
        },
        toggle() {
            const activeTilesetView = appCore.editorContext.getActiveTilesetView();
            if (!activeTilesetView) return false;
            activeTilesetView.toggleGrid();
        },
    }
];

const Group3: MenuDropDownGroupType = [
    {
        type: "option",
        label: "workspace.tilesetSelector.contextMenu.delete",
        startIcon: <Trash2 />,
        variant: "destructive",
        disabled() {
            const editorContext = appCore.editorContext;
            const currentTilesetSession = editorContext.getActiveTilesetSession();
            if (!currentTilesetSession) return true;
            return false;
        },
        onClick() {
            const editorContext = appCore.editorContext;
            const currentTilesetSession = editorContext.getActiveTilesetSession();
            if (!currentTilesetSession) return;
            TilesetService.deleteTileset(currentTilesetSession.tileset.id); 
        }
    },
];

export const TilesetViewContextMenu: MenuItemType = {
    label: "Edit",
    className: "w-60",
    groups: [Group1, Group2, Group3],
};
