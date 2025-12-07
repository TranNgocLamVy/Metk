import { EventEmitter } from "eventemitter3";

import { Result } from "@/shared/types/result";

export interface BaseObjectEvents {
    updateProperty: (key: string, value: any) => void
}

export abstract class BaseObject<T extends BaseObjectEvents = BaseObjectEvents> {
    public properties: Map<string, any>;
    public eventEmitter: EventEmitter<T> = new EventEmitter<T>();
    constructor() {
        const cls = this.constructor as any;
        this.properties = cls.properties ? new Map(cls.properties) : new Map();
    }

    public getProperty(key: string): any {
        return (this as any)[key];
    }

    public async setProperty(key: string, value: any): Promise<Result> {
    try {
        (this as any)[key] = value;
        (this.eventEmitter as any).emit("updateProperty", { key, value });
        return { status: "Success", data: null };
    } catch (error) {
        return { status: "Error", message: error as any };
    }
}
}