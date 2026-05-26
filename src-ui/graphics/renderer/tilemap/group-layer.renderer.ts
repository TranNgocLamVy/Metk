import { BaseLayer, IGroupLayer } from "@/editor/model/tilemap/layer/base-layer";
import { GroupLayer } from "@/editor/model/tilemap/layer/group-layer";
import { RootLayer } from "@/editor/model/tilemap/layer/root-layer";
import { TileLayer } from "@/editor/model/tilemap/layer/tile-layer";
import { Tilemap } from "@/editor/model/tilemap/tilemap";

import { BaseLayerRenderer } from "./base-layer.renderer";
import { TileLayerRenderer } from "./tile-layer.renderer";
import { RuleLayer } from "@/editor/model/tilemap/layer/rule-layer";
import { RuleLayerRenderer } from "./rule-layer.renderer";

type GroupLike = GroupLayer | RootLayer;

type CreateGroupRendererContext = {
    layer: GroupLike;
    tilemap: Tilemap;
}

export class GroupLayerRenderer extends BaseLayerRenderer<GroupLike> {
    private childRenderers: Map<string, BaseLayerRenderer> = new Map();

    private bindOnLayerAdded: (layerId: string) => void
    private bindOnLayerRemoved: (layerId: string) => void
    private bindOnLayerReordered: () => void

    constructor(editorFacade: CreateGroupRendererContext) {
        super(editorFacade.layer, editorFacade.tilemap);

        this.rebuildChildren();

        this.bindOnLayerAdded = this.onLayerAdded.bind(this);
        this.bindOnLayerRemoved = this.onLayerRemoved.bind(this);
        this.bindOnLayerReordered = this.reorderChildren.bind(this);

        this.layer.eventEmitter.on("layerAdded", this.bindOnLayerAdded);
        this.layer.eventEmitter.on("layerRemoved", this.bindOnLayerRemoved);
        this.layer.eventEmitter.on("layerReordered", this.bindOnLayerReordered);
    }

    public findChildRenderer(layerId: string): BaseLayerRenderer | null {
        if (this.layer.id === layerId) return this;
        if (this.childRenderers.has(layerId)) return this.childRenderers.get(layerId)!;
        for (const childRenderer of this.childRenderers.values()) {
            if (childRenderer instanceof GroupLayerRenderer) {
                const found = childRenderer.findChildRenderer(layerId);
                if (found) return found;
            }
        }
        return null;
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
            renderer = new TileLayerRenderer({ layer: childLayer, tilemap: this.tilemap });
        } else if (childLayer instanceof RuleLayer) {
            renderer = new RuleLayerRenderer({ layer: childLayer, tilemap: this.tilemap });
        } else if (childLayer instanceof GroupLayer) {
            renderer = new GroupLayerRenderer({ layer: childLayer, tilemap: this.tilemap });
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
    
    public override destroy(): void {
        this.layer.eventEmitter.off("layerAdded", this.bindOnLayerAdded);
        this.layer.eventEmitter.off("layerRemoved", this.bindOnLayerRemoved);
        this.layer.eventEmitter.off("layerReordered", this.bindOnLayerReordered);

        this.childRenderers.forEach(r => r.destroy());
        this.childRenderers.clear();

        super.destroy();
    }
}