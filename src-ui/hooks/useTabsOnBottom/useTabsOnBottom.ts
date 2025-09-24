import { useLayoutEffect } from "react";

import type { DockviewApi } from "dockview";

export function useTabsOnBottom(api: DockviewApi | null, container: HTMLElement | null) {
  useLayoutEffect(() => {
    if (!api || !container) return;

    const reorderAll = () => {
      const groups = container.querySelectorAll<HTMLElement>(".dv-groupview");
      groups.forEach((group) => {
        const tabs = group.querySelector<HTMLElement>(".dv-tabs-and-actions-container");
        const content =
          group.querySelector<HTMLElement>(".dv-content-container") ??
          group.querySelector<HTMLElement>(".dv-visible-panel-container");

        if (tabs && content && group.lastElementChild !== tabs) {
          group.appendChild(tabs);
        }
      });
    };

    reorderAll();

    const disposable = api.onDidLayoutChange(() => {
      requestAnimationFrame(reorderAll);
    });

    return () => disposable.dispose();
  }, [api, container]);
}
