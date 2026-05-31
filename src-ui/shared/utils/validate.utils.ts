type NumberValidationInput = {
    value: unknown;
    defaultValue: number;
    min?: number;
    max?: number;
    integer?: boolean;
};

type RequiredNumberValidationInput = Omit<NumberValidationInput, "defaultValue"> & {
    field: string;
};

const isValidNumber = ( value: unknown, options: { min?: number; max?: number; integer?: boolean } = {} ): value is number => {
    if (typeof value !== "number") return false;
    if (!Number.isFinite(value)) return false;
    if (options.integer && !Number.isInteger(value)) return false;
    if (options.min !== undefined && value < options.min) return false;
    if (options.max !== undefined && value > options.max) return false;
    return true;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

const formatValue = (value: unknown): string => {
    if (typeof value === "string") return `"${value}"`;
    return String(value);
};

export const validate = {
    string(input: { value: unknown; defaultValue: string }): string {
        return typeof input.value === "string" ? input.value : input.defaultValue;
    },

    requiredString(input: { value: unknown; field: string }): string {
        if (typeof input.value === "string") return input.value;
        throw new Error(`${input.field} must be a string`);
    },

    number(input: NumberValidationInput): number {
        return isValidNumber(input.value, input) ? input.value : input.defaultValue;
    },

    requiredNumber(input: RequiredNumberValidationInput): number {
        if (isValidNumber(input.value, input)) return input.value;
        throw new Error(`${input.field} must be a valid number`);
    },

    boolean(input: { value: unknown; defaultValue: boolean }): boolean {
        return typeof input.value === "boolean" ? input.value : input.defaultValue;
    },

    requiredBoolean(input: { value: unknown; field: string }): boolean {
        if (typeof input.value === "boolean") return input.value;
        throw new Error(`${input.field} must be a boolean`);
    },

    array<T>(input: { value: unknown; defaultValue: T[] }): T[] {
        return Array.isArray(input.value) ? input.value as T[] : input.defaultValue;
    },

    requiredArray<T>(input: { value: unknown; field: string }): T[] {
        if (Array.isArray(input.value)) return input.value as T[];
        throw new Error(`${input.field} must be an array`);
    },

    object<T extends object>(input: { value: unknown; defaultValue: T }): T {
        return isPlainObject(input.value) ? input.value as T : input.defaultValue;
    },

    requiredObject<T>(input: { value: unknown; field: string }): Record<string, unknown> {
        if (isPlainObject(input.value)) return input.value;
        throw new Error(`${input.field} must be an object`);
    },

    enum<T extends string>(input: { value: unknown; values: readonly T[]; defaultValue: T }): T {
        return typeof input.value === "string" && input.values.includes(input.value as T) ? input.value as T : input.defaultValue;
    },

    requiredEnum<T extends string>(input: { value: unknown; values: readonly T[]; field: string }): T {
        if (typeof input.value === "string" && input.values.includes(input.value as T)) {
            return input.value as T;
        }
        throw new Error(`${input.field} must be one of: ${input.values.join(", ")}. Received ${formatValue(input.value)}`);
    },
};
