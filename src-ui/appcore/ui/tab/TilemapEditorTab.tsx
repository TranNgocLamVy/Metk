import { useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

import { DefaultTilemap } from "@/appcore/default/tile/defaultTilemap";
import { Result } from "@/appcore/interface/common/result";
import { TilemapSession } from "@/appcore/models/session/TilemapSesstion";
import { VStack } from "@/components/custom/Stack/Stack";

import { BaseTab } from "./BaseTab";

type TilemapEditorTabProps = {
	name: string;
	tilemap: DefaultTilemap;
};

export class TilemapEditorTab extends BaseTab {
	public id: string;
	public component: React.FC;
	public name: string;
	private tilemap: DefaultTilemap;
	private tilemapSession: TilemapSession;

	constructor(props: TilemapEditorTabProps) {
		super();
		this.tilemap = props.tilemap;
		this.name = props.name;
		this.id = uuidv4();
	}

	public static async createTilemapTab(props: TilemapEditorTabProps): Promise<TilemapEditorTab> {
		const tilemapTab = new TilemapEditorTab(props);
		await tilemapTab.initTilemapSession();
		tilemapTab.component = tilemapTab.initComponent();
		return tilemapTab;
	}

	private async initTilemapSession(): Promise<void> {
		this.tilemapSession = await TilemapSession.createTilemapSession(this.tilemap);
	}

	private initComponent(): React.FC {
		const self = this;
		return function TilemapEditorTabComponent() {
			const containerRef = useRef<HTMLDivElement>(null);

			useEffect(() => {
				if (!self.tilemapSession || !containerRef.current) return;
				self.tilemapSession.setContainer(containerRef.current);

				return () => {
					self.tilemapSession.uninitalizeSession();
				};
			}, []);

			return <div ref={containerRef} className="w-full h-full" />;
		};
	}
	public async close(): Promise<Result> {
		return { status: "Success" };
	}
}
