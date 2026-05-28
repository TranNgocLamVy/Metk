import {
    BooleanPropertyClass,
    BooleanPropertyOptions,
    ColorPropertyClass,
    ColorPropertyOptions,
    EnumPropertyClass,
    EnumPropertyOptions,
    NumberPropertyClass,
    NumberPropertyOptions,
    StringPropertyClass,
    StringPropertyOptions,
    BaseProperty,
    Point2DPropertyOptions,
    Point2DPropertyClass,
    Point3DPropertyOptions,
    Point3DPropertyClass,
    ImageSourcePropertyOptions,
    ImageSourcePropertyClass,
} from "./properties";

type PropertyOwner = {
    properties?: Map<string, BaseProperty<any>>;
};

type PropertyFactory<TTarget> = {
    key: string;
    create: (target: TTarget) => BaseProperty<TTarget>;
};

const propertyFactories = new WeakMap<object, PropertyFactory<any>[]>();

function addPropertyFactory<TTarget>(prototype: object, factory: PropertyFactory<TTarget>): void {
    const factories = propertyFactories.get(prototype) ?? [];
    propertyFactories.set(prototype, [...factories.filter(item => item.key !== factory.key), factory]);
}

function getPropertyFactories(target: object): PropertyFactory<any>[] {
    const result: PropertyFactory<any>[] = [];
    let prototype = Object.getPrototypeOf(target);

    while (prototype && prototype !== Object.prototype) {
        const factories = propertyFactories.get(prototype);
        if (factories) {
            result.unshift(...factories);
        }
        prototype = Object.getPrototypeOf(prototype);
    }

    return result;
}

export function ensurePropertiesMap(target: PropertyOwner): Map<string, BaseProperty<any>> {
    if (!(target.properties instanceof Map)) {
        target.properties = new Map<string, BaseProperty<any>>();
    }
    return target.properties;
}

export function initializeProperties<TTarget extends object>(target: TTarget & PropertyOwner): Map<string, BaseProperty<any>> {
    const properties = ensurePropertiesMap(target);
    const factories = getPropertyFactories(target);
    for (const factory of factories) {
        properties.set(factory.key, factory.create(target));
    }
    return properties;
}

export function StringProperty<TTarget = unknown>(options: StringPropertyOptions<TTarget>): PropertyDecorator {
    return function (target, propertyKey) {
        const key = propertyKey.toString();
        addPropertyFactory<TTarget>(target, { key, create: instance => new StringPropertyClass<TTarget>(instance, options)});
    };
}

export function NumberProperty<TTarget = unknown>(options: NumberPropertyOptions<TTarget>): PropertyDecorator {
    return function (target, propertyKey) {
        const key = propertyKey.toString();
        addPropertyFactory<TTarget>(target, { key, create: instance => new NumberPropertyClass<TTarget>(instance, options)});
    };
}

export function BooleanProperty<TTarget = unknown>(options: BooleanPropertyOptions<TTarget>): PropertyDecorator {
    return function (target, propertyKey) {
        const key = propertyKey.toString();
        addPropertyFactory<TTarget>(target, { key, create: instance => new BooleanPropertyClass<TTarget>(instance, options)});
    };
}

export function EnumProperty<TTarget = unknown>(options: EnumPropertyOptions<TTarget>): PropertyDecorator {
    return function (target, propertyKey) {
        const key = propertyKey.toString();
        addPropertyFactory<TTarget>(target, { key, create: instance => new EnumPropertyClass<TTarget>(instance, options)});
    };
}

export function ColorProperty<TTarget = unknown>(options: ColorPropertyOptions<TTarget>): PropertyDecorator {
    return function (target, propertyKey) {
        const key = propertyKey.toString();
        addPropertyFactory<TTarget>(target, { key, create: instance => new ColorPropertyClass<TTarget>(instance, options)});
    };
}

export function Point2DProperty<TTarget>(options: Point2DPropertyOptions<TTarget>): PropertyDecorator {
    return function (target, propertyKey) {
        const key = propertyKey.toString();
        addPropertyFactory<TTarget>(target, { key, create: instance => new Point2DPropertyClass<TTarget>(instance, options)});
    };
}

export function Point3DProperty<TTarget>(options: Point3DPropertyOptions<TTarget>): PropertyDecorator {
    return function (target, propertyKey) {
        const key = propertyKey.toString();
        addPropertyFactory<TTarget>(target, { key, create: instance => new Point3DPropertyClass<TTarget>(instance, options)});
    };
}

export function ImageSourceProperty<TTarget>(options: ImageSourcePropertyOptions<TTarget>): PropertyDecorator {
    return function (target, propertyKey) {
        const key = propertyKey.toString();
        addPropertyFactory<TTarget>(target, { key, create: instance => new ImageSourcePropertyClass<TTarget>(instance, options)});
    };
}