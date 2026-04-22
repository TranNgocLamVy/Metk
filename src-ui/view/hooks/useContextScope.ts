import { appCore } from "@/core/appcore";
import { useEffect, useId } from "react";

export function useContextScope(flag: string, isActive: boolean = true) {
    const instigatorId = useId();

    useEffect(() => {
        if (!flag) return;
        appCore.contextManager.setFlag(flag, isActive, instigatorId);

        return () => {
            appCore.contextManager.setFlag(flag, false, instigatorId);
        };
    }, [flag, isActive, instigatorId]);
}