import { RulesetManagerEvent } from "@/editor/manager/rulesetManager";
import { useProjectStore } from "../stores/projectStore";
import { useEffect } from "react";



export function useRulesetManagerEvent<TEvent extends keyof RulesetManagerEvent>(eventName: TEvent, callback: RulesetManagerEvent[TEvent]) {
    const currentProject = useProjectStore((state) => state.activeProject);

    useEffect(() => {
        if (!currentProject) return;
        const rulesetManager = currentProject.rulesetManager;
        rulesetManager.on(eventName, callback as any);
        return () => {
            rulesetManager.off(eventName, callback as any);
        };
    }, [currentProject, eventName, callback])
}