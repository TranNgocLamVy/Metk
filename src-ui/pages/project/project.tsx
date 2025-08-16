import { useEffect } from "react";
import { useParams } from "react-router";

import { VStack } from "@/components/custom/Stack/Stack";
import { useProjectStore } from "@/stores/ui/ProjectStore";

export default function Project() {
    const { id } = useParams();

    const currentProject = useProjectStore((s) => s.currentProject);
    const setCurrentProject = useProjectStore((s) => s.setCurrentProject);

    useEffect(() => {
        if (id) {
            setCurrentProject(id);
        }
    }, [id])

    return (
        <VStack align="start" justify="start" className="w-full h-full p-16">
            {currentProject ? <h1>{currentProject.name}</h1> : null}
        </VStack>
    )
}