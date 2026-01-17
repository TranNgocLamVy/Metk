import { Grid3x3 } from "lucide-react";

import { useTilesetSessionStore } from "@/view/stores/application/tilesetSessionStore";

const Group1: MenuDropDownGroupType = [
    {
        type: "check",
        name: "Show Grid",
        startIcon: <Grid3x3 className="stroke-1" />,
        checked() {
            const session = useTilesetSessionStore.getState().currentSession;
            if (!session) return false;
            return session.grid.gridEnabled
        },
        toggle() {
            const session = useTilesetSessionStore.getState().currentSession;
            if (!session) return;
            session.toggleGrid();
        },
    }
];

export const TilesetViewContextMenu: MenuItemType = {
    name: "Edit",
    className: "w-60",
    groups: [Group1],
};
