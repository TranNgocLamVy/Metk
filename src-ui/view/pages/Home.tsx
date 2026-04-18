import { FolderPlus, SquareArrowOutUpRight, X } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { ProjectService } from "@/shared/services/projectService";
import { HStack, VStack } from "@/view/components/custom/stack/Stack";
import { Button } from "@/view/components/shadcn/button";
import { useProjectManagerStore } from "@/view/stores/projectManagerStore";

export default function HomePage() {
	const navigate = useNavigate();
	const { getProjects, version } = useProjectManagerStore()

	const projects = useMemo(() => {
		return getProjects();
	}, [version])

	const { t: translate } = useTranslation(['common', 'home']);

	return (
		<VStack align="start" justify="start" className="w-full h-full px-32 py-32 gap-2 bg-surface">
			<h1 className="text-3xl text-foreground font-bold">{translate('home.welcome')}</h1>
			<h2 className="text-base text-muted-foreground font-semibold" >{translate('home.description')}</h2>

			<h2 className="mt-8 font-semibold text-foreground">{translate('home.start')}</h2>
			<VStack align="start" className="w-40 h-fit gap-4">
				<Button variant={"link"} onClick={ProjectService.importProject}>
					<SquareArrowOutUpRight />
					{translate('home.importProject')}
				</Button>
				<Button variant={"link"} onClick={ProjectService.createProject}>
					<FolderPlus />
					{translate('home.newProject')}
				</Button>
			</VStack>
			<h2 className="mt-8 font-semibold text-foreground">{translate('home.recentProjects')}</h2>
			<VStack className="gap-4">
				{projects.map((project) => {
					return (
						<HStack align="center" justify="start" key={project.id} className="gap-4 min-w-160 group">
							<Button variant={"link"} onClick={() => navigate(`/project/${project.id}`)}>
								<SquareArrowOutUpRight size={20} />
								{project.name}
							</Button>
							<h3 className="text-xs text-foreground cursor-default">{project.directory}</h3>
							<X size={20} className="text-foreground/50 hover:text-foreground ml-auto hidden group-hover:block" />
						</HStack>
					);
				})}
			</VStack>
		</VStack>
	);
}
