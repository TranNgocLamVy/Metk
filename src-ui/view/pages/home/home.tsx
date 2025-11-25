import { FolderPlus, SquareArrowOutUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Appcore } from "@/core/appcore";
import { HStack, VStack } from "@/view/components/custom/stack/stack";
import { Button } from "@/view/components/shadcn/button";
import { Separator } from "@/view/components/shadcn/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/view/components/shadcn/tooltip";
import { useProjectManagerStore } from "@/view/stores/project/projectManagerStore";

export default function HomePage() {
    const navigate = useNavigate();

	const projects = useProjectManagerStore((s) => s.projects);

	const createProject = () => {
        Appcore.getInstance().projectManager.createProject();
	};

    const setCurrentProject = async (id: string) => {
        const result = await Appcore.getInstance().projectManager.setCurrentProject(id);
        if (result.status == "Success") {
            navigate("/project/" + id);
        }
    }

    const openProject = () => {
        
    }

	return (
		<VStack align="start" justify="start" className="w-full h-full p-16 gap-8">
			<h1 className="text-3xl font-bold">Welcome to MEtk</h1>
			<Separator />
			<HStack className="w-full h-fit gap-8">
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
			<VStack className="gap-4">
				{projects.map((project) => {
					return (
						<HStack align="center" justify="start" key={project.metaData.id} className="gap-4">
							<Tooltip>
								<TooltipTrigger asChild>
                                    <Button onClick={() => setCurrentProject(project.metaData.id)}>
                                        <SquareArrowOutUpRight size={20} />
										{project.metaData.name}
                                    </Button>
								</TooltipTrigger>
                                <TooltipContent side="left">
                                    {project.metaData.description ? <p>{`Description: ${project.metaData.description}`}</p> : null}
                                    <p>{`Version: ${project.metaData.version}`}</p>
                                    <p>{`Created At: ${new Date(project.metaData.createdAt).toLocaleString()}`}</p>
                                    <p>{`Updated At: ${new Date(project.metaData.updatedAt).toLocaleString()}`}</p>
                                </TooltipContent>
							</Tooltip>
							<h3 className="text-xs cursor-default">{project.metaData.directory}</h3>
						</HStack>
					);
				})}
			</VStack>
		</VStack>
	);
}
