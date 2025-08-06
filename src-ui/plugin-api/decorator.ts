import { Type } from "./properties";

export function Property(config: Type) {
    return function (target: any, propertyKey: string) {
        if (!target.constructor.properties) {
            target.constructor.properties = new Map<string, Type>();
        }
        target.constructor.properties.set(propertyKey, config);
    };
}