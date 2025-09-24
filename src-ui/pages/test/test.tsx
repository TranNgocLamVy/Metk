import { DockviewReact, DockviewReadyEvent } from "dockview";
import { useCallback, useEffect } from "react";

import { Appcore } from "@/appcore/core";
import { Project } from "@/appcore/models/project/project";
import { ProjectData } from "@/appcore/schemas/projectSchema";
import { editorComponents, useEditorDockStore } from "@/stores/dock/editorDockStore";
import { useProjectStore } from "@/stores/project/projectStore";

export default function TestPage() {
	const initDockViewApi = useEditorDockStore((state) => state.initDockViewApi);
	const onReady = useCallback((event: DockviewReadyEvent) => {
		initDockViewApi(event.api);
	}, []);
	const { setCurrentProject } = useProjectStore();

	useEffect(() => {
		const loadProject = async () => {
			const project = new Project({
				...projectData,
				directory: "C:\\Users\\Tran Ngoc Lam Vy\\Desktop\\Project\\AutoTile\\tilemaps\\tmx\\project.json",
			});
			await project.load();
			Appcore.getInstance().projectManager.addProject(project);
			setCurrentProject(project);
		};
		loadProject();
	}, []);

	return (
		<div className="w-full h-full flex flex-col">
			<DockviewReact onReady={onReady} components={editorComponents} hideBorders disableDnd />
			<div className="w-full h-10 bg-background border-t-1" />
		</div>
	);
}

const projectData: ProjectData = {
	id: "test",
	name: "test",
	version: "0.1.0",
	description: "",
	createdAt: new Date().toDateString(),
	updatedAt: new Date().toDateString(),
	tilemapPaths: ["C:\\Users\\Tran Ngoc Lam Vy\\Desktop\\Project\\AutoTile\\tilemaps\\tmx\\TmxTilemap.tmx", "C:\\Users\\Tran Ngoc Lam Vy\\Desktop\\Project\\AutoTile\\tilemaps\\tmx\\test.tmx"],
	tilesetPaths: ["C:\\Users\\Tran Ngoc Lam Vy\\Desktop\\Project\\AutoTile\\tilemaps\\tmx\\Dirt.tsx", "C:\\Users\\Tran Ngoc Lam Vy\\Desktop\\Project\\AutoTile\\tilemaps\\tmx\\Grass2.tsx"],
};
