import type { BaseObject, PropertyUpdateMeta } from "@/editor/model/base-object";
import type { BaseLayer } from "@/editor/model/tilemap/layer/base-layer";
import type { Tilemap } from "@/editor/model/tilemap/tilemap";

import type { TilemapSession } from "./tilemap.session";

type StructureEventName = "layerAdded" | "layerRemoved" | "layerReordered";
type ContentEventName = "tilesChanged" | "rulesetRefsOutputChanged" | "entitiesChanged";

export class TilemapChangeObserver {
    private disposers: Array<() => void> = [];
    private selectionReconcileQueued: boolean = false;
    private isBound: boolean = false;

    constructor(
        private readonly session: TilemapSession,
        private readonly tilemap: Tilemap,
    ) {}

    public bind(): void {
        this.unbind();
        this.isBound = true;

        this.bindObject(this.tilemap);

        this.tilemap.rootLayer.traverse((layer) => {
            this.bindObject(layer);
            this.bindLayerStructureEvents(layer);
            this.bindLayerContentEvents(layer);
        });
    }

    public unbind(): void {
        this.isBound = false;
        this.disposers.forEach(dispose => dispose());
        this.disposers = [];
    }

    private bindObject(object: BaseObject<any>): void {
        const onUpdateProperty = (_key: string, _value: unknown, meta?: PropertyUpdateMeta) => {
            if (meta?.origin === "preview") return;
            this.session.markAsDirty();
        };

        object.eventEmitter.on("updateProperty", onUpdateProperty);
        this.disposers.push(() => {
            object.eventEmitter.off("updateProperty", onUpdateProperty);
        });
    }

    private bindLayerStructureEvents(layer: BaseLayer<any>): void {
        const refresh = () => {
            this.session.markAsDirty();
            this.queueSelectedLayerReconciliation();
            this.bind();
        };

        const eventEmitter = layer.eventEmitter as any;
        const eventNames: StructureEventName[] = ["layerAdded", "layerRemoved", "layerReordered"];

        eventNames.forEach((eventName) => {
            eventEmitter.on(eventName, refresh);
            this.disposers.push(() => {
                eventEmitter.off(eventName, refresh);
            });
        });
    }

    private bindLayerContentEvents(layer: BaseLayer<any>): void {
        const markChanged = () => {
            this.session.markAsDirty();
        };

        const eventEmitter = layer.eventEmitter as any;
        const eventNames: ContentEventName[] = ["tilesChanged", "rulesetRefsOutputChanged", "entitiesChanged"];

        eventNames.forEach((eventName) => {
            eventEmitter.on(eventName, markChanged);
            this.disposers.push(() => {
                eventEmitter.off(eventName, markChanged);
            });
        });
    }

    private queueSelectedLayerReconciliation(): void {
        if (this.selectionReconcileQueued) return;

        this.selectionReconcileQueued = true;
        queueMicrotask(() => {
            this.selectionReconcileQueued = false;
            if (!this.isBound) return;

            this.session.reconcileSelectedLayersWithLayerTree();
        });
    }
}
