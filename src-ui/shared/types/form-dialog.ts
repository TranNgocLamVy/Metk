export interface FieldTypeMap {
    text: string;
    number: number;
    checkbox: boolean;
    filePath: string[];
    folderPath: string;
    color: string;
    group: Record<string, any>;
}

export type FieldType = keyof FieldTypeMap;

export type Simplify<T> = { [K in keyof T]: T[K] } & {};

export type ShapeFromInputs<I extends readonly Field[]> = {
    [K in I[number] as K["name"]]: K extends GroupFieldInput
        ? Simplify<ShapeFromInputs<K["inputs"]>> // <--- RECURSIVE MAGIC
        : FieldTypeMap[K["type"]];
};

export type FormDialogOptions<I extends readonly Field[] = readonly Field[]> = {
    title: string;
    description?: string;
    okText?: string;
    cancelText?: string;
    size?: "sm" | "md" | "lg" | "xl" | "2xl";
    inputs: I;
    validateBeforeSubmit?: (values: Simplify<ShapeFromInputs<I>>) => Promise<ValidateResult>;
};

export type FormDialogItem<I extends readonly Field[] = readonly Field[]> = FormDialogOptions<I> & {
    id: string;
    resolve: (result: Simplify<ShapeFromInputs<I>> | null) => void;
};

export type ValidateResult = {
    valid: boolean;
    message?: string;
}

export type BaseField = {
    id: string;
    name: string;
    type: keyof FieldTypeMap;
    label: string;
    placeholder?: string;
    defaultValue?: any;
    required?: boolean;
    validate?: (value: any) => Promise<ValidateResult>;
};

export type TextFieldInput = BaseField & {
    type: "text";
    minLength?: number;
    maxLength?: number;
    defaultValue?: string;
    validate?: (value: string) => ValidateResult;
};

export type NumberFieldInput = BaseField & {
    type: "number";
    min?: number;
    max?: number;
    defaultValue?: number;
    validate?: (value: number) => Promise<ValidateResult>;
};

export type SelectFieldInput = BaseField & {
    type: "select";
    defaultValue?: string;
    options: {
        label: string;
        value: string;
    }[];
};

export type CheckboxFieldInput = BaseField & {
    type: "checkbox";
    defaultValue?: boolean;
};

export type FilePathFieldInput = BaseField & {
    type: "filePath";
    multiple?: boolean;
    filter?: FileFilter;
    defaultDir?: string;
    defaultValue?: string[];
};

export type FileFilter = {
    name: string;
    extensions: string[];
}

export type FolderPathFieldInput = BaseField & {
    type: "folderPath";
    defaultDir?: string;
    defaultValue?: string;
};

export type GroupFieldInput = BaseField & {
    type: "group";
    inputs: readonly Field[];
    orientation?: "vertical" | "horizontal";
    visible?: boolean;
    validate?: (value: Record<string, any>) => Promise<ValidateResult>;
};

export type ColorSelectFieldInput = BaseField & {
    type: "color";
    defaultValue?: string;
    validate?: (value: string) => Promise<ValidateResult>;
};

export interface FieldTypeMap {
    text: string;
    number: number;
    checkbox: boolean;
    filePath: string[];
    folderPath: string;
    color: string;
    select: string;
    group: Record<string, any>;
}

export type Field = 
    | TextFieldInput 
    | NumberFieldInput 
    | CheckboxFieldInput 
    | SelectFieldInput 
    | FilePathFieldInput 
    | FolderPathFieldInput 
    | ColorSelectFieldInput
    | GroupFieldInput;