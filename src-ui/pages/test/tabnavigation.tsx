import { X } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/shadcn/button";
import { useTabStore } from "@/stores/tab/TabStore";

export function TabNavigation() {
	const { tabOrders, tabs, currentTab, reorderTabs, changeCurrentTab, closeTab, openTab } = useTabStore((s) => s);
	const dragItemIndex = useRef<number | null>(null);
	const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
	const [dropPosition, setDropPosition] = useState<"left" | "right" | null>(null);
	return (
		<div className="flex flex-row min-h-9 bg-foreground/10">
			{tabOrders.map((tabId, index) => {
                const tab = tabs.find((t) => t.id === tabId);
                if (!tab) return null;
				const isActive = currentTab?.id === tab.id;
				const showLeft = dragOverIndex === index && dropPosition === "left";
				const showRight = dragOverIndex === index && dropPosition === "right";

				return (
					<Button
						key={tabId}
						draggable
						onDragStart={() => {
							dragItemIndex.current = index;
						}}
                        onClick={() => changeCurrentTab({tabId: tab.id})}
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
						className={`flex flex-row gap-2 py-1 px-2 border-b text-sm ${isActive ? "bg-foreground/20" : "bg-foreground/10 border-foreground/1o"} relative`}>
						{showLeft && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500"></div>}
						{showRight && <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-blue-500"></div>}
						{tab.name}
						<span onClick={() => closeTab({tabId: tab.id})}>
							<X size={14} />
						</span>
					</Button>
				);
			})}
		</div>
	);
}