import { create } from "zustand";

import { BaseTab } from "@/appcore/ui/tab/BaseTab";

type TabState = {
    tabs: BaseTab[];
    tabOrders: string[];
    currentTabId: string | null;

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
        currentTabId: null,

        openTab: (options) => {
            const { tab } = options;
            set((state) => {
                const tabId = tab.getId();
                const tabs = [...state.tabs, tab];
                const tabOrders = [...state.tabOrders, tabId];
                return { tabs, tabOrders, currentTabId: tabId };
            })
        },

        closeTab: (options) => set((state) => {
            const { tabId } = options;
            if (!state.tabOrders.includes(tabId)) return state;

            const orderIdx = state.tabOrders.indexOf(tabId);
            const newOrder = state.tabOrders.filter((tid) => tid !== tabId);

            const tabs = state.tabs.filter((t) => t.getId() !== tabId);

            let newCurrent = state.currentTabId;
            if (tabId === state.currentTabId) {
                const rightId = newOrder[orderIdx];
                const leftId = newOrder[orderIdx - 1];
                newCurrent = rightId ?? leftId ?? null;
            }

            return { tabs, tabsOrder: newOrder, currentId: newCurrent };
        }),

        changeCurrentTab: (options) => {
            const { tabId } = options;
            set((state) => {
                if (!state.tabOrders.includes(tabId)) return state;
                return { currentTabId: tabId };
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