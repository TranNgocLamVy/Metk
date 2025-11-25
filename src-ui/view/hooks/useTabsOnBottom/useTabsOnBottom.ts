import { useLayoutEffect } from "react";

import type { DockviewApi } from "dockview";

export function useTabsOnBottom(api: DockviewApi | null, container: HTMLElement | null) {
    useLayoutEffect(() => {
        if (!api || !container) return;

        const reorderAll = () => {
            const outerDock = container.querySelector<HTMLElement>(".dv-dockview");
            if (!outerDock) return;
            const tabs = container.querySelectorAll<HTMLElement>(".dv-tabs-and-actions-container");
            tabs.forEach((tab) => {
                const closestDock = tab.closest<HTMLElement>(".dv-dockview");
                if (!outerDock.isEqualNode(closestDock)) return;
                const parent = tab.parentElement;
                if (parent) {
                    parent.appendChild(tab);
                }
            })
        };

        reorderAll();

        const disposable = api.onDidLayoutChange(() => {
            requestAnimationFrame(reorderAll);
        });

        return () => disposable.dispose();
    }, [api, container]);
}

