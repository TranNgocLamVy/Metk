import { X } from "lucide-react";
import { useRef, useState } from "react";

import { useTabStore } from "@/stores/tab/TabStore";

export function TabNavigation() {
	const { tabOrders, tabs, currentTabId, reorderTabs, changeCurrentTab, closeTab, openTab } = useTabStore((s) => s);
	const dragItemIndex = useRef<number | null>(null);
	const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
	const [dropPosition, setDropPosition] = useState<"left" | "right" | null>(null);
	return (
		<div className="flex flex-row">
			{tabOrders.map((tabId, index) => {
                const tab = tabs.find((t) => t.getId() === tabId);
                if (!tab) return null;
				const isActive = currentTabId === tab.getId();
				const showLeft = dragOverIndex === index && dropPosition === "left";
				const showRight = dragOverIndex === index && dropPosition === "right";

				return (
					<div
						key={tabId}
						draggable
						onDragStart={() => {
							dragItemIndex.current = index;
						}}
						onDragOver={(e) => {
							e.preventDefault();
							const rect = (e.target as HTMLElement).getBoundingClientRect();
							const x = e.clientX - rect.left;
							const side = x < rect.width / 2 ? "left" : "right";
							setDragOverIndex(index);
							setDropPosition(side);
						}}
						onDragLeave={() => {
							setDragOverIndex(null);
							setDropPosition(null);
						}}
						onDrop={() => {
							if (dragItemIndex.current === null) return;
							let targetIndex = index;
							if (dropPosition === "right") {
								targetIndex = index + 1;
							}
							reorderTabs({
                                fromIndex: dragItemIndex.current,
                                toIndex: targetIndex
                            });
							dragItemIndex.current = null;
							setDragOverIndex(null);
							setDropPosition(null);
						}}
						className={`flex flex-row gap-2 py-1 px-2 border-b-2 text-sm ${isActive ? "bg-foreground/30" : "bg-foreground/20 border-transparent"} relative`}>
						{showLeft && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500"></div>}
						{showRight && <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-blue-500"></div>}

						<button onClick={() => changeCurrentTab({tabId: tab.getId()})}>{tab.getTitle()}</button>
						<button onClick={() => closeTab({tabId: tab.getId()})}>
							<X size={14} />
						</button>
					</div>
				);
			})}
		</div>
	);
}