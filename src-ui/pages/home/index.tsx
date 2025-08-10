import { FolderPlus, SquareArrowOutUpRight } from "lucide-react";

import { ProjectManager } from "@/appcore/models/Project/ProjectManager";
import { HStack, VStack } from "@/components/custom/Stack/Stack";
import { Button } from "@/components/shadcn/button";
import { Separator } from "@/components/shadcn/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/shadcn/tooltip";
import { useProjectStore } from "@/stores/ui/ProjectStore";

export default function HomePage() {
	const projects = useProjectStore((s) => s.projects);

	const createProject = () => {
		ProjectManager.getInstance().createProject();
	};

	return (
		<VStack align="start" justify="start" className="w-full h-full p-16">
			<h1 className="text-3xl font-bold">Welcome to AutoTile</h1>
			<Separator />
			<HStack className="w-full h-fit">
				<Button variant={"outline"}>
					<SquareArrowOutUpRight />
					Open Project
				</Button>
				<Button variant={"outline"} onClick={createProject}>
					<FolderPlus />
					New Project
				</Button>
			</HStack>
			<VStack className="">
				<h2 className="mt-8">Recents Projects</h2>
				<Separator />
			</VStack>
			<VStack>
				{projects.map((project) => {
					return (
						<HStack align="center" justify="start" key={project.id}>
							<Tooltip>
								<TooltipTrigger>
									<Button key={project.id} variant={"ghost"} className="w-40 justify-start cursor-pointer">
										<SquareArrowOutUpRight />
										{project.name}
									</Button>
								</TooltipTrigger>
                                <TooltipContent side="left">
                                    {project.description ? <p>{`Description: ${project.description}`}</p> : null}
                                    <p>{`Version: ${project.version}`}</p>
                                    <p>{`Created At: ${project.createdAt.toDateString()}`}</p>
                                    <p>{`Updated At: ${project.updatedAt.toDateString()}`}</p>
                                </TooltipContent>
							</Tooltip>
							<h3 className="text-xs cursor-default">{project.directory}</h3>
						</HStack>
					);
				})}
			</VStack>
		</VStack>
	);
}
