import { create } from "zustand";

import { BaseSidebar } from "@/appcore/ui/sidebar/BaseSidebar";
import { ExplorerSidebar } from "@/appcore/ui/sidebar/ExplorerSidebar";

type SidebarState = {
    sidebars: BaseSidebar[];
    currentSidebar: BaseSidebar | null;
    setSidebars: (sidebars: BaseSidebar[]) => void;
    openSidebar: (sidebar: BaseSidebar) => void;
    closeSidebar: (sidebar: BaseSidebar) => void;
    changeCurrentSidebar: (sidebar: BaseSidebar) => void;
    reorderSidebar: (fromIndex: number, toIndex: number) => void;
}

export const useSidebarStore = create<SidebarState>((set, get) => {
    const explorerSidebar = new ExplorerSidebar({});

    return {
        sidebars: [explorerSidebar],
        currentSidebar: explorerSidebar,

        setSidebars: (sidebars) => {
            set((state) => {
                return { sidebars };
            })
        },
        openSidebar: (sidebar) => {
            set((state) => {
                const sidebars = [...state.sidebars, sidebar];
                return { sidebars };
            })
        },
        closeSidebar: (sidebar) => {
            set((state) => {
                const sidebars = state.sidebars.filter((s) => s.id !== sidebar.id);
                return { sidebars };
            })
        },
        reorderSidebar: (fromIndex, toIndex) => {
            set((state) => {
                const sidebars = [...state.sidebars];
                const [moved] = sidebars.splice(fromIndex, 1);
                sidebars.splice(toIndex, 0, moved);
                return { sidebars };
            })
        },
        changeCurrentSidebar: (sidebar) => {
            set((state) => {
                return { currentSidebar: sidebar };
            })
        }
    }
})