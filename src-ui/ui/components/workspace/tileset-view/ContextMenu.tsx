import { Grid3x3, Info, Pen, Plus, Trash2 } from "lucide-react";

import { appKernel } from "@/application/bootstrap/app-kernel";
import { TilesetService } from "@/shared/services/tileset.service";
import { useDialogStore } from "@/ui/stores/dialog.store";
import { DialogZLevel } from "@/shared/types/dialog";
import { usePropertyStore } from "@/ui/stores/property.store";

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
    {
        type: "option",
        label: "workspace.tilesetSelector.contextMenu.property",
        startIcon: <Info className="stroke-1" />,
        onClick() {
			const activeTilesetSession = appKernel.editorFacade.getActiveTilesetSession();
			if (!activeTilesetSession) return;
			usePropertyStore.getState().setObjectId(activeTilesetSession.tileset.objectId);
        }
    },
];

const Group2: MenuDropDownGroupType = [
    {
        type: "check",
        label: "workspace.tilesetSelector.contextMenu.showGrid",
        startIcon: <Grid3x3 className="stroke-1" />,
        checked() {
            const activeTilesetView = appKernel.editorFacade.getActiveTilesetView();
            if (!activeTilesetView) return false;
            return activeTilesetView.gridEnabled;
        },
        toggle() {
            const activeTilesetView = appKernel.editorFacade.getActiveTilesetView();
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
            const editorFacade = appKernel.editorFacade;
            const currentTilesetSession = editorFacade.getActiveTilesetSession();
            if (!currentTilesetSession) return true;
            return false;
        },
        onClick() {
            const editorFacade = appKernel.editorFacade;
            const currentTilesetSession = editorFacade.getActiveTilesetSession();
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
