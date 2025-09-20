import { useEffect } from "react";
import { useParams } from "react-router";

import { VStack } from "@/components/custom/stack/stack";
import { useProjectManagerStore } from "@/stores/project/projectManagerStore";
import { useProjectStore } from "@/stores/project/projectStore";

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