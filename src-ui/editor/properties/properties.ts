import { ImageSourceData } from "@/shared/schema/image-source.schema";
import { Result } from "@/shared/types/result";
import { v4 as uuidv4 } from "uuid";
import type { PropertyUpdateMeta } from "@/editor/model/base-object";

type ResolvableBoolean<TTarget> = ((target: TTarget) => boolean) | boolean;
export type ResolvableString<TTarget> = ((target: TTarget) => string) | string;

export interface BasePropertyOptions<TTarget> {
    label: string;
    group?: ResolvableString<TTarget>;
    order?: number;
    readonly?: ResolvableBoolean<TTarget>;
    visible?: ResolvableBoolean<TTarget>;
    disabled?: ResolvableBoolean<TTarget>;
    set?: (target: TTarget, value: any, meta?: PropertyUpdateMeta) => void;
    get: (target: TTarget) => any;
    validate?: (target: TTarget, value: any) => Result;
}

export class BaseProperty<TTarget> {
    public readonly id: string;
    public readonly key: string;
    public readonly label: string;
    public readonly group: () => string;
    public readonly order: number;
    public readonly readonly: () => boolean;
    public readonly visible: () => boolean;
    public readonly disabled: () => boolean;
    public readonly setter: (value: any, meta?: PropertyUpdateMeta) => void;
    public readonly getter: () => any;
    public readonly validate: (value: any) => Result;

    constructor(
        public readonly target: TTarget,
        key: string,
        options: BasePropertyOptions<TTarget>,
    ) {
        this.id = uuidv4();
        this.key = key;
        this.label = options.label;
        this.group = () => {
            if (typeof options.group === "function") {
                return options.group(this.target);
            }
            return options.group ?? "General";
        };
        this.order = options.order ?? 0;
        this.readonly = () => typeof options.readonly === "function" ? options.readonly(this.target) : (options.readonly ?? false);
        this.visible = () => typeof options.visible === "function" ? options.visible(this.target) : (options.visible ?? true);
        this.disabled = () => typeof options.disabled === "function" ? options.disabled(this.target) : (options.disabled ?? false);
        this.setter = (value, meta) => options.set ? options.set(this.target, value, meta) : {};
        this.getter = () => options.get(this.target);
        this.validate = (value) => options.validate ? options.validate(this.target, value) : Result.Success();
    }
}

export interface StringPropertyOptions<TTarget = unknown> extends BasePropertyOptions<TTarget> {
    maxLength?: number;
    minLength?: number;
    set?: (target: TTarget, value: string, meta?: PropertyUpdateMeta) => void;
    get: (target: TTarget) => string;
    validate?: (target: TTarget, value: string) => Result;
}

export class StringPropertyClass<TTarget> extends BaseProperty<TTarget> {
    public readonly maxLength: number | undefined;
    public readonly minbLength: number | undefined;
    constructor(target: TTarget, key: string, options: StringPropertyOptions<TTarget>) {
        super(target, key, options);
        this.maxLength = options.maxLength;
        this.minbLength = options.minLength;
    }
}

export interface NumberPropertyOptions<TTarget = unknown> extends BasePropertyOptions<TTarget> {
    min?: number;
    max?: number;
    precision?: number;
    slider?: {
        range: [number, number];
        step: number;
        interactive?: boolean;
    };
    unit?: string;
    set?: (target: TTarget, value: number, meta?: PropertyUpdateMeta) => void;
    get: (target: TTarget) => number;
    validate?: (target: TTarget, value: number) => Result;
}

export class NumberPropertyClass<TTarget> extends BaseProperty<TTarget> {
    public readonly min: number | undefined;
    public readonly max: number | undefined;
    public readonly precision: number | undefined;
    public readonly slider: { range: [number, number]; step: number; interactive?: boolean } | undefined;
    public readonly unit: string | undefined;

    constructor(target: TTarget, key: string, options: NumberPropertyOptions<TTarget>) {
        super(target, key, options);
        this.min = options.min;
        this.max = options.max;
        this.precision = options.precision;
        this.slider = options.slider;
        this.unit = options.unit;
    }
}

export interface BooleanPropertyOptions<TTarget> extends BasePropertyOptions<TTarget> {
    set?: (target: TTarget, value: boolean, meta?: PropertyUpdateMeta) => void;
    get: (target: TTarget) => boolean;
    validate?: (target: TTarget, value: boolean) => Result;
}

export class BooleanPropertyClass<TTarget> extends BaseProperty<TTarget> {
    constructor(target: TTarget, key: string, options: BooleanPropertyOptions<TTarget>) {
        super(target, key, options);
    }
}

export interface EnumPropertyOption {
    label: string;
    value: string | number;
}

export interface EnumPropertyOptions<TTarget> extends BasePropertyOptions<TTarget> {
    options: (target: TTarget) => EnumPropertyOption[] | EnumPropertyOption[];
    set?: (target: TTarget, value: string, meta?: PropertyUpdateMeta) => void;
    get: (target: TTarget) => string;
    validate?: (target: TTarget, value: string) => Result;
}

export class EnumPropertyClass<TTarget> extends BaseProperty<TTarget> {
    public readonly options: () => EnumPropertyOption[];

    constructor(target: TTarget, key: string, options: EnumPropertyOptions<TTarget>) {
        super(target, key, options);
        this.options = () => typeof options.options === "function" ? options.options(this.target) : options.options;
    }
}

export interface ColorPropertyOptions<TTarget> extends BasePropertyOptions<TTarget> {
    set?: (target: TTarget, value: string, meta?: PropertyUpdateMeta) => void;
    get: (target: TTarget) => string;
    validate?: (target: TTarget, value: string) => Result;
}

export class ColorPropertyClass<TTarget> extends BaseProperty<TTarget> {
    constructor(target: TTarget, key: string, options: ColorPropertyOptions<TTarget>) {
        super(target, key, options);
    }
}

export interface Point2DPropertyOptions<TTarget> extends BasePropertyOptions<TTarget> {
    pointLabel?: { x: string; y: string };
    set?: (target: TTarget, value: Point2D, meta?: PropertyUpdateMeta) => void;
    get: (target: TTarget) => Point2D;
    validate?: (target: TTarget, value: Point2D) => Result;
}

export class Point2DPropertyClass<TTarget> extends BaseProperty<TTarget> {
    public readonly pointLabel: { x: string; y: string };

    constructor(target: TTarget, key: string, options: Point2DPropertyOptions<TTarget>) {
        super(target, key, options);
        this.pointLabel = options.pointLabel ?? { x: "X", y: "Y" };
    }
}

type ImageSourcePropertyCommonOptions<TTarget> = Omit<BasePropertyOptions<TTarget>, "set" | "get" | "validate"> & {
    get: (target: TTarget) => ImageSourceData;
    validate?: (target: TTarget, value: ImageSourceData) => Result;
};

type ImageSourcePropertyReadonlyOptions<TTarget> = {
    set?: never;
    absToRef?: never;
};

type ImageSourcePropertyWritableOptions<TTarget> = {
    set: (target: TTarget, value: ImageSourceData, meta?: PropertyUpdateMeta) => void;
    absToRef: (target: TTarget, absPath: string) => string;
};

export type ImageSourcePropertyOptions<TTarget> =
    ImageSourcePropertyCommonOptions<TTarget> &
    (
        | ImageSourcePropertyReadonlyOptions<TTarget>
        | ImageSourcePropertyWritableOptions<TTarget>
    );

export class ImageSourcePropertyClass<TTarget> extends BaseProperty<TTarget> {
    public readonly absToRef: (absPath: string) => string;

    constructor(target: TTarget, key: string, options: ImageSourcePropertyOptions<TTarget>) {
        super(target, key, options);
        this.absToRef = (value) => options.absToRef ? options.absToRef(this.target, value) : value;
    }
}
