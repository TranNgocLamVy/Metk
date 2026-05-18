import { appKernel } from "@/application/bootstrap/app-kernel";
import { useEffect, useId } from "react";

export function useContextScope(flag: string, isActive: boolean = true) {
    const instigatorId = useId();

    useEffect(() => {
        if (!flag) return;
        appKernel.contextManager.setFlag(flag, isActive, instigatorId);

        return () => {
            appKernel.contextManager.setFlag(flag, false, instigatorId);
        };
    }, [flag, isActive, instigatorId]);
}