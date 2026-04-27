import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { WorkspaceService } from "@/shared/services/workspaceService";
import LoadingOverlay from "@/view/components/layout/LoadingOverlay";
import Workspace from "@/view/components/workspace/Workspace";
import { useAppcore } from "@/view/stores/appCoreStore";
import { Result } from "@/shared/types/result";

export default function Project() {
	const { id } = useParams();
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
		loadProject(id!);
		return () => {
			WorkspaceService.unloadProjectWorkspace();
		}
	}, [id, isAppcoreLoaded]);

	return (
		<div className="w-full h-full relative">
			<LoadingOverlay isLoading={isLoading} />
			<Workspace />
		</div>
	);
}
