import { useEffect } from "react";

import { Appcore } from "@/appcore/core";
import { Project } from "@/appcore/models/project/Project";
import { ProjectData } from "@/appcore/schemas/projectSchema";
import { SidebarContainer } from "@/components/layout/SidebarContainer/SidebarContainer";
import { useProjectStore } from "@/stores/project/ProjectStore";

import TestDock from "./dock";

export default function TestPage() {
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
		<div className="w-full h-full flex flex-row">
			<SidebarContainer />
			<TestDock />
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
