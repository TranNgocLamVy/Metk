import { FolderPlus, SquareArrowOutUpRight, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { ProjectService } from "@/shared/services/projectService";
import { HStack, VStack } from "@/ui/components/custom/stack/Stack";
import { Button } from "@/ui/components/shadcn/button";
import { useContextScope } from "../hooks/useContextScope";
import { LocalizedText } from "@/ui/components/custom/LocalizeText";
import { useProjectStore } from "../stores/projectStore";

export default function HomePage() {
	const navigate = useNavigate();

	const { projects } = useProjectStore();

	useContextScope("inHome", true);

	return (
		<VStack align="center" justify="center" className="w-full h-full bg-surface-base">
			<VStack className="w-10/12 h-9/12 gap-2">
				<h1 className="text-3xl text-foreground font-bold"><LocalizedText message="home.welcome" /></h1>
				<h2 className="text-base text-muted-foreground font-semibold" ><LocalizedText message="home.description" /></h2>

				<h2 className="mt-6 font-semibold text-foreground"><LocalizedText message="home.start" /></h2>
				<VStack align="start" className="w-40 h-fit">
					<Button variant={"link"} onClick={ProjectService.importProject}>
						<SquareArrowOutUpRight />
						<LocalizedText message="home.importProject" />
					</Button>

					<Button variant={"link"} onClick={ProjectService.createProject}>
						<FolderPlus />
						<LocalizedText message="home.newProject" />
					</Button>
				</VStack>
				<h2 className="mt-2 font-semibold text-foreground"><LocalizedText message="home.recentProjects" /></h2>
				<VStack className="w-full gap-2 py-1 overflow-y-auto">
					{projects.map((project) => (
							<HStack align="center" justify="start" key={project.id} className="gap-4 min-w-160 group">
								<Button variant={"link"} onClick={() => navigate(`/project/${project.id}`)}>
									{project.name}
								</Button>
								<h3 className="text-xs text-foreground cursor-default">{project.directory}</h3>
								<Button size={"icon-xs"} variant={"ghost"} onClick={() => ProjectService.removeProject(project.id)} className="ml-auto">
									<X className="text-foreground/50 hover:text-foreground hidden group-hover:block" />
								</Button>
							</HStack>
						)
					)}
				</VStack>
			</VStack>
		</VStack>
	);
}
