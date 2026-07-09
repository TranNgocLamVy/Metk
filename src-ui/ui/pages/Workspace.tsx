import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import * as WorkspaceActions from "@/application/actions/workspace.actions";
import { Result } from "@/shared/types/result";
import LoadingOverlay from "@/ui/components/layout/LoadingOverlay";
import { useIsAppcoreLoaded } from "@/ui/stores/appcore.store";
import Workspace from "../workspace/Workspace";

export default function WorkspacePage() {
	const { projectId } = useParams();
	const navigate = useNavigate();

	const [isLoading, setIsLoading] = useState(true);

	const isAppcoreLoaded = useIsAppcoreLoaded();

	const loadProject = useCallback(async (id: string) => {
		try {
			const result = await WorkspaceActions.loadProjectWorkspace(id);
			if (result.status !== Result.Status.Success) navigate("/");
		} finally {
			setIsLoading(false);
		}
	}, [])

	useEffect(() => {
		if (!isAppcoreLoaded) return;
		loadProject(projectId!);
		return () => {
			WorkspaceActions.unloadProjectWorkspace();
		}
	}, [projectId, isAppcoreLoaded]);

	return (
		<div className="w-full h-full relative">
			<LoadingOverlay isLoading={isLoading} />
			<Workspace />
		</div>
	);
}
