import "dockview/dist/styles/dockview.css";

import { DockviewReact, DockviewReadyEvent, DockviewTheme, IDockviewPanelProps, ISplitviewPanelProps } from "dockview";
import { useCallback } from "react";

import { PanelComponents } from "@/view/components/panel/basePanel";
import { useResizeNestedDock } from "@/view/hooks/useResizeNestedDock/useResizeNestedDock";
import { useTilesetSelectorDockStore } from "@/view/stores/dock/tilesetSelectorDockStore";

const sidebar: DockviewTheme = {
    name: "tilesetSelector",
    className: "dockview-tilesetSelector",
}

export default function TilesetSelectorDock(props: IDockviewPanelProps | ISplitviewPanelProps) {
    const api = useTilesetSelectorDockStore((state) => state.api);

    const initDockViewApi = useTilesetSelectorDockStore((state) => state.initDockViewApi);

    useResizeNestedDock(api, props);

    const onReady = useCallback((event: DockviewReadyEvent) => {
        initDockViewApi(event.api);
    }, []);

    return (
        <div className="flex h-full w-full overflow-hidden">
            <DockviewReact onReady={onReady} theme={sidebar} components={PanelComponents} />
        </div>
    );
}
