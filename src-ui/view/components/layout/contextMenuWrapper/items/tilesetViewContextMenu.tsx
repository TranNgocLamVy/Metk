import { Grid3x3 } from "lucide-react";

import { AppCore } from "@/core/appcore";

const Group1: MenuDropDownGroupType = [
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

export const TilesetViewContextMenu: MenuItemType = {
    name: "Edit",
    className: "w-60",
    groups: [Group1],
};
