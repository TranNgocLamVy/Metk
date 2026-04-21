
export function Property(config: Type) {
    return function (target: any, propertyKey: string) {
        if (!target.constructor.properties) {
            target.constructor.properties = new Map<string, Type>();
        }
        target.constructor.properties.set(propertyKey, config);
    };
}

/** Base Type options */
export interface TypeOptions {
    visible?: boolean;
    disabled?: boolean;
    required?: boolean;
    requiredOnCreate?: boolean;
    label?: string;
    description?: string;
    tooltip?: string;
    defaultValue?: any;
}
export abstract class Type implements TypeOptions {
    public visible?: boolean;
    public disabled?: boolean;
    public required?: boolean;
    public defaultValue?: any;
    public label?: string;
    public description?: string;
    public tooltip?: string;
    constructor(options: TypeOptions) {
        this.visible = options.visible ?? true;
        this.disabled = options.disabled ?? false;
        this.required = options.required;
        this.defaultValue = options.defaultValue;
        this.label = options.label;
        this.description = options.description;
        this.tooltip = options.tooltip;
    }

    public parseValue(value: any): any { }
}


/** String type options */
export interface StringTypeOptions extends TypeOptions {
    maxLength?: number;
    minLength?: number;
    defaultValue?: string; // Default value for string type
}
export class StringType extends Type implements StringTypeOptions {
    public maxLength?: number;
    public minLength?: number;
    public override defaultValue?: string;
    constructor(options: StringTypeOptions) {
        super(options);
        this.maxLength = options.maxLength;
        this.minLength = options.minLength;
        this.defaultValue = options.defaultValue;
    }
}
export function String(options?: StringTypeOptions): StringType {
    return new StringType(options ? options : {});
}


/** Number type options */
export interface NumberTypeOptions extends TypeOptions {
    min?: number;
    max?: number;
    slider?: boolean;
    step?: number;
    unit?: string;
    defaultValue?: number; // Default value for number type
}
export class NumberType extends Type implements NumberTypeOptions {
    public min?: number;
    public max?: number;
    public slider?: boolean;
    public step?: number;
    public unit?: string;
    public override defaultValue?: number;

    constructor(options: NumberTypeOptions) {
        super(options);
        this.min = options.min;
        this.max = options.max;
        this.slider = options.slider ?? false;
        this.step = options.step ?? 0.1;
        this.defaultValue = options.defaultValue ?? 0;
    }
}
export function Number(options?: NumberTypeOptions): NumberType {
    return new NumberType(options ? options : {});
}


/** Integer type options */
export interface IntegerTypeOptions extends NumberTypeOptions {
    defaultValue?: number; // Default value for integer type
}
export class IntegerType extends NumberType implements IntegerTypeOptions {
    constructor(options: IntegerTypeOptions) {
        super(options);
        this.step = Math.floor(options.step ?? 1);
        this.defaultValue = options.defaultValue ? Math.floor(options.defaultValue) : undefined;
    }
}
export function Integer(options?: IntegerTypeOptions): IntegerType {
    return new IntegerType(options ? options : {});
}


/** Float type options */
export interface FloatTypeOptions extends NumberTypeOptions {
    precision?: number; // Number of decimal places
}
export class FloatType extends NumberType implements FloatTypeOptions {
    public precision?: number;
    constructor(options: FloatTypeOptions) {
        super(options);
        this.precision = options.precision ?? 2; // Default to 2 decimal places
    }
}
export function Float(options?: FloatTypeOptions): FloatType {
    return new FloatType(options ? options : {});
}


/** Boolean type options */
export interface BooleanTypeOptions extends TypeOptions {
    trueLabel?: string;
    falseLabel?: string;
    defaultValue?: boolean;
}
export class BooleanType extends Type implements BooleanTypeOptions {
    public trueLabel?: string;
    public falseLabel?: string;
    public override defaultValue?: boolean;
    constructor(options: BooleanTypeOptions) {
        super(options);
        this.trueLabel = options.trueLabel;
        this.falseLabel = options.falseLabel;
        this.defaultValue = options.defaultValue;
    }
}
export function Boolean(options?: BooleanTypeOptions): BooleanType {
    return new BooleanType(options ? options : {});
}



/** Array type options */
export interface ArrayTypeOptions extends TypeOptions {
    itemType: Type;
    defaultValue?: any[];
}
export class ArrayType extends Type implements ArrayTypeOptions {
    public itemType: Type;
    public override defaultValue?: any[];
    constructor(options: ArrayTypeOptions) {
        super(options);
        this.itemType = options.itemType;
        this.defaultValue = options.defaultValue;
    }
}
export function Array(options: ArrayTypeOptions): ArrayType {
    return new ArrayType(options);
}


/** Enum type options */
export interface EnumTypeOptions extends TypeOptions {
    options: string[];
    defaultValue?: string;
}
export class EnumType extends Type implements EnumTypeOptions {
    public options: string[];
    public override defaultValue?: string;
    constructor(options: EnumTypeOptions) {
        super(options);
        this.options = options.options;
        this.defaultValue = options.defaultValue;
    }
}
export function Enum(options: EnumTypeOptions): EnumType {
    return new EnumType(options);
}


/** Date type options */
export interface DateTypeOptions extends TypeOptions {
    min?: Date;
    max?: Date;
    defaultValue?: Date;
}
export class DateType extends Type implements DateTypeOptions {
    public min?: Date;
    public max?: Date;
    public override defaultValue?: Date;
    constructor(options: DateTypeOptions) {
        super(options);
        this.min = options.min;
        this.max = options.max;
        this.defaultValue = options.defaultValue;
    }
}
export function Date(options?: DateTypeOptions): DateType {
    return new DateType(options ? options : {});
}


/** Color type options */
export interface ColorTypeOptions extends TypeOptions {
    defaultValue?: string; // Hex color code
}
export class ColorType extends Type implements ColorTypeOptions {
    public override defaultValue?: string;
    constructor(options: ColorTypeOptions) {
        super(options);
        this.defaultValue = options.defaultValue;
    }
}
export function Color(options?: ColorTypeOptions): ColorType {
    return new ColorType(options ? options : {});
}