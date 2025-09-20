import { Ellipsis } from "lucide-react";

import { HStack, VStack } from "@/components/custom/Stack/Stack";
import { Button } from "@/components/shadcn/button";
import { useSidebarStore } from "@/stores/sidebar/SidebarStore";

export function SidebarContainer() {
	const { sidebars, currentSidebar } = useSidebarStore();
	const SideBarComponent = currentSidebar?.component;
	return (
		<VStack className="h-full w-100 bg-foreground/10 gap-4">
			<HStack className="w-full min-h-10 max-h-10">
				{sidebars.map((sidebar) => {
					const openSidebar = () => {
						useSidebarStore.getState().changeCurrentSidebar(sidebar);
					};
					return (
						<Button size={"icon"} variant={"ghost"} key={sidebar.id} onClick={openSidebar} className={`border-b-2 cursor-pointer ${currentSidebar?.id === sidebar.id ? "border-foreground" : "border-transparent"}`}>
							{sidebar.icon}
						</Button>
					);
				})}
			</HStack>
			{currentSidebar && SideBarComponent && (
				<VStack className="gap-4">
                    <HStack className="px-4">
                        <span className="font-semibold">{currentSidebar.name}</span>
                        <Ellipsis className="ml-auto" />
                    </HStack>
					<SideBarComponent />
				</VStack>
			)}
		</VStack>
	);
}
