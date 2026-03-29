import { FolderPlus, SquareArrowOutUpRight } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { ProjectService } from "@/shared/services/projectService";
import { HStack, VStack } from "@/view/components/custom/stack/stack";
import { Button } from "@/view/components/shadcn/button";
import { Separator } from "@/view/components/shadcn/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/view/components/shadcn/tooltip";
import { useProjectManagerStore } from "@/view/stores/application/projectManagerStore";

export default function HomePage() {
    const navigate = useNavigate();
    const { getProjects, version } = useProjectManagerStore()

    const projects = useMemo(() => {
        return getProjects();
    }, [version])

    const { t: translate } = useTranslation(['common', 'home']);

	return (
		<VStack align="start" justify="start" className="w-full h-full p-16 gap-8">
			<h1 className="text-3xl font-bold">{translate('home.welcome')}</h1>
			<Separator />
			<HStack className="w-full h-fit gap-8">
				<Button variant={"outline"} onClick={ProjectService.openNewProject}>
					<SquareArrowOutUpRight />
					{translate('home.openProject')}
				</Button>
				<Button variant={"outline"} onClick={ProjectService.createProject}>
					<FolderPlus />
					{translate('home.newProject')}
				</Button>
			</HStack>
			<VStack className="">
				<h2 className="mt-8">{translate('home.recentProjects')}</h2>
				<Separator />
			</VStack>
			<VStack className="gap-4">
				{projects.map((project) => {
					return (
						<HStack align="center" justify="start" key={project.id} className="gap-4">
							<Tooltip>
								<TooltipTrigger asChild>
                                    <Button onClick={() => navigate(`/project/${project.id}`)}>
                                        <SquareArrowOutUpRight size={20} />
										{project.name}
                                    </Button>
								</TooltipTrigger>
                                <TooltipContent side="left">
                                    {project.description ? <p>{`${translate('home.description')}: ${project.description}`}</p> : null}
                                    <p>{`${translate('home.version')}: ${project.version}`}</p>
                                    <p>{`${translate('home.createdAt')}: ${new Date(project.createdAt).toLocaleString()}`}</p>
                                    <p>{`${translate('home.updatedAt')}: ${new Date(project.updatedAt).toLocaleString()}`}</p>
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
