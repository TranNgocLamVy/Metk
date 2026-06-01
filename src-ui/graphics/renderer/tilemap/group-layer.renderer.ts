import { BaseLayer, IGroupLayer } from "@/editor/model/tilemap/layer/base-layer";
import { GroupLayer } from "@/editor/model/tilemap/layer/group-layer";
import { RootLayer } from "@/editor/model/tilemap/layer/root-layer";
import { TileLayer } from "@/editor/model/tilemap/layer/tile-layer";
import { Tilemap } from "@/editor/model/tilemap/tilemap";

import { EntityLayer } from "@/editor/model/tilemap/layer/entity-layer";
import { ImageLayer } from "@/editor/model/tilemap/layer/image-layer";
import { RuleLayer } from "@/editor/model/tilemap/layer/rule-layer";
import { Viewport } from "pixi-viewport";
import { BaseLayerRenderer } from "./base-layer.renderer";
import { EntityLayerRenderer } from "./entity-layer.renderer";
import { ImageLayerRenderer } from "./image-layer.renderer";
import { RuleLayerRenderer } from "./rule-layer.renderer";
import { TileLayerRenderer } from "./tile-layer.renderer";

type GroupLike = GroupLayer | RootLayer;

type CreateGroupRendererContext = {
    layer: GroupLike;
    tilemap: Tilemap;
    viewport: Viewport;
}

export class GroupLayerRenderer extends BaseLayerRenderer<GroupLike> {
    private viewport: Viewport;
    private childRenderers: Map<string, BaseLayerRenderer> = new Map();

    private bindOnLayerAdded: (layerId: string) => void
    private bindOnLayerRemoved: (layerId: string) => void
    private bindOnLayerReordered: () => void

    constructor(createContext: CreateGroupRendererContext) {
        super(createContext.layer, createContext.tilemap);

        this.viewport = createContext.viewport;
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
            renderer = new TileLayerRenderer({ layer: childLayer, tilemap: this.tilemap, viewport: this.viewport });
        } else if (childLayer instanceof RuleLayer) {
            renderer = new RuleLayerRenderer({ layer: childLayer, tilemap: this.tilemap, viewport: this.viewport });
        } else if (childLayer instanceof ImageLayer) {
            renderer = new ImageLayerRenderer({ layer: childLayer, tilemap: this.tilemap, viewport: this.viewport });
        } else if (childLayer instanceof EntityLayer) {
            renderer = new EntityLayerRenderer({ layer: childLayer, tilemap: this.tilemap, viewport: this.viewport });
        } else if (childLayer instanceof GroupLayer) {
            renderer = new GroupLayerRenderer({ layer: childLayer, tilemap: this.tilemap, viewport: this.viewport });
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