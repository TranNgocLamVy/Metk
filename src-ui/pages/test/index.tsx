import ContextMenuWrapper from "@/components/layout/ContextMenuWrapper/ContextMenuWrapper";
import { MainContextMenu } from "@/components/layout/ContextMenuWrapper/items/MainContextMenu";
import Canvas from "@/components/drawing/Canvas/Canvas";
import Test from "./test";

import { resolveResource } from "@tauri-apps/api/path";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { useEffect } from "react";

async function loadConfig(): Promise<any> {
	const resourcePath = await resolveResource("data/configs.json");

	const jsonStr = await readTextFile(resourcePath);
	const data = JSON.parse(jsonStr);
	return data;
}
export default function TestPage() {

    useEffect(() => {
        loadConfig();
    }, [])

	return (
		<ContextMenuWrapper item={MainContextMenu}>
			<Canvas className="w-full h-full">
				<Test />
			</Canvas>
		</ContextMenuWrapper>
	);
}
