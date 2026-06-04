import { EventEmitter } from "eventemitter3";

import { BaseProperty } from "../properties/properties";
import { initializeProperties } from "../properties/properties.decorator";

export type PropertyUpdateOrigin = "preview" | "commit" | "undo" | "redo" | "external";
export type PropertyUpdateMeta = {
    origin: PropertyUpdateOrigin;
    source?: string;
};

export interface BaseObjectEvents {
    updateProperty: (
        key: string,
        value: unknown,
        meta?: PropertyUpdateMeta
    ) => void;
}

export abstract class BaseObject<T extends BaseObjectEvents = BaseObjectEvents> {
    public properties: Map<string, BaseProperty<any>> = new Map<string, BaseProperty<any>>();
    public eventEmitter: EventEmitter<T> = new EventEmitter<T>();
    public readonly objectId: string;
    private _destroyed: boolean = false;

    constructor(objectId: string, public readonly cloneFrom?: string) {
        initializeProperties(this);
        this.objectId = objectId;
    }

    public get destroyed(): boolean {
        return this._destroyed;
    }
    
    public getObjectChildren(): BaseObject[] {
        return [];
    }
    
    public traverseObjectTree(cb: (object: BaseObject<any>) => void): void {
        cb(this);
        this.getObjectChildren().forEach((child) => child.traverseObjectTree(cb));
    }

    public destroy(): void {
        if (this._destroyed) return;
    
        this._destroyed = true;
        this.eventEmitter.removeAllListeners();
    }

    protected emitUpdateProperty(key: string, value: unknown, meta?: PropertyUpdateMeta): void {
        const eventEmitter = this.eventEmitter as unknown as EventEmitter<BaseObjectEvents>;

        eventEmitter.emit("updateProperty", key, value, {
            origin: meta?.origin ?? "external",
            source: meta?.source,
        });
    }
}
