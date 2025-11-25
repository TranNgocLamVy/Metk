import { Orientation, SplitviewApi, SplitviewReact, SplitviewReadyEvent } from "dockview";
import { useEffect, useRef, useState } from "react";

import EditorDock from "@/view/components/dock/editor/editorDock";
import SidebarDock from "@/view/components/dock/sidebar/sidebarDock";
import { Event } from "@tauri-apps/api/event";
import { getCurrentWindow, PhysicalSize } from "@tauri-apps/api/window";

export default function Workspace() {
    const workSpaceContainerRef = useRef<HTMLDivElement>(null);
    const [splitViewApi, setSplitViewApi] = useState<SplitviewApi | null>(null);

    useEffect(() => {
		if (!splitViewApi) return;

        const window = getCurrentWindow()

		const resize = (event: Event<PhysicalSize>) => {
			if (!workSpaceContainerRef.current) return;
			requestAnimationFrame(() => {
				splitViewApi.layout(event.payload.width, event.payload.height);
			});
		};
		const dispose = window.onResized(resize);
		return () => {
            dispose.then(fn => fn());
        }
	}, [splitViewApi]);

    const onReady = (event: SplitviewReadyEvent) => {
        setSplitViewApi(event.api);
        const sidebar = event.api.addPanel({ id: "sidebar", component: "sidebar"});
		event.api.addPanel({ id: "editor", component: "editor" });

        sidebar.api.setSize({ size: 600 });
    }

    return (
        <SplitviewReact components={workspaceSplitViewComponents} onReady={onReady} orientation={Orientation.HORIZONTAL} margin={8} className="px-2" />
    )

}

const workspaceSplitViewComponents = {
    sidebar: SidebarDock,
    editor: EditorDock
}