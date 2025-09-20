import { DockviewApi, DockviewDefaultTab, IDockviewPanelHeaderProps } from "dockview";
import { create } from "zustand";

import { BasePanel, PanelWrapper } from "@/components/panel/BasePanel";

export const editorComponents = {
    default: PanelWrapper,
} as const;

export const editorTabComponents = {
    default: (props: IDockviewPanelHeaderProps) => {
        return <DockviewDefaultTab {...props} />;
    }
}

type DockStoreState = {
    api: DockviewApi | null;
    panels: BasePanel[];
    currentPanelId: string | null;

    initDockViewApi: (api: DockviewApi) => void;
    openPanel: (newPanel: BasePanel) => void;
    closePanel: (id: string) => void;
    changeCurrentPanel: (id: string) => void;
};

export const useEditorDockStore = create<DockStoreState>((set, get) => {
    return {
        api: null,
        panels: [],
        currentPanelId: null,

        initDockViewApi: (api) => {
            set({ api: api });
        },  
        openPanel: (newPanel) => {
            const api = get().api;
            if (!api) return;
            const panels = get().panels;
            const exist = panels.find((dock) => dock.id === newPanel.id);
            if (exist) {
                get().changeCurrentPanel(exist.id);
            } else {
                api.addPanel({ id: newPanel.id, title: newPanel.title , component: "default", params: { dock: newPanel } });
                set({ panels: [...panels, newPanel] });
            }
        },
        closePanel: (id) => {
            const api = get().api;
            if (!api) return;
            const panel = api.getGroup(id);
            if (!panel) return;
            panel.api.close();
        },
        changeCurrentPanel: (id) => {
            const api = get().api;
            if (!api) return;
            api.getPanel(id)?.focus();
        }
    } 
})

