import { Files } from "lucide-react";
import { ReactNode } from "react";
import { v4 as uuidv4 } from "uuid";

import { DefaultTilemap } from "@/appcore/default/tile/defaultTilemap";
import { Result } from "@/appcore/interface/common/result";
import { VStack } from "@/components/custom/Stack/Stack";
import { TilemapEditorPanel } from "@/components/panel/editor/TilemapEditorPanel";
import { Button } from "@/components/shadcn/button";
import { useEditorDockStore } from "@/stores/dock/EditorDockStore";
import { useProjectStore } from "@/stores/project/ProjectStore";

import { BaseSidebar } from "./BaseSidebar";

type ExplorerSidebarProps = {};

export class ExplorerSidebar extends BaseSidebar {
	id: string;
	name: string = "EXPLORER";
	icon?: ReactNode;
	description?: string;
	component: React.FC;

	constructor(props: ExplorerSidebarProps) {
		super();
		this.id = uuidv4();
		this.icon = <Files />;
		this.description = "View and edit your project files";
		this.component = this.initComponent();
	}

	private initComponent(): React.FC {
		const self = this;
		return function ExplorerSidebarComponent() {
			const { tilemaps, tilesets } = useProjectStore();
			const openTilemapEditorTab = async (tilemap: DefaultTilemap) => {
				const tilemapPanel = new TilemapEditorPanel({ tilemap: tilemap });
				useEditorDockStore.getState().openPanel(tilemapPanel);
			};
			return (
				<VStack className="p-2 gap-2">
                    <span>Tilemaps</span>
					<VStack className="h-full w-full gap-4">
						{tilemaps.map((tilemap, index) => {
							return (
								<Button key={index} onClick={() => openTilemapEditorTab(tilemap)}>
									{tilemap.getName()}
								</Button>
							);
						})}
					</VStack>
                    <span className="mt-8">Tilesets</span>
					<VStack className="h-full w-full gap-4">
						{tilesets.map((tileset, index) => {
							return (
								<Button key={index}>
									{tileset.getName()}
								</Button>
							);
						})}
					</VStack>
				</VStack>
			);
		};
	}

	public async close(): Promise<Result> {
		return { status: "Success" };
	}
}
