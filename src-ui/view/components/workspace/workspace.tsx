import "@/assets/style/flexLayout/workspace.css";

import { Layout, Model } from "flexlayout-react";
import { useRef } from "react";

import { useRelativeFlexLayout } from "@/view/hooks/useRelativeFlexLayout";
import { useWorkspaceDockStore } from "@/view/stores/flexlayout/workspaceDockStore";

import { VStack } from "../custom/stack/stack";
import TilemapEditorTabs from "./tilemapEditor/tilemapEditorTabs";

export default function Workspace() {
	const layoutRef = useRef<Layout | null>(null);

    const { model, factory, onRenderTab } = useWorkspaceDockStore();

    useRelativeFlexLayout(layoutRef);

    const onModelChange = (model: Model, action: any) => {
        localStorage.setItem("workspaceLayout", JSON.stringify(model.toJson()));
    }

	return (
		<VStack className="workspace w-full h-full">
            <TilemapEditorTabs />
			<Layout ref={layoutRef} model={model} factory={factory} onRenderTab={onRenderTab} onModelChange={onModelChange} />
		</VStack>
	);
}
