import { EventEmitter } from "eventemitter3";

import { BaseProperty } from "../properties/properties";
import { initializeProperties } from "../properties/properties.decorator";

export interface BaseObjectEvents {
    updateProperty: (key: string, value: any) => void
}

export abstract class BaseObject<T extends BaseObjectEvents = BaseObjectEvents> {
    public properties: Map<string, BaseProperty<any>> = new Map<string, BaseProperty<any>>();
    public eventEmitter: EventEmitter<T> = new EventEmitter<T>();
    public readonly objectId: string;
    private _destroyed: boolean = false;

    constructor(objectId: string) {
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
}