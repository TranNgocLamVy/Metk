import { useEffect } from "react";

import { appCore } from "@/core/appcore";

import { useToolbarStore } from "../stores/toolbarStore";

// TODO: Refactor name and add other hooks
export function useUIHook() {
    const { refresh } = useToolbarStore();
    useEffect(() => {
        const toolManager = appCore.toolManager;

        toolManager.on("onToolChanged", refresh);

        return () => {
            toolManager.off("onToolChanged", refresh);
        }
    }, [])
}