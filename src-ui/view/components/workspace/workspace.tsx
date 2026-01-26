import "@/assets/style/flexLayout/workspace.css";

import { Layout, Model } from "flexlayout-react";
import { useRef } from "react";

import { useRelativeFlexLayout } from "@/view/hooks/useRelativeFlexLayout";
import { useWorkspaceDockStore } from "@/view/stores/flexlayout/workspaceDockStore";

import { HStack, VStack } from "../custom/stack/stack";
import BrushBar from "./brushBar";
import ContextBar from "./contextBar";

export default function Workspace() {
	const layoutRef = useRef<Layout | null>(null);

	const { model, factory, onRenderTab } = useWorkspaceDockStore();

	useRelativeFlexLayout(layoutRef);

	const onModelChange = (model: Model, action: any) => {
		localStorage.setItem("workspaceLayout", JSON.stringify(model.toJson()));
	};

	return (
		<HStack className="w-full h-full bg-secondary-background">
			<VStack className="w-full h-full">
				<VStack className="workspace w-full h-full p-1 pt-2 pr-2 relative">
					<Layout ref={layoutRef} model={model} factory={factory} onRenderTab={onRenderTab} onModelChange={onModelChange} />
                    <div className="top-0 left-0 w-full h-full absolute pointer-events-none shadow-[inset_0px_0px_10px_5px_rgba(0,_0,_0,_0.1)]" />
				</VStack>
				<ContextBar />
			</VStack>
			<BrushBar />
		</HStack>
	);
}
