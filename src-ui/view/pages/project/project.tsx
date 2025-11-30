import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";

import { Appcore } from "@/core/appcore";
import { HStack, VStack } from "@/view/components/custom/stack/stack";
import Workspace from "@/view/components/workspace/workspace";
import { useAppcore } from "@/view/stores/appCoreStore";
import { useProjectStore } from "@/view/stores/project/projectStore";

export default function Project() {
	const { id } = useParams();
	const navigate = useNavigate();

	const { isLoading } = useAppcore();
	const { currentProject, tilemaps, tilesets } = useProjectStore();

	useEffect(() => {
		const ensureCurrentProject = async () => {
			if (!id) {
				navigate("/");
				return;
			}
			if (!currentProject || currentProject.id !== id) {
				const result = await Appcore.getInstance().projectManager.setCurrentProject(id);
				if (result.status !== "Success") {
					navigate("/");
				}
			}
		};
		if (!isLoading) ensureCurrentProject();
	}, [id, isLoading]);

	return <Workspace />;
}
