import { EventEmitter } from "eventemitter3";

import { Result } from "@/shared/types/result";
import { BaseProperty } from "../properties/properties";
import { initializeProperties } from "../properties/properties.decorator";

export interface BaseObjectEvents {
    updateProperty: (key: string, value: any) => void
}

export abstract class BaseObject<T extends BaseObjectEvents = BaseObjectEvents> {
    public properties: Map<string, BaseProperty<any>> = new Map<string, BaseProperty<any>>();
    public eventEmitter: EventEmitter<T> = new EventEmitter<T>();
    public readonly objectId: string;

    constructor(objectId: string) {
        initializeProperties(this);
        this.objectId = objectId;
    }

    public getProperty(key: string): any {
        return (this as any)[key];
    }

    public async setProperty(key: string, value: any): Promise<Result> {
        try {
            (this as any)[key] = value;
            (this.eventEmitter as any).emit("updateProperty", { key, value });
            return Result.Success();
        } catch (error) {
            return Result.Error("Failed to set property: " + (error as any).toString());
        }
    }

    public destroy(): void {

    }
}