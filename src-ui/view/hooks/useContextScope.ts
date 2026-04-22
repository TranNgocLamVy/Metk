import { appCore } from "@/core/appcore";
import { useEffect, useId } from "react";

export function useContextScope(flag: string, isActive: boolean = true) {
    const instigatorId = useId();

    useEffect(() => {
        if (!flag) return;
        appCore.keybindingManager.setFlag(flag, isActive, instigatorId);

        return () => {
            appCore.keybindingManager.setFlag(flag, false, instigatorId);
        };
    }, [flag, isActive, instigatorId]);
}