import { useEffect, useState } from "react";

import { Project } from "@/appcore/models/project/Project";
import { ProjectData } from "@/appcore/schemas/projectSchema";
import { TilemapEditorTab } from "@/appcore/ui/tab/TilemapEditorTab";
import { HStack, VStack } from "@/components/custom/Stack/Stack";
import { Button } from "@/components/shadcn/button";
import { useTabStore } from "@/stores/tab/TabStore";

import { TabNavigation } from "./tabnavigation";

export default function TestPage() {
	const [currentProject, setCurrentProject] = useState<Project | null>(null);
	const { tabs, currentTabId } = useTabStore();

	useEffect(() => {
		const loadProject = async () => {
			const project = new Project({
				...projectData,
				directory: "C:\\Users\\Tran Ngoc Lam Vy\\Desktop\\Project\\AutoTile\\tilemaps\\tmx\\project.json",
			});
			await project.load();
			setCurrentProject(project);
		};
		loadProject();
	}, []);

	return (
		<HStack className="w-full h-full gap-2">
			<VStack className="h-full w-40 p-4">
				{currentProject &&
					currentProject.tilemapManager.getTilemaps().map((tilemap, index) => {
						return (
							<Button
								key={index}
								onClick={async () => {
									const tilemapEditorTab = await TilemapEditorTab.createTilemapTab({
										title: tilemap.getName(),
										tilemap,
									});
									useTabStore.getState().openTab({
										tab: tilemapEditorTab,
									});
								}}>
								{tilemap.getName()}
							</Button>
						);
					})}
			</VStack>
			<VStack className="h-full w-full">
				<TabNavigation />
				<div className="h-full w-full items-center justify-center border-2">
					{tabs.map((tab) => {
						const TabComponent = tab.component;
						const active = currentTabId === tab.getId();
						if (!active) return null;
						return (
							<section key={tab.getId()} className={active ? "block h-full w-full" : "hidden"}>
								<TabComponent />
							</section>
						);
					})}
					{!currentTabId && <p>No tab open</p>}
				</div>
			</VStack>
		</HStack>
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
