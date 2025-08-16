import { FolderPlus, SquareArrowOutUpRight } from "lucide-react";
import { NavLink } from "react-router-dom";

import { Appcore } from "@/appcore";
import { HStack, VStack } from "@/components/custom/Stack/Stack";
import { Button } from "@/components/shadcn/button";
import { Separator } from "@/components/shadcn/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/shadcn/tooltip";
import { useProjectStore } from "@/stores/ui/ProjectStore";

export default function HomePage() {
	const projects = useProjectStore((s) => s.projects);

	const createProject = () => {
        Appcore.getInstance().projectManager.createProject();
	};

    const openProject = () => {

    }

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
								<TooltipTrigger asChild>
									<NavLink key={project.id} to={`/project/${project.id}`} className="flex flex-row items-center gap-2 w-40 justify-start cursor-pointer">
										<SquareArrowOutUpRight size={20} />
										{project.name}
									</NavLink>
								</TooltipTrigger>
                                <TooltipContent side="left">
                                    {project.description ? <p>{`Description: ${project.description}`}</p> : null}
                                    <p>{`Version: ${project.version}`}</p>
                                    <p>{`Created At: ${new Date(project.createdAt).toLocaleString()}`}</p>
                                    <p>{`Updated At: ${new Date(project.updatedAt).toLocaleString()}`}</p>
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
