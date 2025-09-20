import { create } from "zustand";

import { BaseTab } from "@/appcore/ui/tab/BaseTab";

type TabState = {
    tabs: BaseTab[];
    tabOrders: string[];
    currentTab: BaseTab | null;

    openTab: (options: OpenTabOptions) => void;
    closeTab: (options: CloseTabOptions) => void;
    changeCurrentTab: (options: ChangeCurrentTabOptions) => void;
    reorderTabs: (options: ReorderTabsOptions) => void;
}

type OpenTabOptions = {
    tab: BaseTab;
}
type CloseTabOptions = {
    tabId: string;
}
type ChangeCurrentTabOptions = {
    tabId: string;
}
type ReorderTabsOptions = {
    fromIndex: number;
    toIndex: number;
}

export const useTabStore = create<TabState>((set, get) => {

    return {
        tabs: [],
        tabOrders: [],
        currentTab: null,
        openTab: (options) => {
            const { tab } = options;
            set((state) => {
                const tabId = tab.id;
                const tabs = [...state.tabs, tab];
                const tabOrders = [...state.tabOrders, tabId];
                return { tabs, tabOrders, currentTab: tab };
            })
        },

        closeTab: (options) => set((state) => {
            const { tabId } = options;
            if (!state.tabOrders.includes(tabId)) return state;

            const newOrder = state.tabOrders.filter((tid) => tid !== tabId);
            const tabs = state.tabs.filter((t) => t.id !== tabId);

            const index = state.tabOrders.indexOf(tabId);
            const newFocusIndex = index === 0 ? index : index - 1;

            if (state.currentTab?.id === tabId) {
                const newCurrentId = state.tabOrders[newFocusIndex];
                const newCurrent = state.tabs.find((t) => t.id === newCurrentId);
                return { tabs, tabsOrder: newOrder, currentTab: newCurrent };
            }
            return { tabs, tabsOrder: newOrder };
        }),

        changeCurrentTab: (options) => {
            const { tabId } = options;
            set((state) => {
                const tab = state.tabs.find((t) => t.id === tabId);
                if (!tab) return state;
                return { currentTab: tab };
            })
        },

        reorderTabs: (options) => {
            const { fromIndex, toIndex } = options;
            set((state) => {
                if (state.tabOrders.length <= 1) return state;
                if (fromIndex === toIndex) return state;

                const maxIndex = state.tabOrders.length - 1;
                const from = clamp(fromIndex, 0, maxIndex);
                const to = clamp(toIndex, 0, maxIndex);

                const order = [...state.tabOrders];
                const [movedId] = order.splice(from, 1);
                order.splice(to, 0, movedId);
                return { tabOrders: order };
            })
        }
    }
})

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}