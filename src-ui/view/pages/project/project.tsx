import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";

import { AppCore } from "@/core/appcore";
import { ProjectService } from "@/shared/services/projectService";
import Workspace from "@/view/components/workspace/workspace";
import { useAppcore } from "@/view/stores/appCoreStore";
import { useProjectManagerStore } from "@/view/stores/application/projectManagerStore";

export default function Project() {
	const { id } = useParams();
	const navigate = useNavigate();
    
	const { isAppcoreLoaded } = useAppcore();
    const { currentProject } = useProjectManagerStore();
    
    if (!id) {
        navigate("/")
        return null;
    }
    
	useEffect(() => {
		const ensureCurrentProject = async () => {
			if (!currentProject || currentProject.metaData.id !== id) {
				const result = await ProjectService.loadProject(id);
				if (result.status !== "Success") {
					navigate("/");
				}
			}
		};
		if (isAppcoreLoaded) ensureCurrentProject();
	}, [id, isAppcoreLoaded]);

	return <Workspace />;
}
