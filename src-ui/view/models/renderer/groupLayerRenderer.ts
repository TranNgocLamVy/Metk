import { BaseLayer, IGroupLayer } from "@/core/application/tile/layer/baseLayer";
import { GroupLayer } from "@/core/application/tile/layer/groupLayer";
import { RootLayer } from "@/core/application/tile/layer/rootLayer";
import { TileLayer } from "@/core/application/tile/layer/tileLayer";
import { Tilemap } from "@/core/application/tile/tilemap";

import { BaseLayerRenderer } from "./baseLayerRenderer";
import { TileLayerRenderer } from "./tileLayerRenderer";

type GroupLike = GroupLayer | RootLayer;

type CreateGroupRendererContext = {
    layer: GroupLike;
    tilemap: Tilemap;
    gap: number;
}

export class GroupLayerRenderer extends BaseLayerRenderer<GroupLike> {
    private childRenderers: Map<string, BaseLayerRenderer> = new Map();

    constructor(context: CreateGroupRendererContext) {
        super(context.layer, context.tilemap);
        this.gap = context.gap;

        this.rebuildChildren();

        (this.layer.eventEmitter as any).on("layerAdded", this.onLayerAdded);
        (this.layer.eventEmitter as any).on("layerRemoved", this.onLayerRemoved);
        (this.layer.eventEmitter as any).on("layerReordered", this.reorderChildren);
    }

    private rebuildChildren = () => {
        this.layer.getLayers().forEach(childLayer => {
            if (!this.childRenderers.has(childLayer.id)) {
                this.createChildRenderer(childLayer);
            }
        });
        this.reorderChildren();
    }

    private createChildRenderer(childLayer: BaseLayer<any>): BaseLayerRenderer | null {
        let renderer: BaseLayerRenderer | null = null;

        // Pass this.tilemap to children
        if (childLayer instanceof TileLayer) {
            renderer = new TileLayerRenderer({ layer: childLayer, tilemap: this.tilemap, gap: this.gap });
        } else if (childLayer instanceof GroupLayer) {
            renderer = new GroupLayerRenderer({ layer: childLayer, tilemap: this.tilemap, gap: this.gap });
        }

        if (renderer) {
            this.childRenderers.set(childLayer.id, renderer);
            this.container.addChild(renderer.container);
        }

        return renderer;
    }

    private onLayerAdded = (layerId: string) => {
        const childLayer = (this.layer as unknown as IGroupLayer).layers.find(l => l.id === layerId);
        if (childLayer) {
            this.createChildRenderer(childLayer);
            this.reorderChildren();
        }
    }

    private onLayerRemoved = (layerId: string) => {
        const renderer = this.childRenderers.get(layerId);
        if (renderer) {
            this.container.removeChild(renderer.container);
            renderer.destroy();
            this.childRenderers.delete(layerId);
        }
    }

    private reorderChildren = () => {
        const layers = this.layer.getLayers();
        let currentIndex = 0;

        layers.forEach((l) => {
            const renderer = this.childRenderers.get(l.id);
            if (renderer) {
                this.container.setChildIndex(renderer.container, currentIndex);
                currentIndex++;
            }
        });
    }

    public override setGap(gap: number): void {
        super.setGap(gap)
        this.childRenderers.forEach(r => r.setGap(gap));
    }

    public override destroy(): void {
        (this.layer.eventEmitter as any).off("layerAdded", this.onLayerAdded);
        (this.layer.eventEmitter as any).off("layerRemoved", this.onLayerRemoved);
        (this.layer.eventEmitter as any).off("layerReordered", this.reorderChildren);

        this.childRenderers.forEach(r => r.destroy());
        this.childRenderers.clear();

        super.destroy();
    }
}