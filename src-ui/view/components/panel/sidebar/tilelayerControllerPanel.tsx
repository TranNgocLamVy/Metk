import { IDockviewPanelProps } from "dockview";
import { FC } from "react";

import { DefaultTilemap } from "@/core/default/tile/defaultTilemap";
import { VStack } from "@/view/components/custom/stack/stack";

import { BasePanel } from "../basePanel";

type CreateTilelayerControllerPanel = {
    tilemap: DefaultTilemap;
};

export class TilelayerControllerPanel extends BasePanel {
    public id: string;
    private tilemap: DefaultTilemap;
    public title: string;
    public component: FC<IDockviewPanelProps>;

    constructor(options: CreateTilelayerControllerPanel) {
        super();
        this.tilemap = options.tilemap;
        this.id = this.tilemap.id;
        this.title = this.tilemap.getName();
        this.component = this.initComponent();
    }

    private initComponent(): React.FC<IDockviewPanelProps> {
        const self = this;
        return function Component(props: IDockviewPanelProps) {
            const layers = self.tilemap.tilelayers
            return (
                <VStack className="p-4 gap-2">
                    {layers.map((layer) => {
                        return (
                            <div key={layer.id} className="w-full py-2 px-4 bg-secondary-background rounded-md">
                                <span>{layer.getName()}</span>
                            </div>
                        )
                    })}
                </VStack>
            );
        };
    }

}
