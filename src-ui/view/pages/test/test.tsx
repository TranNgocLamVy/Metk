// import { useEffect } from "react";

// import { Appcore } from "@/core/appcore";
// import { Project } from "@/core/models/project";
// import { ProjectData } from "@/core/schema/projectSchema";
// import { HStack, VStack } from "@/view/components/custom/stack/stack";
// import Workspace from "@/view/components/layout/workspace/workspace";
// import { useProjectStore } from "@/view/stores/project/projectStore";

// export default function TestPage() {
// 	const { setCurrentProject } = useProjectStore();

// 	// useEffect(() => {
// 	// 	const loadProject = async () => {
// 	// 		const project = new Project({
// 	// 			...projectData,
// 	// 			directory: "C:\\Users\\Tran Ngoc Lam Vy\\Desktop\\Project\\MEtk\\tilemaps\\tmx\\project.json",
// 	// 		});
// 	// 		await project.load();
// 	// 	};
// 	// 	loadProject();
// 	// }, []);

// 	return (
// 		<HStack className="w-full h-full">
// 			<VStack className="w-full h-full">
// 				<Workspace />
// 				<div className="w-full h-10 bg-background border" />
// 			</VStack>
// 		</HStack>
// 	);
// }

// const projectData: ProjectData = {
// 	id: "test",
// 	name: "test",
// 	version: "0.1.0",
// 	description: "",
// 	createdAt: new Date().toDateString(),
// 	updatedAt: new Date().toDateString(),
// 	tilemapPaths: ["C:\\Users\\Tran Ngoc Lam Vy\\Desktop\\Project\\MEtk\\tilemaps\\map1.tmx"],
// 	tilesetPaths: ["C:\\Users\\Tran Ngoc Lam Vy\\Desktop\\Project\\MEtk\\tilemaps\\Grass.tsx", "C:\\Users\\Tran Ngoc Lam Vy\\Desktop\\Project\\MEtk\\tilemaps\\Wall.tsx", "C:\\Users\\Tran Ngoc Lam Vy\\Desktop\\Project\\MEtk\\tilemaps\\StoneGround.tsx", "C:\\Users\\Tran Ngoc Lam Vy\\Desktop\\Project\\MEtk\\tilemaps\\Props.tsx"],
// };
