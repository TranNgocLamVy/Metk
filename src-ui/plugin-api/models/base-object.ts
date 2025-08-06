import { EventEmitter } from 'eventemitter3';
import { Type } from '../properties';

export abstract class BaseObject<TEvents extends EventEmitter.ValidEventTypes> extends EventEmitter<TEvents> { 
    public properties: Map<string, Type>;
    constructor() {
        super();
        const cls = this.constructor as any
        this.properties = cls.properties ? new Map(cls.properties) : new Map();
    }
}