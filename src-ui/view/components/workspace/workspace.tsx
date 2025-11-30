import { DockviewApi, DockviewReact, DockviewReadyEvent } from "dockview";
import { useEffect, useRef, useState } from "react";

import { Event } from "@tauri-apps/api/event";
import { getCurrentWindow, PhysicalSize } from "@tauri-apps/api/window";

import Editor from "./editor";
import Sidebar from "./sidebar";

export default function Workspace() {
    const workSpaceContainerRef = useRef<HTMLDivElement>(null);
    const [splitViewApi, setSplitViewApi] = useState<DockviewApi | null>(null);

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

    const onReady = (event: DockviewReadyEvent) => {
        setSplitViewApi(event.api);
        event.api.addPanel({ id: "sidebar", component: "sidebar" });
    }
    
    return (
        <DockviewReact components={components} onReady={onReady} />
    )

}

const components = {
  sidebar: Sidebar
}