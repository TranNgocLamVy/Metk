import { IDockviewPanelProps } from "dockview";
import { v4 as uuidv4 } from "uuid";

import { DefaultTilemap } from "@/core/default/tile/defaultTilemap";
import { DefaultTileset } from "@/core/default/tile/defaultTileset";
import { VStack } from "@/view/components/custom/stack/stack";
import { Button } from "@/view/components/shadcn/button";
import { useEditorDockStore } from "@/view/stores/dock/editorDockStore";
import { useProjectStore } from "@/view/stores/project/projectStore";

import { BasePanel } from "../basePanel";
import { TilemapEditorPanel } from "../editor/tilemapEditorPanel";

export type CreateExplorerSidebarDockOptions = {};

export class ExplorerPanel extends BasePanel {
	public id: string;
	public title: string;
	public component: React.FC<IDockviewPanelProps>;
	constructor(options: CreateExplorerSidebarDockOptions) {
		super();
		this.id = uuidv4();
		this.title = "Explorer";
		this.component = this.initComponent();
	}

	private initComponent(): React.FC<IDockviewPanelProps> {
		const self = this;
		return function Component(props: IDockviewPanelProps) {
			const tilemaps = useProjectStore((state) => state.tilemaps);
            const openPanel = useEditorDockStore((state) => state.openPanel);

            const openTilemap = (tilemap: DefaultTilemap) => {
                const panel = new TilemapEditorPanel({tilemap: tilemap})
                openPanel(panel);
            }

            const openTileset = (tileset: DefaultTileset) => {
                
            }

			return (
				<VStack className="gap-2 p-4">
					{tilemaps.map((tilemap) => {
						return <Button key={tilemap.id} onClick={() => openTilemap(tilemap)}>{tilemap.getName()}</Button>;
					})}
				</VStack>
			);
		};
	}
}
