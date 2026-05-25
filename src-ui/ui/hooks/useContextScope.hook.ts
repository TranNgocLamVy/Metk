import { appKernel } from "@/application/bootstrap/app-kernel";
import { useEffect, useId } from "react";

export function useContextScope(flag: string, isActive: boolean = true) {
    const instigatorId = useId();

    useEffect(() => {
        if (!flag) return;
        appKernel.activationContext.setFlag(flag, isActive, instigatorId);

        return () => {
            appKernel.activationContext.setFlag(flag, false, instigatorId);
        };
    }, [flag, isActive, instigatorId]);
}