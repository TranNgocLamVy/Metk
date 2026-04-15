import { BaseLayer, IGroupLayer } from "@/core/application/tile/layer/baseLayer";
import { GroupLayer } from "@/core/application/tile/layer/groupLayer";
import { RootLayer } from "@/core/application/tile/layer/rootLayer";
import { TileLayer } from "@/core/application/tile/layer/tileLayer";
import { Tilemap } from "@/core/application/tile/tilemap";

import { BaseLayerRenderer } from "./baseLayerRenderer";
import { TileLayerRenderer } from "./tileLayerRenderer";
import { RuleLayer } from "../tile/layer/ruleLayer";
import { RuleLayerRenderer } from "./ruleLayerRenderer";

type GroupLike = GroupLayer | RootLayer;

type CreateGroupRendererContext = {
    layer: GroupLike;
    tilemap: Tilemap;
    gap: number;
}

export class GroupLayerRenderer extends BaseLayerRenderer<GroupLike> {
    private childRenderers: Map<string, BaseLayerRenderer> = new Map();

    private bindOnLayerAdded: (layerId: string) => void
    private bindOnLayerRemoved: (layerId: string) => void
    private bindOnLayerReordered: () => void

    constructor(context: CreateGroupRendererContext) {
        super(context.layer, context.tilemap);
        this.gap = context.gap;

        this.rebuildChildren();

        this.bindOnLayerAdded = this.onLayerAdded.bind(this);
        this.bindOnLayerRemoved = this.onLayerRemoved.bind(this);
        this.bindOnLayerReordered = this.reorderChildren.bind(this);

        this.layer.eventEmitter.on("layerAdded", this.bindOnLayerAdded);
        this.layer.eventEmitter.on("layerRemoved", this.bindOnLayerRemoved);
        this.layer.eventEmitter.on("layerReordered", this.bindOnLayerReordered);
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
        } else if (childLayer instanceof RuleLayer) {
            renderer = new RuleLayerRenderer({ layer: childLayer, tilemap: this.tilemap, gap: this.gap });
        } else if (childLayer instanceof GroupLayer) {
            renderer = new GroupLayerRenderer({ layer: childLayer, tilemap: this.tilemap, gap: this.gap });
        }

        if (renderer) {
            this.childRenderers.set(childLayer.id, renderer);
            this.container.addChild(renderer.container);
        }

        return renderer;
    }

    private onLayerAdded(layerId: string) {
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
        let currentIndex = layers.length - 1;

        layers.forEach((l) => {
            const renderer = this.childRenderers.get(l.id);
            if (renderer) {
                this.container.setChildIndex(renderer.container, currentIndex);
                currentIndex--;
            }
        });
    }

    public override setGap(gap: number): void {
        super.setGap(gap)
        this.childRenderers.forEach(r => r.setGap(gap));
    }

    public override destroy(): void {
        this.layer.eventEmitter.off("layerAdded", this.bindOnLayerAdded);
        this.layer.eventEmitter.off("layerRemoved", this.bindOnLayerRemoved);
        this.layer.eventEmitter.off("layerReordered", this.bindOnLayerReordered);

        this.childRenderers.forEach(r => r.destroy());
        this.childRenderers.clear();

        super.destroy();
    }
}