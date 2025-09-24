import "dockview/dist/styles/dockview.css";

import { DockviewReact, DockviewReadyEvent, DockviewTheme, IDockviewPanelProps } from "dockview";
import { useCallback, useEffect } from "react";

import { PanelComponents } from "@/components/panel/basePanel";
import { useResizeNestedDock } from "@/hooks/useResizeNestedDock/useResizeNestedDock";
import { tilemapTabComponents, useTilemapDockStore } from "@/stores/dock/tilemapDockStore";

const tilemapDock: DockviewTheme = {
    name: "tilemapDock",
    className: "dockview-tilemap",
}

export default function TilemapDock(props: IDockviewPanelProps) {
    const api = useTilemapDockStore((state) => state.api);
	const initDockViewApi = useTilemapDockStore((state) => state.initDockViewApi);

    useResizeNestedDock(api, props);
    
	const onReady = useCallback((event: DockviewReadyEvent) => {
		initDockViewApi(event.api);
	}, []);

	return (
		<div className="flex h-full w-full overflow-hidden">
			<DockviewReact onReady={onReady} theme={tilemapDock} components={PanelComponents} tabComponents={tilemapTabComponents} defaultTabComponent={tilemapTabComponents.default} />
		</div>
	);
}
