import "dockview/dist/styles/dockview.css";

import { DockviewReact, DockviewReadyEvent, DockviewTheme, IDockviewPanelProps, ISplitviewPanelProps } from "dockview";
import { useCallback, useRef } from "react";

import { PanelWrapper } from "@/view/components/panel/basePanel";
import { useResizeNestedDock } from "@/view/hooks/useResizeNestedDock/useResizeNestedDock";
import { useTabsOnBottom } from "@/view/hooks/useTabsOnBottom/useTabsOnBottom";
import { useSidebarDockStore } from "@/view/stores/dock/sidebarDockStore";

import { explorerTabComponents } from "./sidebarTab";
import TilesetSelectorDock from "./tilesetSelector/tilesetSelectorDock";

const sidebar: DockviewTheme = {
    name: "sidebar",
    className: "dockview-sidebar",
    gap: 8,
}

const sidebarComponents = {
    default: PanelWrapper,
    tilesetSelector: TilesetSelectorDock,
}

export default function SidebarDock(props: IDockviewPanelProps | ISplitviewPanelProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const api = useSidebarDockStore((state) => state.api);

    const initDockViewApi = useSidebarDockStore((state) => state.initDockViewApi);

    useResizeNestedDock(api, props);

    useTabsOnBottom(api, containerRef.current);

    const onReady = useCallback((event: DockviewReadyEvent) => {
        initDockViewApi(event.api);
    }, []);

    return (
        <div ref={containerRef} className="flex h-full w-full overflow-hidden">
            <DockviewReact onReady={onReady} theme={sidebar} components={sidebarComponents} tabComponents={explorerTabComponents} defaultTabComponent={explorerTabComponents.default} />
        </div>
    );
}
