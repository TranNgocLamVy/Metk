import "dockview/dist/styles/dockview.css";

import { DockviewReact, DockviewReadyEvent, themeAbyss } from "dockview";
import { useCallback } from "react";

import { editorComponents, editorTabComponents, useEditorDockStore } from "@/stores/dock/editorDockStore";

export default function TestDock() {
	const initDockViewApi = useEditorDockStore((state) => state.initDockViewApi);
	const onReady = useCallback((event: DockviewReadyEvent) => {
		initDockViewApi(event.api);
	}, []);
	return (
		<div className="flex h-full w-full overflow-hidden">
			<DockviewReact onReady={onReady} theme={themeAbyss} components={editorComponents} tabComponents={editorTabComponents} defaultTabComponent={editorTabComponents.default} />
		</div>
	);
}
