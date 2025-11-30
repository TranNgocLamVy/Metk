import { EventEmitter } from "eventemitter3";

import { Result } from "@/shared/types/result";

export abstract class BaseObject extends EventEmitter {
    public properties: Map<string, any>;
    public static event = {
        UpdateProperty: "UpdateProperty"
    }
    constructor() {
        super();
        const cls = this.constructor as any;
        this.properties = cls.properties ? new Map(cls.properties) : new Map();
    }

    public getProperty(key: string): any {
        return (this as any)[key];
    }

    public async setProperty(key: string, value: any): Promise<Result> {
        try {
            (this as any)[key] = value;
            this.emit(BaseObject.event.UpdateProperty);
            return { status: "Success" };
        } catch (error) {
            return { status: "Error", message: error as any };
        }
    }
}