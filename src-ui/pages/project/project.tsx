import { useEffect } from "react";
import { useParams } from "react-router";

import { VStack } from "@/components/custom/Stack/Stack";
import { useProjectManagerStore } from "@/stores/project/ProjectManagerStore";
import { useProjectStore } from "@/stores/project/ProjectStore";

export default function Project() {
    const { id } = useParams();

    const { currentProject, setCurrentProject } = useProjectStore();
    const { projects } = useProjectManagerStore();

    useEffect(() => {
        if (id) {
            const project = projects.find((p) => p.id === id);
            if (project) {
                setCurrentProject(project);
            }
        }
    }, [id])

    return (
        <VStack align="start" justify="start" className="w-full h-full p-16">
            {currentProject ? <h1>{currentProject.name}</h1> : null}
        </VStack>
    )
}