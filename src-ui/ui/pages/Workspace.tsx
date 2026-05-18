import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { WorkspaceService } from "@/shared/services/workspace.service";
import LoadingOverlay from "@/ui/components/layout/LoadingOverlay";
import Workspace from "@/ui/components/workspace/Workspace";
import { useAppcore } from "@/ui/stores/appcore.store";
import { Result } from "@/shared/types/result";

export default function WorkspacePage() {
	const { projectId } = useParams();
	const navigate = useNavigate();

	const [isLoading, setIsLoading] = useState(true);

	const { isAppcoreLoaded } = useAppcore();

	const loadProject = useCallback(async (id: string) => {
		try {
			const result = await WorkspaceService.loadProjectWorkspace(id);
			if (result.status !== Result.Status.Success) navigate("/");
		} finally {
			setIsLoading(false);
		}
	}, [])

	useEffect(() => {
		if (!isAppcoreLoaded) return;
		loadProject(projectId!);
		return () => {
			WorkspaceService.unloadProjectWorkspace();
		}
	}, [projectId, isAppcoreLoaded]);

	return (
		<div className="w-full h-full relative">
			<LoadingOverlay isLoading={isLoading} />
			<Workspace />
		</div>
	);
}
