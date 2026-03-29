import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { WorkspaceService } from "@/shared/services/workspaceService";
import LoadingOverlay from "@/view/components/layout/loadingOverlay";
import Workspace from "@/view/components/workspace/workspace";
import { useAppcore } from "@/view/stores/appCoreStore";
import { Result } from "@/shared/types/result";

export default function Project() {
    const [isLoading, setIsLoading] = useState(true);

	const { id } = useParams();
	const navigate = useNavigate();
	const { isAppcoreLoaded } = useAppcore();

	if (!id) {
		navigate("/");
		return null;
	}

	useEffect(() => {
		const loadProject = async () => {
			const result = await WorkspaceService.loadProjectWorkspace(id);
			if (result.status !== Result.Status.Success) {
				navigate("/");
                return;
			}
            setIsLoading(false);
		};
		if (isAppcoreLoaded) loadProject();
	}, [id, isAppcoreLoaded]);

	return (
		<div className="w-full h-full relative">
            <LoadingOverlay isLoading={isLoading} />
			<Workspace />
		</div>
	);
}
