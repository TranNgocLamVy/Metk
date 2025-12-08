import { FolderPlus, SquareArrowOutUpRight } from "lucide-react";

import { AppCore } from "@/core/appcore";
import { ProjectService } from "@/shared/services/projectService";
import { HStack, VStack } from "@/view/components/custom/stack/stack";
import { Button } from "@/view/components/shadcn/button";
import { Separator } from "@/view/components/shadcn/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/view/components/shadcn/tooltip";
import { useProjectManagerStore } from "@/view/stores/application/projectManagerStore";

export default function HomePage() {
	const projects = useProjectManagerStore((s) => s.projects).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

	return (
		<VStack align="start" justify="start" className="w-full h-full p-16 gap-8">
			<h1 className="text-3xl font-bold">Welcome to MEtk</h1>
			<Separator />
			<HStack className="w-full h-fit gap-8">
				<Button variant={"outline"} onClick={ProjectService.openProject}>
					<SquareArrowOutUpRight />
					Open Project
				</Button>
				<Button variant={"outline"} onClick={ProjectService.createProject}>
					<FolderPlus />
					New Project
				</Button>
			</HStack>
			<VStack className="">
				<h2 className="mt-8">Recents Projects</h2>
				<Separator />
			</VStack>
			<VStack className="gap-4">
				{projects.map((project) => {
					return (
						<HStack align="center" justify="start" key={project.id} className="gap-4">
							<Tooltip>
								<TooltipTrigger asChild>
                                    <Button onClick={() => ProjectService.loadProject(project.id)}>
                                        <SquareArrowOutUpRight size={20} />
										{project.name}
                                    </Button>
								</TooltipTrigger>
                                <TooltipContent side="left">
                                    {project.description ? <p>{`Description: ${project.description}`}</p> : null}
                                    <p>{`Version: ${project.version}`}</p>
                                    <p>{`Created At: ${new Date(project.createdAt).toLocaleString()}`}</p>
                                    <p>{`Updated At: ${new Date(project.updatedAt).toLocaleString()}`}</p>
                                </TooltipContent>
							</Tooltip>
							<h3 className={`text-xs cursor-default ${!project.found ? "line-through" : ""}`}>{project.directory}</h3>
						</HStack>
					);
				})}
			</VStack>
		</VStack>
	);
}
