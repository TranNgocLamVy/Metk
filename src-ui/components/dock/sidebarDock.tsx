import "dockview/dist/styles/dockview.css";

import { DockviewReact, DockviewReadyEvent, DockviewTheme, IDockviewPanelProps } from "dockview";
import { useCallback, useRef } from "react";

import { PanelComponents } from "@/components/panel/basePanel";
import { useResizeNestedDock } from "@/hooks/useResizeNestedDock/useResizeNestedDock";
import { useTabsOnBottom } from "@/hooks/useTabsOnBottom/useTabsOnBottom";
import { explorerTabComponents, useSidebarDockStore } from "@/stores/dock/sidebarDockStore";

const sidebar: DockviewTheme = {
    name: "sidebar",
    className: "dockview-sidebar",
}

export default function SidebarDock(props: IDockviewPanelProps) {
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
            <DockviewReact onReady={onReady} theme={sidebar} components={PanelComponents} tabComponents={explorerTabComponents} defaultTabComponent={explorerTabComponents.default} />
        </div>
    );
}
