import "@/assets/style/flexLayout/workspace.css";

import { Layout } from "flexlayout-react";
import { useRef } from "react";

import { useRelativeFlexLayout } from "@/view/hooks/useRelativeFlexLayout";
import { useWorkspaceDockStore } from "@/view/stores/flexlayout/workspaceDockStore";

import { VStack } from "../custom/stack/stack";

export default function Workspace() {
	const layoutRef = useRef<Layout | null>(null);

    const { model, factory, onRenderTab } = useWorkspaceDockStore();

    useRelativeFlexLayout(layoutRef);

	return (
		<VStack className="workspace w-full h-full">
			<Layout ref={layoutRef} model={model} factory={factory} onRenderTab={onRenderTab} />
		</VStack>
	);
}
