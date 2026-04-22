import { FolderPlus, SquareArrowOutUpRight, X } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { ProjectService } from "@/shared/services/projectService";
import { HStack, VStack } from "@/view/components/custom/stack/Stack";
import { Button } from "@/view/components/shadcn/button";
import { useProjectManagerStore } from "@/view/stores/projectManagerStore";
import { AppCore } from "@/core/appcore";

export default function HomePage() {
	const navigate = useNavigate();
	const { getProjects, version } = useProjectManagerStore()

	const projects = useMemo(() => {
		return getProjects();
	}, [version])

	useEffect(() => {
		AppCore.getIns().projectManager.unLoadProject();
		AppCore.getIns().workspaceManager.unloadWorkspace();
	}, [])

	const { t: translate } = useTranslation([]);

	return (
		<VStack align="center" justify="center" className="w-full h-full bg-surface-base">
			<VStack className="w-10/12 h-9/12 gap-2">
				<h1 className="text-3xl text-foreground font-bold">{translate('home.welcome')}</h1>
				<h2 className="text-base text-muted-foreground font-semibold" >{translate('home.description')}</h2>

				<h2 className="mt-6 font-semibold text-foreground">{translate('home.start')}</h2>
				<VStack align="start" className="w-40 h-fit">
					<Button variant={"link"} onClick={ProjectService.importProject}>
						<SquareArrowOutUpRight />
						{translate('home.importProject')}
					</Button>
					<Button variant={"link"} onClick={ProjectService.createProject}>
						<FolderPlus />
						{translate('home.newProject')}
					</Button>
				</VStack>
				<h2 className="mt-2 font-semibold text-foreground">{translate('home.recentProjects')}</h2>
				<VStack className="w-fit">
					{projects.map((project) => {
						return (
							<HStack align="center" justify="start" key={project.id} className="gap-4 min-w-160 group">
								<Button variant={"link"} onClick={() => navigate(`/project/${project.id}`)}>
									<SquareArrowOutUpRight size={20} />
									{project.name}
								</Button>
								<h3 className="text-xs text-foreground cursor-default">{project.directory}</h3>
								<Button size={"icon-xs"} variant={"ghost"} onClick={() => ProjectService.removeProject(project.id)}>
									<X size={20} className="text-foreground/50 hover:text-foreground ml-auto hidden group-hover:block" />
								</Button>
							</HStack>
						);
					})}
				</VStack>
			</VStack>
		</VStack>
	);
}
