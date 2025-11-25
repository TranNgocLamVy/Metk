import "dockview/dist/styles/dockview.css";

import { DockviewReact, DockviewReadyEvent, DockviewTheme, IDockviewPanelProps, ISplitviewPanelProps } from "dockview";
import { useCallback } from "react";

import { PanelComponents } from "@/view/components/panel/basePanel";
import { useResizeNestedDock } from "@/view/hooks/useResizeNestedDock/useResizeNestedDock";
import { useEditorDockStore } from "@/view/stores/dock/editorDockStore";

import { editorTabComponents } from "./editorTab";

const tilemapDock: DockviewTheme = {
    name: "tilemapDock",
    className: "dockview-tilemap",
}

export default function EditorDock(props: IDockviewPanelProps | ISplitviewPanelProps) {
    const api = useEditorDockStore((state) => state.api);
	const initDockViewApi = useEditorDockStore((state) => state.initDockViewApi);

    useResizeNestedDock(api, props);
    
	const onReady = useCallback((event: DockviewReadyEvent) => {
		initDockViewApi(event.api);
	}, []);

	return (
		<div className="flex h-full w-full overflow-hidden">
			<DockviewReact onReady={onReady} theme={tilemapDock} components={PanelComponents} tabComponents={editorTabComponents} defaultTabComponent={editorTabComponents.default} />
		</div>
	);
}
