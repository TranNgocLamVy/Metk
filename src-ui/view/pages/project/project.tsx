import { Fragment, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { ProjectService } from "@/shared/services/projectService";
import LoadingOverlay from "@/view/components/layout/loadingOverlay";
import Workspace from "@/view/components/workspace/workspace";
import { useAppcore } from "@/view/stores/appCoreStore";

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
			const result = await ProjectService.loadProject(id);
			if (result.status !== "Success") {
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
