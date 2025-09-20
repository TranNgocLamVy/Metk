import { useTabStore } from "@/stores/tab/TabStore";

export default function TabComponentContainer() {
	const { currentTab } = useTabStore();
	const TabComponent = currentTab?.component;
	return <div className="h-full w-full flex items-center justify-center bg-foreground/20 overflow-hidden">{currentTab && TabComponent ? <TabComponent /> : <NoTabOpen />}</div>;
}

function NoTabOpen() {
	return (
		<p>No tab open</p>
	);
}
