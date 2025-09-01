import { EventEmitter } from "eventemitter3";

import { Type } from "@/plugin-api";

import { Result } from "../interface/common/result";

export abstract class BaseObject<TEvents extends EventEmitter.ValidEventTypes> extends EventEmitter<TEvents> { 
    public properties: Map<string, Type>;
    constructor() {
        super();
        const cls = this.constructor as any
        this.properties = cls.properties ? new Map(cls.properties) : new Map();
    }

    public getProperty(key: string): Type {
        throw new Error("Method not implemented.");
    }

    public setProperty(key: string, value: Type): Result {
        throw new Error("Method not implemented.");
    }
}