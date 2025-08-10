export interface FieldTypeMap {
    text: string;
    number: number;
    checkbox: boolean;
    filePath: string[];
    folderPath: string;
}

export type FieldType = keyof FieldTypeMap;

export type Simplify<T> = { [K in keyof T]: T[K] } & {};

export type ShapeFromInputs<I extends readonly Field[]> = {
    [K in I[number]as K["name"]]: FieldTypeMap[K["type"]];
};

export type FormDialogOptions<I extends readonly Field[] = readonly Field[]> = {
    title: string;
    description?: string;
    okText?: string;
    cancelText?: string;
    inputs: I;
    validateBeforeSubmit?: (values: Simplify<ShapeFromInputs<I>>) => ValidateResult;
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
    validate?: (value: any) => ValidateResult;
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
    validate?: (value: number) => ValidateResult;
};

export type CheckboxFieldInput = BaseField & {
    type: "checkbox";
    defaultValue?: boolean;
};

export type FilePathFieldInput = BaseField & {
    type: "filePath";
    multiple?: boolean;
    filter?: FileFilter;
    defaultValue?: string[];
};

export type FileFilter = {
    name: string;
    extensions: string[];
}

export type FolderPathFieldInput = BaseField & {
    type: "folderPath";
    defaultValue?: string;
};

export type Field = TextFieldInput | NumberFieldInput | CheckboxFieldInput | FilePathFieldInput | FolderPathFieldInput;